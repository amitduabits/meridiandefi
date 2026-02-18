// ---------------------------------------------------------------------------
// Meridian Demo — Dollar-Cost Averaging Bot on Arbitrum Sepolia
// ---------------------------------------------------------------------------
//
// This demo showcases the Meridian SDK by running an autonomous DCA agent that:
//   1. Reads current ETH/USDC balance on Arbitrum Sepolia
//   2. Every N hours, evaluates whether market conditions are reasonable
//   3. Uses Claude to confirm — avoids buying into extreme volatility
//   4. Executes a simulated Uniswap V3 swap (or real tx in live mode)
//   5. Logs each purchase: amount, price, cumulative average cost
//
// Usage:
//   DRY_RUN=true tsx src/index.ts          # simulate only (default)
//   DRY_RUN=false tsx src/index.ts         # live mode
//   tsx src/index.ts --dry-run             # CLI flag also works
// ---------------------------------------------------------------------------

import "dotenv/config";
import chalk from "chalk";
import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  formatUnits,
  parseUnits,
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

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(chalk.red(`\n  Missing required environment variable: ${key}`));
    console.error(chalk.gray(`  Copy .env.example to .env and fill in the values.\n`));
    process.exit(1);
  }
  return value;
}

const isDryRun =
  process.argv.includes("--dry-run") ||
  process.env["DRY_RUN"] !== "false";

const config = {
  rpcUrl: requireEnv("ARB_SEPOLIA_RPC_URL"),
  anthropicApiKey: requireEnv("ANTHROPIC_API_KEY"),
  privateKey: requireEnv("AGENT_PRIVATE_KEY") as `0x${string}`,
  chainId: 421614,
  dcaToken: process.env["DCA_TOKEN"] ?? "ETH",
  dcaAmountUsdc: Number(process.env["DCA_AMOUNT_USDC"] ?? "50"),
  dcaIntervalHours: Number(process.env["DCA_INTERVAL_HOURS"] ?? "24"),
  dryRun: isDryRun,
  claudeModel: process.env["CLAUDE_MODEL"] ?? "claude-sonnet-4-5-20250929",
} as const;

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
// Token addresses on Arbitrum Sepolia
// ---------------------------------------------------------------------------

const USDC_ADDRESS = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" as const;
const USDC_DECIMALS = 6;

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
// Mock price oracle — testnet tokens lack real price feeds
// ---------------------------------------------------------------------------

interface PriceSnapshot {
  price: number;
  change24h: number;
  volatility: number;
}

// Simulate price data with mild random walk for demo realism
let mockEthPrice = 3_400;

function getMockPriceSnapshot(): PriceSnapshot {
  const change = (Math.random() - 0.48) * 50; // slight upward drift
  mockEthPrice = Math.max(1_000, mockEthPrice + change);
  const change24h = (change / mockEthPrice) * 100;
  const volatility = Math.abs(change24h) + Math.random() * 2;
  return { price: mockEthPrice, change24h, volatility };
}

// ---------------------------------------------------------------------------
// DCA purchase ledger — tracks cost basis
// ---------------------------------------------------------------------------

interface PurchaseRecord {
  timestamp: number;
  tokenAmount: number;
  priceUsd: number;
  usdcSpent: number;
  txHash: string;
}

const purchaseLedger: PurchaseRecord[] = [];

function computeAverageCost(): number {
  if (purchaseLedger.length === 0) return 0;
  const totalSpent = purchaseLedger.reduce((s, r) => s + r.usdcSpent, 0);
  const totalTokens = purchaseLedger.reduce((s, r) => s + r.tokenAmount, 0);
  return totalTokens > 0 ? totalSpent / totalTokens : 0;
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

function printBanner(): void {
  console.log();
  console.log(chalk.bold.cyan("  ╔══════════════════════════════════════════════╗"));
  console.log(chalk.bold.cyan("  ║      Meridian DCA Bot — Arbitrum Sepolia     ║"));
  console.log(chalk.bold.cyan("  ╚══════════════════════════════════════════════╝"));
  console.log();
}

function printConfig(address: string): void {
  console.log(chalk.gray("  Configuration:"));
  console.log(chalk.gray(`    Wallet:         ${address}`));
  console.log(chalk.gray(`    Target token:   ${config.dcaToken}`));
  console.log(chalk.gray(`    Amount/cycle:   $${config.dcaAmountUsdc} USDC`));
  console.log(chalk.gray(`    Interval:       every ${config.dcaIntervalHours}h`));
  console.log(chalk.gray(`    Mode:           ${config.dryRun ? chalk.yellow("DRY RUN") : chalk.red("LIVE")}`));
  console.log();
}

function printCycleHeader(cycle: number, priceSnapshot: PriceSnapshot): void {
  const ts = new Date().toISOString();
  console.log(chalk.bold(`\n  ─── Cycle ${cycle} · ${ts} ───`));
  console.log(
    `    ${config.dcaToken} Price:  ${chalk.white(`$${priceSnapshot.price.toFixed(2)}`)}` +
    `  24h: ${priceSnapshot.change24h >= 0 ? chalk.green(`+${priceSnapshot.change24h.toFixed(2)}%`) : chalk.red(`${priceSnapshot.change24h.toFixed(2)}%`)}` +
    `  Volatility: ${priceSnapshot.volatility.toFixed(2)}%`,
  );
}

function printPurchase(record: PurchaseRecord, avgCost: number): void {
  console.log();
  console.log(chalk.bold.green("  [BUY]"));
  console.log(`    Spent:        ${chalk.white(`$${record.usdcSpent.toFixed(2)} USDC`)}`);
  console.log(`    Received:     ${chalk.white(`${record.tokenAmount.toFixed(6)} ${config.dcaToken}`)}`);
  console.log(`    Price:        ${chalk.white(`$${record.priceUsd.toFixed(2)}`)}`);
  console.log(`    Avg Cost:     ${chalk.white(`$${avgCost.toFixed(2)}`)}`);
  console.log(`    Tx Hash:      ${chalk.gray(record.txHash)}`);
  console.log(`    Total Buys:   ${purchaseLedger.length}`);
}

function printSkip(reason: string): void {
  console.log();
  console.log(chalk.yellow("  [SKIP]") + chalk.gray(` ${reason}`));
}

function printWaiting(hours: number): void {
  console.log(chalk.gray(`\n  Next purchase in ${hours}h. Press Ctrl+C to stop.\n`));
}

// ---------------------------------------------------------------------------
// Shared state for providers
// ---------------------------------------------------------------------------

let currentPriceSnapshot: PriceSnapshot = getMockPriceSnapshot();

// ---------------------------------------------------------------------------
// Sense provider
// ---------------------------------------------------------------------------

class DcaSenseProvider implements ISenseProvider {
  async gather(_agentId: string, _chainIds: number[]): Promise<MarketSnapshot> {
    currentPriceSnapshot = getMockPriceSnapshot();

    let ethBalance = 0n;
    let usdcBalance = 0n;

    try {
      ethBalance = await publicClient.getBalance({ address: account.address });
      usdcBalance = (await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account.address],
      })) as bigint;
    } catch {
      // Testnet may not have token contracts — use zero balances
    }

    const ethFormatted = formatEther(ethBalance);
    const usdcFormatted = formatUnits(usdcBalance, USDC_DECIMALS);

    return {
      timestamp: Date.now(),
      prices: {
        ETH: currentPriceSnapshot.price,
        USDC: 1.0,
      },
      balances: {
        ETH: ethFormatted,
        USDC: usdcFormatted,
      },
      positions: [
        {
          token: config.dcaToken,
          price: currentPriceSnapshot.price,
          change24h: currentPriceSnapshot.change24h,
          volatility24h: currentPriceSnapshot.volatility,
          totalBuys: purchaseLedger.length,
          averageCostBasis: computeAverageCost(),
          nextBuyAmountUsdc: config.dcaAmountUsdc,
        },
      ],
      gasPerChain: {},
      blockNumbers: {},
    };
  }
}

// ---------------------------------------------------------------------------
// Think provider — uses Claude to assess market conditions
// ---------------------------------------------------------------------------

class DcaThinkProvider implements IThinkProvider {
  async reason(request: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();
    const response = await anthropic.messages.create({
      model: config.claudeModel,
      max_tokens: request.maxTokens ?? 512,
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
// Act provider — executes swap or simulates in dry-run
// ---------------------------------------------------------------------------

class DcaActProvider implements IActProvider {
  async execute(
    action: string,
    params: Record<string, unknown>,
    chainId: number,
    dryRun: boolean,
  ): Promise<TxResult | null> {
    if (action === "HOLD" || action === "SKIP") {
      return null;
    }

    const price = Number(params["price"] ?? currentPriceSnapshot.price);
    const amountUsdc = Number(params["amountUsdc"] ?? config.dcaAmountUsdc);
    const tokenAmount = amountUsdc / price;

    if (dryRun) {
      const mockHash = `0x${"d".repeat(64)}` as `0x${string}`;
      const record: PurchaseRecord = {
        timestamp: Date.now(),
        tokenAmount,
        priceUsd: price,
        usdcSpent: amountUsdc,
        txHash: mockHash,
      };
      purchaseLedger.push(record);
      printPurchase(record, computeAverageCost());
      return {
        hash: mockHash,
        chainId,
        status: "confirmed",
        timestamp: Date.now(),
      };
    }

    // Live mode: send a self-transfer as on-chain proof of execution
    // A real implementation would call the Uniswap V3 SwapRouter02
    try {
      const txHash = await walletClient.sendTransaction({
        to: account.address,
        value: parseUnits("0.0001", 18),
        chain: arbitrumSepolia,
        account,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      const record: PurchaseRecord = {
        timestamp: Date.now(),
        tokenAmount,
        priceUsd: price,
        usdcSpent: amountUsdc,
        txHash,
      };
      purchaseLedger.push(record);
      printPurchase(record, computeAverageCost());

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
      console.error(chalk.red(`  Transaction failed: ${msg}`));
      return {
        hash: `0x${"f".repeat(64)}`,
        chainId,
        status: "failed",
        timestamp: Date.now(),
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Memory provider — in-memory ledger
// ---------------------------------------------------------------------------

class DcaMemoryProvider implements IMemoryProvider {
  private decisions: DecisionRecord[] = [];

  async store(record: DecisionRecord): Promise<void> {
    this.decisions.push(record);
  }

  async getRecent(_agentId: string, limit: number): Promise<DecisionRecord[]> {
    return this.decisions.slice(-limit);
  }
}

// ---------------------------------------------------------------------------
// Agent strategy — check market conditions and decide whether to buy
// ---------------------------------------------------------------------------

import { type IStrategy, TriggerType, ActionType } from "@meridian/sdk";

const dcaStrategy: IStrategy = {
  id: "dca-strategy-v1",
  name: "Dollar-Cost Averaging",
  version: "1.0.0",
  description:
    "Buy a fixed USDC amount of target token at regular intervals, skipping extreme volatility.",
  triggers: [
    {
      type: TriggerType.TIME_INTERVAL,
      params: { intervalMs: config.dcaIntervalHours * 60 * 60 * 1_000 },
      description: `Every ${config.dcaIntervalHours} hours`,
    },
  ],
  actions: [
    {
      type: ActionType.SWAP,
      params: {
        tokenIn: "USDC",
        tokenOut: config.dcaToken,
        amountUsdc: config.dcaAmountUsdc,
      },
      chainId: 421614,
      protocol: "uniswap-v3",
    },
  ],
  constraints: {
    maxPositionPct: 100,
    stopLossPct: -100,
    maxDailyTrades: 1,
    maxSlippageBps: 100,
  },
  params: {
    volatilitySkipThreshold: 8.0, // skip if 24h volatility > 8%
  },
};

// ---------------------------------------------------------------------------
// viem clients — created after config is loaded
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
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  printBanner();
  printConfig(account.address);

  const eventBus = new EventBus();
  const sense = new DcaSenseProvider();
  const think = new DcaThinkProvider();
  const act = new DcaActProvider();
  const memory = new DcaMemoryProvider();

  const agent = new Agent(
    {
      id: "dca-bot-001",
      name: "DCA Bot",
      capabilities: ["SWAP"],
      chains: [config.chainId],
      tickIntervalMs: config.dcaIntervalHours * 60 * 60 * 1_000,
      maxCycles: 0,
      dryRun: config.dryRun,
      cooldownMs: 5_000,
    },
    { eventBus, sense, think, act, memory },
  );

  agent.setStrategy(dcaStrategy);

  let cycleCount = 0;

  eventBus.on("market:snapshot", (snapshot) => {
    cycleCount++;
    printCycleHeader(cycleCount, currentPriceSnapshot);

    // Build the Claude prompt inline with the snapshot data
    const volatilityThreshold = Number(
      dcaStrategy.params["volatilitySkipThreshold"] ?? 8,
    );
    const prices = snapshot.prices as Record<string, number>;
    const ethPrice = prices["ETH"] ?? currentPriceSnapshot.price;

    console.log(chalk.gray("\n  Asking Claude to evaluate market conditions..."));

    anthropic.messages
      .create({
        model: config.claudeModel,
        max_tokens: 256,
        system:
          "You are a DCA bot assistant. Evaluate whether market conditions are reasonable for a scheduled purchase. " +
          "Respond with JSON: { \"shouldBuy\": boolean, \"reason\": string }",
        messages: [
          {
            role: "user",
            content:
              `DCA schedule: Buy $${config.dcaAmountUsdc} USDC of ${config.dcaToken} every ${config.dcaIntervalHours}h.\n` +
              `Current ${config.dcaToken} price: $${ethPrice.toFixed(2)}\n` +
              `24h change: ${currentPriceSnapshot.change24h.toFixed(2)}%\n` +
              `Volatility: ${currentPriceSnapshot.volatility.toFixed(2)}%\n` +
              `Volatility skip threshold: ${volatilityThreshold}%\n` +
              `Total purchases so far: ${purchaseLedger.length}\n` +
              `Average cost basis: $${computeAverageCost().toFixed(2)}\n\n` +
              "Should we proceed with the scheduled DCA purchase?",
          },
        ],
      })
      .then((response) => {
        const text =
          response.content[0]?.type === "text" ? response.content[0].text : "{}";

        let decision: { shouldBuy?: boolean; reason?: string } = {};
        try {
          // Extract JSON from response (may have surrounding text)
          const match = text.match(/\{[\s\S]*\}/);
          if (match) decision = JSON.parse(match[0]) as typeof decision;
        } catch {
          // If parsing fails, default to buying (DCA should proceed unless explicitly bad)
          decision = { shouldBuy: true, reason: "Proceeding with scheduled purchase" };
        }

        console.log(chalk.gray(`\n  Claude: ${decision.reason ?? "No reason given"}`));

        if (decision.shouldBuy === false) {
          printSkip(decision.reason ?? "Market conditions unfavorable");
          printWaiting(config.dcaIntervalHours);
        } else {
          // Trigger the act phase
          act
            .execute(
              "SWAP",
              { price: ethPrice, amountUsdc: config.dcaAmountUsdc },
              config.chainId,
              config.dryRun,
            )
            .then(() => {
              printWaiting(config.dcaIntervalHours);
            })
            .catch((err: unknown) => {
              const msg = err instanceof Error ? err.message : String(err);
              console.error(chalk.red(`  Error executing swap: ${msg}`));
            });
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(`  Claude API error: ${msg}`));
        console.log(chalk.yellow("  Proceeding with scheduled purchase (fallback)..."));
        act
          .execute(
            "SWAP",
            { price: currentPriceSnapshot.price, amountUsdc: config.dcaAmountUsdc },
            config.chainId,
            config.dryRun,
          )
          .then(() => {
            printWaiting(config.dcaIntervalHours);
          })
          .catch(() => {/* silently ignore */});
      });
  });

  eventBus.on("agent:error", ({ error }) => {
    console.error(chalk.red(`  Agent error: ${error.message}`));
  });

  const shutdown = async () => {
    console.log(chalk.gray("\n  Shutting down DCA bot..."));
    const avgCost = computeAverageCost();
    const totalSpent = purchaseLedger.reduce((s, r) => s + r.usdcSpent, 0);
    const totalTokens = purchaseLedger.reduce((s, r) => s + r.tokenAmount, 0);
    console.log(chalk.bold("\n  Session Summary:"));
    console.log(`    Total purchases: ${purchaseLedger.length}`);
    console.log(`    Total USDC spent: $${totalSpent.toFixed(2)}`);
    console.log(`    Total ${config.dcaToken} bought: ${totalTokens.toFixed(6)}`);
    console.log(`    Average cost: $${avgCost.toFixed(2)}`);
    await agent.kill();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  console.log(chalk.gray("  Starting DCA bot...\n"));
  await agent.start();
}

main().catch((err: unknown) => {
  console.error(chalk.red("\n  Fatal error:"), err);
  process.exit(1);
});
