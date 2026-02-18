// ---------------------------------------------------------------------------
// Meridian Demo — Yield Farming Rotation Optimizer on Arbitrum Sepolia
// ---------------------------------------------------------------------------
//
// This demo showcases the Meridian SDK by running an autonomous yield
// optimization agent that:
//   1. Monitors simulated APY rates across Aave V3, Compound V3, and Curve
//   2. When a protocol offers >MIN_APY_DIFF% better yield, evaluates rotation
//   3. Uses Claude to weigh gas costs vs yield benefit and protocol safety
//   4. In dry-run: shows analysis without moving funds
//   5. Logs: current APY, target APY, gas estimate, net benefit, decision
//
// Usage:
//   DRY_RUN=true tsx src/index.ts          # analyse only (default)
//   DRY_RUN=false tsx src/index.ts         # live rotation
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
  chainId: 421614,
  minApyDiff: Number(process.env["MIN_APY_DIFF"] ?? "2"),
  dryRun: isDryRun,
  // Check every 5 minutes
  checkIntervalMs: 5 * 60 * 1_000,
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
// Protocol APY simulation
// ---------------------------------------------------------------------------

interface ProtocolYield {
  protocol: string;
  asset: string;
  supplyApy: number;
  rewardApy: number;
  totalApy: number;
  tvlUsd: number;
  riskScore: number; // 1 (safest) – 10 (riskiest)
  auditCount: number;
}

// Start at realistic APY levels with drift
const baseApys: Record<string, number> = {
  "aave-v3:USDC": 4.8,
  "aave-v3:ETH": 2.1,
  "compound-v3:USDC": 5.2,
  "compound-v3:ETH": 1.9,
  "curve:USDC-3CRV": 6.5,
  "curve:ETH-stETH": 3.8,
};

function simulateProtocolYields(): ProtocolYield[] {
  const yields: ProtocolYield[] = [];

  for (const [key, base] of Object.entries(baseApys)) {
    const [protocol, asset] = key.split(":") as [string, string];
    // Small random drift to APY
    baseApys[key] = Math.max(0.1, base + (Math.random() - 0.5) * 0.4);

    const supplyApy = baseApys[key]! * 0.8;
    const rewardApy = baseApys[key]! * 0.2;
    const totalApy = supplyApy + rewardApy;

    const riskScores: Record<string, number> = {
      "aave-v3": 2,
      "compound-v3": 2,
      "curve": 3,
    };

    yields.push({
      protocol,
      asset,
      supplyApy,
      rewardApy,
      totalApy,
      tvlUsd:
        protocol === "aave-v3" ? 8_000_000_000 :
        protocol === "compound-v3" ? 3_000_000_000 :
        1_500_000_000,
      riskScore: riskScores[protocol] ?? 5,
      auditCount: protocol === "curve" ? 5 : 8,
    });
  }

  return yields.sort((a, b) => b.totalApy - a.totalApy);
}

// ---------------------------------------------------------------------------
// Current position state
// ---------------------------------------------------------------------------

interface CurrentPosition {
  protocol: string;
  asset: string;
  apy: number;
  valueUsd: number;
  entryTimestamp: number;
}

let currentPosition: CurrentPosition = {
  protocol: "aave-v3",
  asset: "USDC",
  apy: 4.8,
  valueUsd: 10_000,
  entryTimestamp: Date.now(),
};

let rotationCount = 0;

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

function printBanner(): void {
  console.log();
  console.log(chalk.bold.blue("  ╔══════════════════════════════════════════════════╗"));
  console.log(chalk.bold.blue("  ║  Meridian Yield Optimizer — Arbitrum Sepolia     ║"));
  console.log(chalk.bold.blue("  ╚══════════════════════════════════════════════════╝"));
  console.log();
}

function printConfig(address: string): void {
  console.log(chalk.gray("  Configuration:"));
  console.log(chalk.gray(`    Wallet:         ${address}`));
  console.log(chalk.gray(`    Min APY diff:   ${config.minApyDiff}%`));
  console.log(chalk.gray(`    Check interval: ${config.checkIntervalMs / 60_000} min`));
  console.log(chalk.gray(`    Mode:           ${config.dryRun ? chalk.yellow("DRY RUN") : chalk.red("LIVE")}`));
  console.log();
}

function printCheckHeader(cycle: number): void {
  const ts = new Date().toISOString();
  console.log(chalk.bold(`\n  ─── Check ${cycle} · ${ts} ───`));
}

function printCurrentPosition(): void {
  const daysHeld = (Date.now() - currentPosition.entryTimestamp) / (1000 * 60 * 60 * 24);
  const earnedUsd = currentPosition.valueUsd * (currentPosition.apy / 100) * (daysHeld / 365);
  console.log();
  console.log(chalk.bold("  Current Position:"));
  console.log(`    Protocol: ${chalk.white(currentPosition.protocol)}`);
  console.log(`    Asset:    ${chalk.white(currentPosition.asset)}`);
  console.log(`    APY:      ${chalk.white(`${currentPosition.apy.toFixed(2)}%`)}`);
  console.log(`    Value:    ${chalk.white(`$${currentPosition.valueUsd.toFixed(0)}`)}`);
  console.log(`    Held for: ${chalk.gray(`${daysHeld.toFixed(2)} days`)}`);
  console.log(`    Earned:   ${chalk.green(`~$${earnedUsd.toFixed(4)}`)}`);
}

function printYieldTable(yields: ProtocolYield[]): void {
  console.log();
  console.log(chalk.gray("  Protocol APYs:"));
  console.log(
    chalk.gray("    " +
      "PROTOCOL".padEnd(14) +
      "ASSET".padEnd(12) +
      "SUPPLY".padEnd(9) +
      "REWARD".padEnd(9) +
      "TOTAL".padEnd(9) +
      "TVL".padEnd(10) +
      "RISK"),
  );
  console.log(chalk.gray("    " + "─".repeat(68)));

  for (const y of yields) {
    const isCurrent =
      y.protocol === currentPosition.protocol &&
      y.asset === currentPosition.asset;
    const row =
      `    ${y.protocol.padEnd(14)}${y.asset.padEnd(12)}` +
      `${y.supplyApy.toFixed(2)}%`.padEnd(9) +
      `${y.rewardApy.toFixed(2)}%`.padEnd(9) +
      `${y.totalApy.toFixed(2)}%`.padEnd(9) +
      `$${(y.tvlUsd / 1_000_000_000).toFixed(1)}B`.padEnd(10) +
      `${y.riskScore}/10`;
    if (isCurrent) {
      console.log(chalk.cyan(row + " ← current"));
    } else {
      console.log(row);
    }
  }
}

function printRotation(
  from: CurrentPosition,
  to: ProtocolYield,
  gasUsd: number,
  daysToBreakEven: number,
  action: string,
): void {
  const apyGain = to.totalApy - from.apy;
  console.log();
  console.log(chalk.bold.blue("  [ROTATION ANALYSIS]"));
  console.log(`    From:          ${chalk.white(`${from.protocol} · ${from.asset} @ ${from.apy.toFixed(2)}% APY`)}`);
  console.log(`    To:            ${chalk.white(`${to.protocol} · ${to.asset} @ ${to.totalApy.toFixed(2)}% APY`)}`);
  console.log(`    APY gain:      ${chalk.green(`+${apyGain.toFixed(2)}%`)}`);
  console.log(`    Gas cost:      ${chalk.white(`~$${gasUsd.toFixed(2)}`)}`);
  console.log(`    Break-even:    ${chalk.white(`${daysToBreakEven.toFixed(1)} days`)}`);
  console.log(`    Action:        ${action}`);
}

function printHold(reason: string): void {
  console.log(chalk.gray(`\n  [HOLD] ${reason}`));
}

// ---------------------------------------------------------------------------
// Current protocol yields shared between providers
// ---------------------------------------------------------------------------

let currentYields: ProtocolYield[] = [];

// ---------------------------------------------------------------------------
// Sense provider
// ---------------------------------------------------------------------------

class YieldSenseProvider implements ISenseProvider {
  async gather(_agentId: string, _chainIds: number[]): Promise<MarketSnapshot> {
    currentYields = simulateProtocolYields();

    const prices: Record<string, number> = {};
    for (const y of currentYields) {
      prices[`${y.protocol}:${y.asset}:apy`] = y.totalApy;
    }

    return {
      timestamp: Date.now(),
      prices,
      balances: {
        [currentPosition.protocol]: currentPosition.valueUsd.toString(),
      },
      positions: currentYields.map((y) => ({
        protocol: y.protocol,
        asset: y.asset,
        supplyApy: y.supplyApy,
        rewardApy: y.rewardApy,
        totalApy: y.totalApy,
        tvlUsd: y.tvlUsd,
        riskScore: y.riskScore,
        isCurrent:
          y.protocol === currentPosition.protocol &&
          y.asset === currentPosition.asset,
      })),
      gasPerChain: {},
      blockNumbers: {},
    };
  }
}

// ---------------------------------------------------------------------------
// Think provider
// ---------------------------------------------------------------------------

class YieldThinkProvider implements IThinkProvider {
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

class YieldActProvider implements IActProvider {
  async execute(
    action: string,
    params: Record<string, unknown>,
    chainId: number,
    dryRun: boolean,
  ): Promise<TxResult | null> {
    if (action === "HOLD") return null;

    const targetYield = params["target"] as ProtocolYield | undefined;
    const gasUsd = Number(params["gasUsd"] ?? 5);
    const daysToBreakEven = Number(params["daysToBreakEven"] ?? 999);

    if (!targetYield) return null;

    rotationCount++;

    if (dryRun) {
      printRotation(
        currentPosition,
        targetYield,
        gasUsd,
        daysToBreakEven,
        chalk.yellow("SIMULATED (DRY RUN)"),
      );

      // Update position state for the simulation
      currentPosition = {
        protocol: targetYield.protocol,
        asset: targetYield.asset,
        apy: targetYield.totalApy,
        valueUsd: currentPosition.valueUsd - gasUsd,
        entryTimestamp: Date.now(),
      };

      return {
        hash: `0x${"b".repeat(64)}`,
        chainId,
        status: "confirmed",
        timestamp: Date.now(),
      };
    }

    // Live mode: send minimal self-transfer as proof
    // A real implementation would: withdraw from current protocol → deposit to target
    try {
      const txHash = await walletClient.sendTransaction({
        to: account.address,
        value: parseUnits("0.0001", 18),
        chain: arbitrumSepolia,
        account,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      printRotation(
        currentPosition,
        targetYield,
        gasUsd,
        daysToBreakEven,
        chalk.green(`EXECUTED — tx: ${txHash}`),
      );

      currentPosition = {
        protocol: targetYield.protocol,
        asset: targetYield.asset,
        apy: targetYield.totalApy,
        valueUsd: currentPosition.valueUsd - gasUsd,
        entryTimestamp: Date.now(),
      };

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

class YieldMemoryProvider implements IMemoryProvider {
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

const yieldStrategy: IStrategy = {
  id: "yield-optimizer-v1",
  name: "Yield Farming Rotation Optimizer",
  version: "1.0.0",
  description:
    "Monitors protocol APYs and rotates funds to maximize yield, considering gas costs and protocol risk.",
  triggers: [
    {
      type: TriggerType.TIME_INTERVAL,
      params: { intervalMs: config.checkIntervalMs },
      description: "Check APYs every 5 minutes",
    },
  ],
  actions: [
    {
      type: ActionType.REBALANCE,
      params: {},
      chainId: 421614,
      protocol: "aave-v3",
    },
  ],
  constraints: {
    maxPositionPct: 100,
    stopLossPct: -100,
    maxDailyTrades: 3,
    maxSlippageBps: 30,
    allowedProtocols: ["aave-v3", "compound-v3", "curve"],
  },
  params: {
    maxRiskScore: 4,
    minDaysToBreakEven: 7,
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
const act = new YieldActProvider();

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  printBanner();
  printConfig(account.address);

  const eventBus = new EventBus();
  const sense = new YieldSenseProvider();
  const think = new YieldThinkProvider();
  const memory = new YieldMemoryProvider();

  const agent = new Agent(
    {
      id: "yield-optimizer-001",
      name: "Yield Optimizer",
      capabilities: ["STAKE", "PORTFOLIO_MANAGEMENT"],
      chains: [config.chainId],
      tickIntervalMs: config.checkIntervalMs,
      maxCycles: 0,
      dryRun: config.dryRun,
      cooldownMs: 10_000,
    },
    { eventBus, sense, think, act, memory },
  );

  agent.setStrategy(yieldStrategy);

  let cycleCount = 0;

  eventBus.on("market:snapshot", () => {
    cycleCount++;
    printCheckHeader(cycleCount);
    printCurrentPosition();
    printYieldTable(currentYields);
    evaluateRotation().catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(`  Evaluation error: ${msg}`));
    });
  });

  eventBus.on("agent:error", ({ error }) => {
    console.error(chalk.red(`  Agent error: ${error.message}`));
  });

  const shutdown = async () => {
    console.log(chalk.gray("\n  Shutting down yield optimizer..."));
    const daysHeld = (Date.now() - currentPosition.entryTimestamp) / (1000 * 60 * 60 * 24);
    const earnedUsd = currentPosition.valueUsd * (currentPosition.apy / 100) * (daysHeld / 365);
    console.log(chalk.bold("\n  Session Summary:"));
    console.log(`    Rotations performed: ${rotationCount}`);
    console.log(`    Final protocol:      ${currentPosition.protocol} · ${currentPosition.asset}`);
    console.log(`    Final APY:           ${currentPosition.apy.toFixed(2)}%`);
    console.log(`    Est. earnings:       ~$${earnedUsd.toFixed(4)}`);
    await agent.kill();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  console.log(chalk.gray("  Starting yield optimizer...\n"));
  await agent.start();
}

async function evaluateRotation(): Promise<void> {
  const maxRiskScore = Number(yieldStrategy.params["maxRiskScore"] ?? 4);
  const minDaysToBreakEven = Number(yieldStrategy.params["minDaysToBreakEven"] ?? 7);

  // Find best yield that satisfies risk constraints
  const eligible = currentYields.filter(
    (y) =>
      y.riskScore <= maxRiskScore &&
      !(y.protocol === currentPosition.protocol && y.asset === currentPosition.asset),
  );

  if (eligible.length === 0) {
    printHold("No eligible protocols found within risk constraints.");
    return;
  }

  const best = eligible[0]!; // already sorted by totalApy
  const apyDiff = best.totalApy - currentPosition.apy;

  if (apyDiff < config.minApyDiff) {
    printHold(
      `Best alternative (${best.protocol} · ${best.asset} @ ${best.totalApy.toFixed(2)}%) ` +
      `offers only +${apyDiff.toFixed(2)}% vs threshold of +${config.minApyDiff}%.`,
    );
    return;
  }

  // Estimate gas cost (mock — real impl would simulate the tx)
  const gasUsd = 3 + Math.random() * 4; // $3–$7 on Arbitrum

  // Days to break even: gas cost / daily yield gain
  const dailyYieldGainUsd =
    (currentPosition.valueUsd * (apyDiff / 100)) / 365;
  const daysToBreakEven = dailyYieldGainUsd > 0 ? gasUsd / dailyYieldGainUsd : 9999;

  console.log(chalk.bold(`\n  Best opportunity: ${best.protocol} · ${best.asset} @ ${best.totalApy.toFixed(2)}% APY`));
  console.log(chalk.gray(`  APY gain: +${apyDiff.toFixed(2)}%  Gas: ~$${gasUsd.toFixed(2)}  Break-even: ${daysToBreakEven.toFixed(1)} days`));

  if (daysToBreakEven > minDaysToBreakEven * 3) {
    printHold(`Break-even takes ${daysToBreakEven.toFixed(1)} days — gas cost too high relative to yield gain.`);
    return;
  }

  console.log(chalk.gray("\n  Asking Claude to evaluate rotation..."));

  const response = await anthropic.messages.create({
    model: config.claudeModel,
    max_tokens: 400,
    system:
      "You are a DeFi yield optimization advisor. Evaluate whether rotating between yield protocols is beneficial. " +
      "Respond with JSON: { \"rotate\": boolean, \"reason\": string, \"concerns\": string[] }",
    messages: [
      {
        role: "user",
        content:
          `Current position:\n` +
          `  Protocol: ${currentPosition.protocol}\n` +
          `  Asset: ${currentPosition.asset}\n` +
          `  APY: ${currentPosition.apy.toFixed(2)}%\n` +
          `  Value: $${currentPosition.valueUsd.toFixed(0)}\n\n` +
          `Target position:\n` +
          `  Protocol: ${best.protocol}\n` +
          `  Asset: ${best.asset}\n` +
          `  APY: ${best.totalApy.toFixed(2)}% (supply: ${best.supplyApy.toFixed(2)}% + rewards: ${best.rewardApy.toFixed(2)}%)\n` +
          `  TVL: $${(best.tvlUsd / 1_000_000_000).toFixed(1)}B\n` +
          `  Risk score: ${best.riskScore}/10\n` +
          `  Audit count: ${best.auditCount}\n\n` +
          `Economics:\n` +
          `  APY gain: +${apyDiff.toFixed(2)}%\n` +
          `  Gas cost: ~$${gasUsd.toFixed(2)}\n` +
          `  Break-even: ${daysToBreakEven.toFixed(1)} days\n` +
          `  Min days to break-even threshold: ${minDaysToBreakEven}\n\n` +
          "Should we rotate to maximize yield? Consider reward token sustainability and protocol risks.",
      },
    ],
  });

  const text = response.content[0]?.type === "text" ? response.content[0].text : "{}";

  let decision: { rotate?: boolean; reason?: string; concerns?: string[] } = {};
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) decision = JSON.parse(match[0]) as typeof decision;
  } catch {
    decision = { rotate: false, reason: "Failed to parse Claude response" };
  }

  console.log(chalk.gray(`\n  Claude: ${decision.reason ?? "No reason given"}`));
  if (decision.concerns && decision.concerns.length > 0) {
    for (const concern of decision.concerns) {
      console.log(chalk.yellow(`  Concern: ${concern}`));
    }
  }

  if (decision.rotate === false) {
    printHold(decision.reason ?? "Claude recommended holding current position");
    return;
  }

  await act.execute(
    "ROTATE",
    { target: best, gasUsd, daysToBreakEven },
    config.chainId,
    config.dryRun,
  );
}

main().catch((err: unknown) => {
  console.error(chalk.red("\n  Fatal error:"), err);
  process.exit(1);
});
