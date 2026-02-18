// ---------------------------------------------------------------------------
// Meridian Demo — Liquidation Protector on Arbitrum Sepolia
// ---------------------------------------------------------------------------
//
// This demo showcases the Meridian SDK by running an autonomous lending
// position protection agent that:
//   1. Monitors the health factor of an Aave V3 position (mocked on testnet)
//   2. WARNING (health < 1.3): alerts and uses Claude to analyse options
//   3. CRITICAL (health < 1.1): automatically repays part of debt or adds collateral
//   4. Displays a health factor trend chart in the terminal
//   5. Estimates time-to-liquidation based on current price trend
//
// Usage:
//   DRY_RUN=true tsx src/index.ts          # monitor only (default)
//   DRY_RUN=false tsx src/index.ts         # live protection
//   tsx src/index.ts --dry-run             # CLI flag also works
// ---------------------------------------------------------------------------

import "dotenv/config";
import chalk from "chalk";
import {
  createPublicClient,
  createWalletClient,
  http,
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
  positionAddress: (process.env["AAVE_POSITION_ADDRESS"] ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
  chainId: 421614,
  healthFactorWarning: Number(process.env["HEALTH_FACTOR_WARNING"] ?? "1.3"),
  healthFactorCritical: Number(process.env["HEALTH_FACTOR_CRITICAL"] ?? "1.1"),
  dryRun: isDryRun,
  // Monitor every 60 seconds
  monitorIntervalMs: 60_000,
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
// Simulated Aave position state
// ---------------------------------------------------------------------------

interface AavePosition {
  healthFactor: number;
  totalCollateralUsd: number;
  totalDebtUsd: number;
  availableBorrowsUsd: number;
  ltv: number; // current LTV as fraction (0–1)
  liquidationThreshold: number; // fraction (0–1)
  collateralAsset: string;
  debtAsset: string;
  collateralPriceUsd: number;
  debtPriceUsd: number;
}

// Simulate a deteriorating position by slowly decreasing HF
let simulatedHF = 1.8;
let hfTrend = -0.05; // per cycle — simulate collateral price dropping

function simulateAavePosition(): AavePosition {
  // Randomly adjust the trend (sometimes recovers slightly)
  hfTrend = -0.05 + (Math.random() - 0.3) * 0.02;
  simulatedHF = Math.max(0.5, simulatedHF + hfTrend);

  const totalCollateralUsd = 15_000;
  const liquidationThreshold = 0.8;
  const totalDebtUsd = totalCollateralUsd * liquidationThreshold / simulatedHF;

  return {
    healthFactor: simulatedHF,
    totalCollateralUsd,
    totalDebtUsd,
    availableBorrowsUsd: Math.max(0, totalCollateralUsd * 0.75 - totalDebtUsd),
    ltv: totalDebtUsd / totalCollateralUsd,
    liquidationThreshold,
    collateralAsset: "ETH",
    debtAsset: "USDC",
    collateralPriceUsd: 3_400 * (0.95 + Math.random() * 0.1),
    debtPriceUsd: 1.0,
  };
}

// ---------------------------------------------------------------------------
// Health factor history — for trend chart
// ---------------------------------------------------------------------------

const HF_HISTORY_MAX = 20;
const hfHistory: { timestamp: number; hf: number }[] = [];

function recordHF(hf: number): void {
  hfHistory.push({ timestamp: Date.now(), hf });
  if (hfHistory.length > HF_HISTORY_MAX) hfHistory.shift();
}

// ---------------------------------------------------------------------------
// Trend analysis
// ---------------------------------------------------------------------------

function estimateTimeToLiquidation(position: AavePosition): string {
  if (hfHistory.length < 3) return "insufficient data";
  const recent = hfHistory.slice(-5);
  const oldest = recent[0]!;
  const newest = recent[recent.length - 1]!;
  const hfChange = newest.hf - oldest.hf;
  const timeMs = newest.timestamp - oldest.timestamp;
  if (hfChange >= 0) return "not trending toward liquidation";
  const hfPerMs = hfChange / timeMs;
  const distanceToLiquidation = newest.hf - 1.0;
  const msToLiquidation = distanceToLiquidation / Math.abs(hfPerMs);
  const hoursToLiquidation = msToLiquidation / (1000 * 60 * 60);
  if (hoursToLiquidation > 999) return ">999 hours";
  return `~${hoursToLiquidation.toFixed(1)} hours`;
}

// ---------------------------------------------------------------------------
// Terminal health factor chart
// ---------------------------------------------------------------------------

function printHFChart(): void {
  if (hfHistory.length < 2) return;

  const width = 40;
  const minHF = Math.min(...hfHistory.map((h) => h.hf), 0.9);
  const maxHF = Math.max(...hfHistory.map((h) => h.hf), 2.5);
  const range = maxHF - minHF;

  console.log();
  console.log(chalk.gray("  Health Factor Trend (last 20 readings):"));
  console.log(chalk.gray(`  Max: ${maxHF.toFixed(2)}  ┐`));

  const rows = 5;
  for (let row = rows; row >= 0; row--) {
    const threshold = minHF + (range * row) / rows;
    let line = "  ";
    for (let col = 0; col < Math.min(hfHistory.length, width); col++) {
      const entry = hfHistory[col]!;
      const hfNormalized = (entry.hf - minHF) / range;
      const charRow = Math.round(hfNormalized * rows);
      if (charRow === row) {
        // Color-code based on HF level
        const dot =
          entry.hf < config.healthFactorCritical ? chalk.red("●") :
          entry.hf < config.healthFactorWarning ? chalk.yellow("●") :
          chalk.green("●");
        line += dot;
      } else {
        line += chalk.gray("·");
      }
    }
    console.log(`  ${threshold.toFixed(2)} ${line}`);
  }
  console.log(chalk.gray(`  Min: ${minHF.toFixed(2)}  ┘`));
  console.log(chalk.gray("              " + "└─── time ───►"));
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

function printBanner(): void {
  console.log();
  console.log(chalk.bold.red("  ╔══════════════════════════════════════════════════════╗"));
  console.log(chalk.bold.red("  ║  Meridian Liquidation Protector — Arbitrum Sepolia  ║"));
  console.log(chalk.bold.red("  ╚══════════════════════════════════════════════════════╝"));
  console.log();
}

function printConfig(address: string): void {
  console.log(chalk.gray("  Configuration:"));
  console.log(chalk.gray(`    Agent wallet:   ${address}`));
  console.log(chalk.gray(`    Position:       ${config.positionAddress}`));
  console.log(chalk.gray(`    Warning HF:     ${config.healthFactorWarning}`));
  console.log(chalk.gray(`    Critical HF:    ${config.healthFactorCritical}`));
  console.log(chalk.gray(`    Monitor every:  ${config.monitorIntervalMs / 1000}s`));
  console.log(chalk.gray(`    Mode:           ${config.dryRun ? chalk.yellow("DRY RUN") : chalk.red("LIVE")}`));
  console.log();
}

function printCheckHeader(cycle: number): void {
  const ts = new Date().toISOString();
  console.log(chalk.bold(`\n  ─── Monitor ${cycle} · ${ts} ───`));
}

function printPositionStatus(position: AavePosition): void {
  const hfColor =
    position.healthFactor < config.healthFactorCritical ? chalk.bold.red :
    position.healthFactor < config.healthFactorWarning ? chalk.bold.yellow :
    chalk.bold.green;

  const statusLabel =
    position.healthFactor < config.healthFactorCritical ? chalk.bgRed.white(" CRITICAL ") :
    position.healthFactor < config.healthFactorWarning ? chalk.bgYellow.black(" WARNING  ") :
    chalk.bgGreen.black("   SAFE   ");

  console.log();
  console.log(`  ${statusLabel} Health Factor: ${hfColor(position.healthFactor.toFixed(4))}`);
  console.log();
  console.log(`    Collateral:     ${chalk.white(`$${position.totalCollateralUsd.toFixed(0)}`)} (${position.collateralAsset} @ $${position.collateralPriceUsd.toFixed(0)})`);
  console.log(`    Debt:           ${chalk.white(`$${position.totalDebtUsd.toFixed(2)}`)} (${position.debtAsset})`);
  console.log(`    Current LTV:    ${chalk.white(`${(position.ltv * 100).toFixed(2)}%`)}`);
  console.log(`    Liq. Threshold: ${chalk.white(`${(position.liquidationThreshold * 100).toFixed(0)}%`)}`);
  console.log(`    Time to liq.:   ${chalk.white(estimateTimeToLiquidation(position))}`);
}

function printProtectionAction(action: string, details: string, txHash?: string): void {
  console.log();
  console.log(chalk.bold.red("  [PROTECTION TRIGGERED]"));
  console.log(`    Action:   ${chalk.white(action)}`);
  console.log(`    Details:  ${chalk.white(details)}`);
  if (txHash) console.log(`    Tx Hash:  ${chalk.gray(txHash)}`);
}

// ---------------------------------------------------------------------------
// Shared state
// ---------------------------------------------------------------------------

let currentPosition: AavePosition | null = null;
let protectionCount = 0;

// ---------------------------------------------------------------------------
// Sense provider
// ---------------------------------------------------------------------------

class ProtectorSenseProvider implements ISenseProvider {
  async gather(_agentId: string, _chainIds: number[]): Promise<MarketSnapshot> {
    currentPosition = simulateAavePosition();
    recordHF(currentPosition.healthFactor);

    return {
      timestamp: Date.now(),
      prices: {
        ETH: currentPosition.collateralPriceUsd,
        USDC: 1.0,
      },
      balances: {
        collateralUsd: currentPosition.totalCollateralUsd.toString(),
        debtUsd: currentPosition.totalDebtUsd.toString(),
      },
      positions: [
        {
          healthFactor: currentPosition.healthFactor,
          collateralUsd: currentPosition.totalCollateralUsd,
          debtUsd: currentPosition.totalDebtUsd,
          ltv: currentPosition.ltv,
          liquidationThreshold: currentPosition.liquidationThreshold,
          status:
            currentPosition.healthFactor < config.healthFactorCritical ? "CRITICAL" :
            currentPosition.healthFactor < config.healthFactorWarning ? "WARNING" :
            "SAFE",
        },
      ],
      gasPerChain: {},
      blockNumbers: {},
    };
  }
}

// ---------------------------------------------------------------------------
// Think provider
// ---------------------------------------------------------------------------

class ProtectorThinkProvider implements IThinkProvider {
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

class ProtectorActProvider implements IActProvider {
  async execute(
    action: string,
    params: Record<string, unknown>,
    chainId: number,
    dryRun: boolean,
  ): Promise<TxResult | null> {
    if (action === "MONITOR") return null;

    const actionType = String(params["actionType"] ?? "REPAY_DEBT");
    const amountUsd = Number(params["amountUsd"] ?? 500);
    const details = String(
      params["details"] ?? `${actionType}: $${amountUsd.toFixed(0)}`,
    );

    protectionCount++;

    if (dryRun) {
      const mockHash = `0x${"c".repeat(64)}`;
      printProtectionAction(actionType, details + " (DRY RUN)", mockHash);

      // Simulate position improvement
      if (currentPosition) {
        if (actionType === "REPAY_DEBT") {
          simulatedHF += amountUsd / currentPosition.totalDebtUsd * 0.5;
        } else {
          simulatedHF += amountUsd / currentPosition.totalCollateralUsd * 0.3;
        }
      }

      return {
        hash: mockHash,
        chainId,
        status: "confirmed",
        timestamp: Date.now(),
      };
    }

    // Live mode: send minimal self-transfer as demonstration
    // Real implementation would call Aave repay() or supply() on the Pool contract
    try {
      const txHash = await walletClient.sendTransaction({
        to: account.address,
        value: parseUnits("0.0001", 18),
        chain: arbitrumSepolia,
        account,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      printProtectionAction(actionType, details, txHash);

      // Simulate position improvement
      if (currentPosition) {
        if (actionType === "REPAY_DEBT") {
          simulatedHF += amountUsd / currentPosition.totalDebtUsd * 0.5;
        } else {
          simulatedHF += amountUsd / currentPosition.totalCollateralUsd * 0.3;
        }
      }

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

class ProtectorMemoryProvider implements IMemoryProvider {
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

const protectorStrategy: IStrategy = {
  id: "liquidation-protector-v1",
  name: "Liquidation Protector",
  version: "1.0.0",
  description:
    "Monitors an Aave V3 lending position and automatically defends against liquidation.",
  triggers: [
    {
      type: TriggerType.TIME_INTERVAL,
      params: { intervalMs: config.monitorIntervalMs },
      description: "Monitor position every 60 seconds",
    },
  ],
  actions: [
    {
      type: ActionType.REPAY,
      params: {},
      chainId: 421614,
      protocol: "aave-v3",
    },
  ],
  constraints: {
    maxPositionPct: 50,
    stopLossPct: -100,
    maxDailyTrades: 10,
    maxSlippageBps: 30,
    allowedProtocols: ["aave-v3"],
  },
  params: {
    repayTargetHF: 1.5, // aim to restore HF to 1.5 after critical action
    maxRepayPct: 0.3, // repay up to 30% of debt in one action
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
const act = new ProtectorActProvider();

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  printBanner();
  printConfig(account.address);

  const eventBus = new EventBus();
  const sense = new ProtectorSenseProvider();
  const think = new ProtectorThinkProvider();
  const memory = new ProtectorMemoryProvider();

  const agent = new Agent(
    {
      id: "liquidation-protector-001",
      name: "Liquidation Protector",
      capabilities: ["REPAY", "PORTFOLIO_MANAGEMENT"],
      chains: [config.chainId],
      tickIntervalMs: config.monitorIntervalMs,
      maxCycles: 0,
      dryRun: config.dryRun,
      cooldownMs: 5_000,
    },
    { eventBus, sense, think, act, memory },
  );

  agent.setStrategy(protectorStrategy);

  let cycleCount = 0;

  eventBus.on("market:snapshot", () => {
    cycleCount++;
    printCheckHeader(cycleCount);

    if (!currentPosition) return;

    printPositionStatus(currentPosition);
    printHFChart();

    const hf = currentPosition.healthFactor;

    if (hf < config.healthFactorCritical) {
      // CRITICAL — act immediately
      handleCritical(currentPosition).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(`  Critical handler error: ${msg}`));
      });
    } else if (hf < config.healthFactorWarning) {
      // WARNING — alert and get Claude recommendations
      handleWarning(currentPosition).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(chalk.red(`  Warning handler error: ${msg}`));
      });
    } else {
      console.log(chalk.gray("\n  Position healthy — continuing to monitor."));
    }
  });

  eventBus.on("agent:error", ({ error }) => {
    console.error(chalk.red(`  Agent error: ${error.message}`));
  });

  const shutdown = async () => {
    console.log(chalk.gray("\n  Shutting down liquidation protector..."));
    console.log(chalk.bold("\n  Session Summary:"));
    console.log(`    Cycles monitored:        ${cycleCount}`);
    console.log(`    Protection actions taken: ${protectionCount}`);
    if (currentPosition) {
      const hfColor =
        currentPosition.healthFactor < config.healthFactorCritical ? chalk.red :
        currentPosition.healthFactor < config.healthFactorWarning ? chalk.yellow :
        chalk.green;
      console.log(`    Final health factor:     ${hfColor(currentPosition.healthFactor.toFixed(4))}`);
    }
    await agent.kill();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  console.log(chalk.gray("  Starting liquidation protector...\n"));
  await agent.start();
}

// ---------------------------------------------------------------------------
// Handle CRITICAL health factor — immediate action
// ---------------------------------------------------------------------------

async function handleCritical(position: AavePosition): Promise<void> {
  console.log(chalk.bgRed.white.bold("\n  !! CRITICAL: Health factor below liquidation threshold !!"));

  const maxRepayPct = Number(protectorStrategy.params["maxRepayPct"] ?? 0.3);
  const targetHF = Number(protectorStrategy.params["repayTargetHF"] ?? 1.5);

  // Calculate how much to repay to reach target HF
  // HF = (collateral * liqThreshold) / debt
  // targetDebt = (collateral * liqThreshold) / targetHF
  const targetDebt = (position.totalCollateralUsd * position.liquidationThreshold) / targetHF;
  const repayAmount = Math.min(
    position.totalDebtUsd - targetDebt,
    position.totalDebtUsd * maxRepayPct,
  );

  const details = `Repay $${repayAmount.toFixed(2)} USDC to restore HF to ~${targetHF}`;
  console.log(chalk.red(`\n  Auto-repaying: ${details}`));

  await act.execute(
    "REPAY_DEBT",
    { actionType: "REPAY_DEBT", amountUsd: repayAmount, details },
    config.chainId,
    config.dryRun,
  );
}

// ---------------------------------------------------------------------------
// Handle WARNING health factor — consult Claude, may take action
// ---------------------------------------------------------------------------

async function handleWarning(position: AavePosition): Promise<void> {
  console.log(chalk.bgYellow.black.bold("\n  WARNING: Health factor approaching danger zone"));

  console.log(chalk.gray("\n  Asking Claude to analyse options..."));

  const trendStr = estimateTimeToLiquidation(position);

  const response = await anthropic.messages.create({
    model: config.claudeModel,
    max_tokens: 500,
    system:
      "You are a DeFi lending position risk manager. Analyse a potentially under-collateralised position and recommend actions. " +
      "Respond with JSON: { " +
      '"recommendation": "REPAY_DEBT" | "ADD_COLLATERAL" | "MONITOR", ' +
      '"urgency": "immediate" | "soon" | "watch", ' +
      '"amountUsd": number, ' +
      '"reasoning": string ' +
      "}",
    messages: [
      {
        role: "user",
        content:
          `Aave V3 position status:\n` +
          `  Health Factor: ${position.healthFactor.toFixed(4)}\n` +
          `  Warning threshold: ${config.healthFactorWarning}\n` +
          `  Critical threshold: ${config.healthFactorCritical}\n` +
          `  Total collateral: $${position.totalCollateralUsd.toFixed(0)} (${position.collateralAsset})\n` +
          `  Total debt: $${position.totalDebtUsd.toFixed(2)} (${position.debtAsset})\n` +
          `  Current LTV: ${(position.ltv * 100).toFixed(2)}%\n` +
          `  Liquidation threshold: ${(position.liquidationThreshold * 100).toFixed(0)}%\n` +
          `  Collateral price: $${position.collateralPriceUsd.toFixed(2)}\n` +
          `  Estimated time to liquidation: ${trendStr}\n\n` +
          "What action should be taken to protect this position? " +
          "If recommending REPAY_DEBT or ADD_COLLATERAL, specify the USD amount.",
      },
    ],
  });

  const text = response.content[0]?.type === "text" ? response.content[0].text : "{}";

  interface ClaudeRecommendation {
    recommendation?: "REPAY_DEBT" | "ADD_COLLATERAL" | "MONITOR";
    urgency?: string;
    amountUsd?: number;
    reasoning?: string;
  }

  let recommendation: ClaudeRecommendation = {};
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) recommendation = JSON.parse(match[0]) as ClaudeRecommendation;
  } catch {
    recommendation = { recommendation: "MONITOR", reasoning: "Failed to parse Claude response" };
  }

  console.log(chalk.gray(`\n  Claude recommends: ${recommendation.recommendation ?? "MONITOR"}`));
  console.log(chalk.gray(`  Reasoning: ${recommendation.reasoning ?? "No reasoning provided"}`));
  console.log(chalk.gray(`  Urgency: ${recommendation.urgency ?? "unknown"}`));

  if (recommendation.recommendation === "MONITOR") {
    console.log(chalk.yellow("\n  Monitoring — no immediate action required."));
    return;
  }

  const amountUsd = recommendation.amountUsd ?? position.totalDebtUsd * 0.1;
  const details =
    recommendation.recommendation === "REPAY_DEBT"
      ? `Repay $${amountUsd.toFixed(2)} USDC debt`
      : `Add $${amountUsd.toFixed(2)} collateral`;

  if (recommendation.urgency === "immediate" || position.healthFactor < config.healthFactorWarning - 0.05) {
    await act.execute(
      recommendation.recommendation,
      { actionType: recommendation.recommendation, amountUsd, details },
      config.chainId,
      config.dryRun,
    );
  } else {
    console.log(chalk.yellow(`\n  Queued for next cycle: ${details}`));
  }
}

main().catch((err: unknown) => {
  console.error(chalk.red("\n  Fatal error:"), err);
  process.exit(1);
});
