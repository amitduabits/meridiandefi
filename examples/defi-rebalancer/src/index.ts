// ---------------------------------------------------------------------------
// Meridian Demo — DeFi Portfolio Rebalancer on Arbitrum Sepolia
// ---------------------------------------------------------------------------
//
// This demo showcases the Meridian SDK by running an autonomous agent that:
//   1. Reads token balances on Arbitrum Sepolia
//   2. Computes portfolio allocation drift
//   3. Uses Claude to reason about whether to rebalance
//   4. Executes test swaps when drift exceeds threshold
//   5. Logs all decisions with full reasoning chain
// ---------------------------------------------------------------------------

import chalk from "chalk";
import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  formatUnits,
  parseEther,
  type PublicClient,
  type WalletClient,
  type Chain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import Anthropic from "@anthropic-ai/sdk";

import {
  Agent,
  EventBus,
  type ISenseProvider,
  type IThinkProvider,
  type IActProvider,
  type IMemoryProvider,
  type MarketSnapshot,
  type LLMRequest,
  type LLMResponse,
  type TxResult,
  type DecisionRecord,
} from "@meridian/sdk";

import { config, TOKENS } from "./config.js";
import { createRebalancerStrategy } from "./rebalancer-strategy.js";
import {
  printBanner,
  printStartup,
  printCycleHeader,
  printPortfolioTable,
  printReasoning,
  printAction,
  printWaiting,
  printError,
  type AllocationRow,
} from "./display.js";

// ---------------------------------------------------------------------------
// Arbitrum Sepolia chain definition for viem
// ---------------------------------------------------------------------------

const arbitrumSepolia: Chain = {
  id: 421614,
  name: "Arbitrum Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [config.rpcUrl] },
  },
  blockExplorers: {
    default: { name: "Arbiscan", url: "https://sepolia.arbiscan.io" },
  },
  testnet: true,
};

// ---------------------------------------------------------------------------
// ERC-20 ABI (minimal — balanceOf only)
// ---------------------------------------------------------------------------

const erc20Abi = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// ---------------------------------------------------------------------------
// viem clients
// ---------------------------------------------------------------------------

const account = privateKeyToAccount(config.privateKey);

const publicClient: PublicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(config.rpcUrl),
});

const walletClient: WalletClient = createWalletClient({
  account,
  chain: arbitrumSepolia,
  transport: http(config.rpcUrl),
});

// ---------------------------------------------------------------------------
// Anthropic client
// ---------------------------------------------------------------------------

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

// ---------------------------------------------------------------------------
// Shared state — used by the display between provider calls.
// ---------------------------------------------------------------------------

let lastAllocationRows: AllocationRow[] = [];
let lastBlockNumber = 0;
let lastTotalValueUsd = 0;

// ---------------------------------------------------------------------------
// Mock price oracle (testnet tokens don't have real prices)
// ---------------------------------------------------------------------------

const MOCK_PRICES: Record<string, number> = {
  ETH: 3_400,
  USDC: 1.0,
  WBTC: 97_000,
};

function getTokenPrice(symbol: string): number {
  return MOCK_PRICES[symbol] ?? 1;
}

// ---------------------------------------------------------------------------
// Sense provider — reads on-chain balances and computes allocations.
// ---------------------------------------------------------------------------

class RebalancerSenseProvider implements ISenseProvider {
  async gather(_agentId: string, _chainIds: number[]): Promise<MarketSnapshot> {
    const blockNumber = Number(await publicClient.getBlockNumber());
    lastBlockNumber = blockNumber;

    const balances: Record<string, string> = {};
    const prices: Record<string, number> = {};
    let totalValueUsd = 0;

    for (const token of TOKENS) {
      let balance: bigint;

      if (token.address === "0x0000000000000000000000000000000000000000") {
        // Native ETH
        balance = await publicClient.getBalance({ address: account.address });
      } else {
        // ERC-20
        try {
          balance = (await publicClient.readContract({
            address: token.address,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [account.address],
          })) as bigint;
        } catch {
          // Token contract may not exist on testnet — use 0
          balance = 0n;
        }
      }

      const formatted = formatUnits(balance, token.decimals);
      balances[token.symbol] = formatted;
      prices[token.symbol] = getTokenPrice(token.symbol);
      totalValueUsd += Number(formatted) * prices[token.symbol]!;
    }

    lastTotalValueUsd = totalValueUsd;

    // Compute allocation rows for display
    lastAllocationRows = TOKENS.map((token) => {
      const bal = Number(balances[token.symbol] ?? "0");
      const valueUsd = bal * (prices[token.symbol] ?? 0);
      const currentPct = totalValueUsd > 0 ? (valueUsd / totalValueUsd) * 100 : 0;
      const driftPct = currentPct - token.targetPct * 100;
      return {
        token,
        currentPct,
        driftPct,
        balanceFormatted: bal.toFixed(token.decimals === 18 ? 4 : 2),
        valueUsd,
      };
    });

    const gasPrice = await publicClient.getGasPrice();

    return {
      timestamp: Date.now(),
      prices,
      balances,
      positions: lastAllocationRows.map((r) => ({
        token: r.token.symbol,
        balance: r.balanceFormatted,
        valueUsd: r.valueUsd,
        currentPct: r.currentPct,
        targetPct: r.token.targetPct * 100,
        driftPct: r.driftPct,
      })),
      gasPerChain: { [config.chainId]: Number(formatUnits(gasPrice, 9)) },
      blockNumbers: { [config.chainId]: blockNumber },
    };
  }
}

// ---------------------------------------------------------------------------
// Think provider — uses Claude to reason about the portfolio.
// ---------------------------------------------------------------------------

class RebalancerThinkProvider implements IThinkProvider {
  async reason(request: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();
    const response = await anthropic.messages.create({
      model: config.claudeModel,
      max_tokens: request.maxTokens ?? 1024,
      system: request.systemPrompt ?? "",
      messages: [{ role: "user", content: request.prompt }],
    });

    const content =
      response.content[0]?.type === "text" ? response.content[0].text : "";

    return {
      content,
      model: config.claudeModel,
      provider: "anthropic",
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      latencyMs: Date.now() - start,
      cached: false,
    };
  }
}

// ---------------------------------------------------------------------------
// Act provider — executes swaps (or simulates in dry-run mode).
// ---------------------------------------------------------------------------

class RebalancerActProvider implements IActProvider {
  async execute(
    action: string,
    params: Record<string, unknown>,
    chainId: number,
    dryRun: boolean,
  ): Promise<TxResult | null> {
    if (action === "HOLD" || action === "none") {
      return null;
    }

    const tokenIn = String(params["tokenIn"] ?? "ETH");
    const tokenOut = String(params["tokenOut"] ?? "USDC");
    const amount = String(params["amount"] ?? "0.001");

    if (dryRun) {
      console.log();
      printAction(
        `SWAP ${amount} ${tokenIn} -> ${tokenOut} (DRY RUN)`,
        null,
        null,
      );
      return {
        hash: `0x${"0".repeat(64)}`,
        chainId,
        status: "confirmed",
        timestamp: Date.now(),
      };
    }

    // In live mode, send a minimal ETH transfer to demonstrate on-chain tx.
    // A real implementation would call the Uniswap V3 router.
    try {
      const txHash = await walletClient.sendTransaction({
        to: account.address, // self-transfer as demo
        value: parseEther("0.0001"),
        chain: arbitrumSepolia,
        account,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      return {
        hash: txHash,
        chainId,
        status: receipt.status === "success" ? "confirmed" : "failed",
        blockNumber: Number(receipt.blockNumber),
        gasUsed: receipt.gasUsed,
        effectiveGasPrice: receipt.effectiveGasPrice,
        timestamp: Date.now(),
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      printError(`Transaction failed: ${msg}`);
      return {
        hash: "0x" + "f".repeat(64),
        chainId,
        status: "failed",
        timestamp: Date.now(),
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Memory provider — in-memory storage for the demo.
// ---------------------------------------------------------------------------

class RebalancerMemoryProvider implements IMemoryProvider {
  private decisions: DecisionRecord[] = [];

  async store(record: DecisionRecord): Promise<void> {
    this.decisions.push(record);
  }

  async getRecent(_agentId: string, limit: number): Promise<DecisionRecord[]> {
    return this.decisions.slice(-limit);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  printBanner("Arbitrum Sepolia", config.dryRun ? "DRY RUN" : "LIVE");
  printStartup(
    account.address,
    config.chainId,
    config.dryRun,
    config.driftThreshold,
  );

  // Create the event bus and providers.
  const eventBus = new EventBus();
  const sense = new RebalancerSenseProvider();
  const think = new RebalancerThinkProvider();
  const act = new RebalancerActProvider();
  const memory = new RebalancerMemoryProvider();

  // Build the strategy.
  const strategy = createRebalancerStrategy();

  // Create the agent.
  const agent = new Agent(
    {
      id: "rebalancer-demo-001",
      name: "DeFi Portfolio Rebalancer",
      capabilities: ["SWAP", "PORTFOLIO_MANAGEMENT"],
      chains: [config.chainId],
      tickIntervalMs: config.tickIntervalSec * 1_000,
      maxCycles: 0, // unlimited
      dryRun: config.dryRun,
      cooldownMs: 15_000,
    },
    { eventBus, sense, think, act, memory },
  );

  agent.setStrategy(strategy);

  // -----------------------------------------------------------------------
  // Hook into agent events for display
  // -----------------------------------------------------------------------

  let cycleCount = 0;

  eventBus.on("market:snapshot", () => {
    cycleCount++;
    printCycleHeader(cycleCount);
    printPortfolioTable(lastAllocationRows, lastBlockNumber, lastTotalValueUsd);
  });

  eventBus.on("agent:decision", ({ record }) => {
    printReasoning(record.reasoning);
    printAction(
      record.action,
      record.txHash ?? null,
      null,
    );
    printWaiting(config.tickIntervalSec);
  });

  eventBus.on("agent:trade", ({ tx }) => {
    if (tx.hash && tx.hash !== `0x${"0".repeat(64)}`) {
      const gasCost = tx.gasUsed !== undefined && tx.effectiveGasPrice !== undefined
        ? formatEther(tx.gasUsed * tx.effectiveGasPrice) + " ETH"
        : null;
      printAction("SWAP confirmed", tx.hash, gasCost);
    }
  });

  eventBus.on("agent:error", ({ error, recoverable }) => {
    printError(
      `${error.message}${recoverable ? " (recoverable — will retry)" : " (FATAL)"}`,
    );
  });

  // -----------------------------------------------------------------------
  // Graceful shutdown
  // -----------------------------------------------------------------------

  const shutdown = async () => {
    console.log("\n  Shutting down agent...");
    await agent.kill();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // -----------------------------------------------------------------------
  // Start the agent
  // -----------------------------------------------------------------------

  console.log(chalk.gray("  Starting agent loop...\n"));

  await agent.start();
}

main().catch((err) => {
  console.error(chalk.red("\n  Fatal error:"), err);
  process.exit(1);
});
