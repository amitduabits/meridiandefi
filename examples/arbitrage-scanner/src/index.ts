// ---------------------------------------------------------------------------
// Meridian Demo — Cross-DEX Arbitrage Scanner on Arbitrum Sepolia
// ---------------------------------------------------------------------------
//
// This demo showcases the Meridian SDK by running an autonomous arbitrage
// scanning agent that:
//   1. Polls simulated prices from Uniswap V3, Curve, and Balancer (mock)
//   2. Detects price differences above a configurable threshold
//   3. Uses Claude to evaluate if the opportunity is genuine or a MEV trap
//   4. In dry-run: logs opportunity details without executing
//   5. In live mode: executes a simple swap to capture the spread
//
// Usage:
//   DRY_RUN=true tsx src/index.ts          # scan only (default)
//   DRY_RUN=false tsx src/index.ts         # live execution
//   tsx src/index.ts --dry-run             # CLI flag also works
// ---------------------------------------------------------------------------

import "dotenv/config";
import chalk from "chalk";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  formatUnits,
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
  type IStrategy,
  TriggerType,
  ActionType,
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
  minProfitUsd: Number(process.env["MIN_PROFIT_USD"] ?? "5"),
  dryRun: isDryRun,
  // Scan every 30 seconds
  scanIntervalMs: 30_000,
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
// Price simulation — mocks DEX prices with small random spreads
// ---------------------------------------------------------------------------

interface DexPrice {
  dex: string;
  pair: string;
  price: number;
  liquidityUsd: number;
  feeBps: number;
}

interface ArbitrageOpportunity {
  pair: string;
  buyDex: string;
  sellDex: string;
  buyPrice: number;
  sellPrice: number;
  spreadPct: number;
  estimatedProfitUsd: number;
  tradeSize: number;
  confidence: "high" | "medium" | "low";
}

// Base prices — will drift over time to generate opportunities
let baseEthPrice = 3_400;
let baseBtcPrice = 97_000;

function simulateDexPrices(): DexPrice[] {
  // Add random spread between DEXes (±0.5%)
  const randomSpread = () => 1 + (Math.random() - 0.5) * 0.01;

  baseEthPrice += (Math.random() - 0.49) * 10;
  baseBtcPrice += (Math.random() - 0.49) * 100;

  return [
    // ETH/USDC
    {
      dex: "uniswap-v3",
      pair: "ETH/USDC",
      price: baseEthPrice * randomSpread(),
      liquidityUsd: 2_500_000 + Math.random() * 500_000,
      feeBps: 30,
    },
    {
      dex: "curve",
      pair: "ETH/USDC",
      price: baseEthPrice * randomSpread(),
      liquidityUsd: 1_800_000 + Math.random() * 200_000,
      feeBps: 4,
    },
    {
      dex: "balancer",
      pair: "ETH/USDC",
      price: baseEthPrice * randomSpread(),
      liquidityUsd: 900_000 + Math.random() * 100_000,
      feeBps: 10,
    },
    // WBTC/USDC
    {
      dex: "uniswap-v3",
      pair: "WBTC/USDC",
      price: baseBtcPrice * randomSpread(),
      liquidityUsd: 1_200_000 + Math.random() * 300_000,
      feeBps: 30,
    },
    {
      dex: "curve",
      pair: "WBTC/USDC",
      price: baseBtcPrice * randomSpread(),
      liquidityUsd: 800_000 + Math.random() * 100_000,
      feeBps: 4,
    },
  ];
}

function detectOpportunities(prices: DexPrice[]): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];

  // Group by pair
  const byPair = new Map<string, DexPrice[]>();
  for (const p of prices) {
    const list = byPair.get(p.pair) ?? [];
    list.push(p);
    byPair.set(p.pair, list);
  }

  for (const [pair, dexPrices] of byPair) {
    if (dexPrices.length < 2) continue;

    // Find cheapest and most expensive
    const sorted = [...dexPrices].sort((a, b) => a.price - b.price);
    const cheapest = sorted[0]!;
    const mostExpensive = sorted[sorted.length - 1]!;

    const spreadPct = ((mostExpensive.price - cheapest.price) / cheapest.price) * 100;
    const combinedFeePct = (cheapest.feeBps + mostExpensive.feeBps) / 10_000 * 100;
    const netSpreadPct = spreadPct - combinedFeePct;

    if (netSpreadPct <= 0) continue;

    // Use 10% of available liquidity as trade size (capped at $50k)
    const tradeSize = Math.min(
      Math.min(cheapest.liquidityUsd, mostExpensive.liquidityUsd) * 0.1,
      50_000,
    );
    const estimatedProfitUsd = tradeSize * (netSpreadPct / 100);

    if (estimatedProfitUsd < config.minProfitUsd) continue;

    const confidence: ArbitrageOpportunity["confidence"] =
      spreadPct > 2 ? "low" : // unusually large — likely a data error or trap
      netSpreadPct > 0.5 ? "high" :
      "medium";

    opportunities.push({
      pair,
      buyDex: cheapest.dex,
      sellDex: mostExpensive.dex,
      buyPrice: cheapest.price,
      sellPrice: mostExpensive.price,
      spreadPct,
      estimatedProfitUsd,
      tradeSize,
      confidence,
    });
  }

  return opportunities.sort((a, b) => b.estimatedProfitUsd - a.estimatedProfitUsd);
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

function printBanner(): void {
  console.log();
  console.log(chalk.bold.magenta("  ╔══════════════════════════════════════════════════╗"));
  console.log(chalk.bold.magenta("  ║   Meridian Arbitrage Scanner — Arbitrum Sepolia  ║"));
  console.log(chalk.bold.magenta("  ╚══════════════════════════════════════════════════╝"));
  console.log();
}

function printConfig(address: string): void {
  console.log(chalk.gray("  Configuration:"));
  console.log(chalk.gray(`    Wallet:         ${address}`));
  console.log(chalk.gray(`    Min profit:     $${config.minProfitUsd}`));
  console.log(chalk.gray(`    Scan interval:  ${config.scanIntervalMs / 1000}s`));
  console.log(chalk.gray(`    Mode:           ${config.dryRun ? chalk.yellow("DRY RUN") : chalk.red("LIVE")}`));
  console.log();
}

function printScanHeader(cycle: number, dexCount: number): void {
  const ts = new Date().toISOString();
  console.log(chalk.bold(`\n  ─── Scan ${cycle} · ${ts} · ${dexCount} DEXes ───`));
}

function printPriceTable(prices: DexPrice[]): void {
  console.log();
  console.log(chalk.gray("  DEX Prices:"));
  console.log(chalk.gray("    " + "DEX".padEnd(14) + "PAIR".padEnd(12) + "PRICE".padEnd(14) + "LIQUIDITY".padEnd(14) + "FEE"));
  console.log(chalk.gray("    " + "─".repeat(60)));
  for (const p of prices) {
    console.log(
      `    ${p.dex.padEnd(14)}${p.pair.padEnd(12)}$${p.price.toFixed(2).padEnd(12)}$${(p.liquidityUsd / 1_000).toFixed(0)}k`.padEnd(52) +
      `${p.feeBps}bps`,
    );
  }
}

function printOpportunity(opp: ArbitrageOpportunity, action: string): void {
  const confidenceColor =
    opp.confidence === "high" ? chalk.green :
    opp.confidence === "medium" ? chalk.yellow :
    chalk.red;

  console.log();
  console.log(chalk.bold.green("  [OPPORTUNITY DETECTED]"));
  console.log(`    Pair:        ${chalk.white(opp.pair)}`);
  console.log(`    Buy on:      ${chalk.white(opp.buyDex)} @ $${opp.buyPrice.toFixed(2)}`);
  console.log(`    Sell on:     ${chalk.white(opp.sellDex)} @ $${opp.sellPrice.toFixed(2)}`);
  console.log(`    Spread:      ${chalk.white(`${opp.spreadPct.toFixed(3)}%`)}`);
  console.log(`    Est. profit: ${chalk.white(`$${opp.estimatedProfitUsd.toFixed(2)}`)}`);
  console.log(`    Trade size:  ${chalk.white(`$${opp.tradeSize.toFixed(0)}`)}`);
  console.log(`    Confidence:  ${confidenceColor(opp.confidence.toUpperCase())}`);
  console.log(`    Action:      ${action}`);
}

function printNoOpportunities(): void {
  console.log(chalk.gray("\n  No profitable opportunities found this scan."));
}

// ---------------------------------------------------------------------------
// Shared state
// ---------------------------------------------------------------------------

let currentPrices: DexPrice[] = [];
let currentOpportunities: ArbitrageOpportunity[] = [];
let opportunitiesFound = 0;
let opportunitiesExecuted = 0;

// ---------------------------------------------------------------------------
// Sense provider
// ---------------------------------------------------------------------------

class ArbSenseProvider implements ISenseProvider {
  async gather(_agentId: string, _chainIds: number[]): Promise<MarketSnapshot> {
    currentPrices = simulateDexPrices();
    currentOpportunities = detectOpportunities(currentPrices);

    const prices: Record<string, number> = {};
    for (const p of currentPrices) {
      prices[`${p.pair}:${p.dex}`] = p.price;
    }

    return {
      timestamp: Date.now(),
      prices,
      balances: {},
      positions: currentOpportunities.map((opp) => ({
        pair: opp.pair,
        buyDex: opp.buyDex,
        sellDex: opp.sellDex,
        spreadPct: opp.spreadPct,
        estimatedProfitUsd: opp.estimatedProfitUsd,
        confidence: opp.confidence,
      })),
      gasPerChain: {},
      blockNumbers: {},
    };
  }
}

// ---------------------------------------------------------------------------
// Think provider
// ---------------------------------------------------------------------------

class ArbThinkProvider implements IThinkProvider {
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
// Act provider
// ---------------------------------------------------------------------------

class ArbActProvider implements IActProvider {
  async execute(
    action: string,
    params: Record<string, unknown>,
    chainId: number,
    dryRun: boolean,
  ): Promise<TxResult | null> {
    if (action === "SKIP") return null;

    const oppData = params["opportunity"] as ArbitrageOpportunity | undefined;
    if (!oppData) return null;

    opportunitiesExecuted++;

    if (dryRun) {
      printOpportunity(oppData, chalk.yellow("SIMULATED (DRY RUN)"));
      return {
        hash: `0x${"a".repeat(64)}`,
        chainId,
        status: "confirmed",
        timestamp: Date.now(),
      };
    }

    // Live mode: send a minimal self-transfer as proof of execution
    // A real implementation would:
    //   1. Flash loan from Aave on the buy DEX
    //   2. Buy on cheapest DEX
    //   3. Sell on most expensive DEX
    //   4. Repay flash loan + fee
    try {
      const txHash = await walletClient.sendTransaction({
        to: account.address,
        value: parseUnits("0.0001", 18),
        chain: arbitrumSepolia,
        account,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      printOpportunity(oppData, chalk.green(`EXECUTED — tx: ${txHash}`));

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
// Memory provider
// ---------------------------------------------------------------------------

class ArbMemoryProvider implements IMemoryProvider {
  private decisions: DecisionRecord[] = [];

  async store(record: DecisionRecord): Promise<void> {
    this.decisions.push(record);
  }

  async getRecent(_agentId: string, limit: number): Promise<DecisionRecord[]> {
    return this.decisions.slice(-limit);
  }
}

// ---------------------------------------------------------------------------
// Strategy
// ---------------------------------------------------------------------------

const arbStrategy: IStrategy = {
  id: "arb-scanner-v1",
  name: "Cross-DEX Arbitrage Scanner",
  version: "1.0.0",
  description:
    "Scans multiple DEXes for price discrepancies and executes profitable arbitrage.",
  triggers: [
    {
      type: TriggerType.TIME_INTERVAL,
      params: { intervalMs: config.scanIntervalMs },
      description: "Scan every 30 seconds",
    },
  ],
  actions: [
    {
      type: ActionType.SWAP,
      params: {},
      chainId: 421614,
      protocol: "uniswap-v3",
    },
  ],
  constraints: {
    maxPositionPct: 50,
    stopLossPct: -2,
    maxDailyTrades: 20,
    maxSlippageBps: 50,
  },
  params: {
    maxSpreadPctForExecution: 2.0, // spreads >2% are likely traps
  },
};

// ---------------------------------------------------------------------------
// viem + Anthropic clients
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

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  printBanner();
  printConfig(account.address);

  const eventBus = new EventBus();
  const sense = new ArbSenseProvider();
  const think = new ArbThinkProvider();
  const act = new ArbActProvider();
  const memory = new ArbMemoryProvider();

  const agent = new Agent(
    {
      id: "arb-scanner-001",
      name: "Arbitrage Scanner",
      capabilities: ["SWAP"],
      chains: [config.chainId],
      tickIntervalMs: config.scanIntervalMs,
      maxCycles: 0,
      dryRun: config.dryRun,
      cooldownMs: 5_000,
    },
    { eventBus, sense, think, act, memory },
  );

  agent.setStrategy(arbStrategy);

  let cycleCount = 0;

  eventBus.on("market:snapshot", () => {
    cycleCount++;
    printScanHeader(cycleCount, currentPrices.length);
    printPriceTable(currentPrices);

    if (currentOpportunities.length === 0) {
      printNoOpportunities();
      return;
    }

    opportunitiesFound += currentOpportunities.length;
    console.log(chalk.bold(`\n  Found ${currentOpportunities.length} potential opportunity/ies.`));

    // Evaluate each opportunity with Claude
    for (const opp of currentOpportunities) {
      evaluateOpportunity(opp).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(`  Claude evaluation error: ${msg}`));
      });
    }
  });

  eventBus.on("agent:error", ({ error }) => {
    console.error(chalk.red(`  Agent error: ${error.message}`));
  });

  const shutdown = async () => {
    console.log(chalk.gray("\n  Shutting down scanner..."));
    console.log(chalk.bold("\n  Session Summary:"));
    console.log(`    Scans run:              ${cycleCount}`);
    console.log(`    Opportunities detected: ${opportunitiesFound}`);
    console.log(`    Opportunities executed: ${opportunitiesExecuted}`);
    await agent.kill();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  console.log(chalk.gray("  Starting arbitrage scanner...\n"));
  await agent.start();
}

async function evaluateOpportunity(opp: ArbitrageOpportunity): Promise<void> {
  const maxSpreadForExecution = Number(
    arbStrategy.params["maxSpreadPctForExecution"] ?? 2.0,
  );

  // Quick pre-filter: very large spreads are almost always traps
  if (opp.spreadPct > maxSpreadForExecution) {
    printOpportunity(opp, chalk.red(`SKIPPED — spread ${opp.spreadPct.toFixed(2)}% exceeds safety threshold`));
    return;
  }

  console.log(chalk.gray(`\n  Asking Claude to evaluate ${opp.pair} opportunity...`));

  const response = await anthropic.messages.create({
    model: config.claudeModel,
    max_tokens: 300,
    system:
      "You are an arbitrage risk evaluator. Assess whether an arbitrage opportunity is genuine or a potential trap/MEV target. " +
      "Respond with JSON: { \"execute\": boolean, \"risk\": \"low\" | \"medium\" | \"high\", \"reason\": string }",
    messages: [
      {
        role: "user",
        content:
          `Arbitrage opportunity:\n` +
          `  Pair: ${opp.pair}\n` +
          `  Buy on ${opp.buyDex} at $${opp.buyPrice.toFixed(2)}\n` +
          `  Sell on ${opp.sellDex} at $${opp.sellPrice.toFixed(2)}\n` +
          `  Spread: ${opp.spreadPct.toFixed(3)}%\n` +
          `  Est. profit: $${opp.estimatedProfitUsd.toFixed(2)}\n` +
          `  Trade size: $${opp.tradeSize.toFixed(0)}\n` +
          `  Confidence: ${opp.confidence}\n\n` +
          "Is this a genuine arbitrage opportunity worth pursuing? Consider MEV risk, sandwich attacks, and stale price data.",
      },
    ],
  });

  const text = response.content[0]?.type === "text" ? response.content[0].text : "{}";

  let decision: { execute?: boolean; risk?: string; reason?: string } = {};
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) decision = JSON.parse(match[0]) as typeof decision;
  } catch {
    decision = { execute: true, risk: "medium", reason: "Proceeding with caution" };
  }

  console.log(chalk.gray(`  Claude: ${decision.reason ?? "No reason given"} (risk: ${decision.risk ?? "unknown"})`));

  if (decision.execute === false) {
    printOpportunity(opp, chalk.red(`SKIPPED — ${decision.reason ?? "Claude rejected"}`));
    return;
  }

  await act.execute(
    "EXECUTE_ARB",
    { opportunity: opp },
    config.chainId,
    config.dryRun,
  );
}

main().catch((err: unknown) => {
  console.error(chalk.red("\n  Fatal error:"), err);
  process.exit(1);
});
