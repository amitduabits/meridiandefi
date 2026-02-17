// ---------------------------------------------------------------------------
// Meridian Demo — Multi-Agent DeFi Portfolio Team
// ---------------------------------------------------------------------------
//
// 3 agents collaborate to manage a DeFi portfolio:
//   1. Market Analyst — scans markets, produces trade signals
//   2. Risk Manager — evaluates signals against risk limits
//   3. Executor — plans and executes approved trades
// ---------------------------------------------------------------------------

import chalk from "chalk";
import { EventBus, type MarketSnapshot } from "@meridian/sdk";

import { MarketAnalyst, type TradeSignal } from "./analyst.js";
import { RiskManager } from "./risk-manager.js";
import { Executor } from "./executor.js";
import {
  printBanner,
  printAnalystScanning,
  printAnalystSignal,
  printAnalystNoSignal,
  printRiskReceived,
  printRiskCheck,
  printRiskDecision,
  printExecutorReceived,
  printExecutorPlan,
  printExecutorResult,
  printTeamSummary,
  printWaiting,
  printError,
} from "./display.js";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CYCLE_INTERVAL_SEC = Number(process.env["CYCLE_INTERVAL_SEC"] ?? "10");
const MAX_CYCLES = Number(process.env["MAX_CYCLES"] ?? "0"); // 0 = unlimited
const DRY_RUN = process.env["DRY_RUN"] !== "false"; // default: true for safety

// ---------------------------------------------------------------------------
// Mock market snapshot generator
// ---------------------------------------------------------------------------

function generateMockSnapshot(cycle: number): MarketSnapshot {
  const baseEth = 3400 + Math.sin(cycle * 0.5) * 80 + (Math.random() - 0.5) * 40;
  const baseArb = 0.85 + Math.sin(cycle * 0.3) * 0.05 + (Math.random() - 0.5) * 0.02;

  return {
    timestamp: Date.now(),
    prices: {
      ETH: baseEth,
      USDC: 1.0,
      WBTC: 97_000 + (Math.random() - 0.5) * 500,
      ARB: baseArb,
    },
    balances: {
      ETH: "5.0",
      USDC: "10000",
      WBTC: "0.05",
      ARB: "5000",
    },
    positions: [
      { token: "ETH", valueUsd: baseEth * 5, pct: 35 },
      { token: "USDC", valueUsd: 10_000, pct: 20 },
      { token: "WBTC", valueUsd: 97_000 * 0.05, pct: 10 },
      { token: "ARB", valueUsd: baseArb * 5000, pct: 9 },
    ],
    gasPerChain: {
      421614: 0.3 + Math.random() * 0.5, // Arbitrum Sepolia: very low gas
    },
    blockNumbers: {
      421614: 50_000_000 + cycle * 12,
    },
  };
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  printBanner();

  console.log(chalk.gray("  Mode:     ") + (DRY_RUN ? chalk.yellow("DRY RUN") : chalk.green("LIVE")));
  console.log(chalk.gray("  Interval: ") + chalk.cyan(`${CYCLE_INTERVAL_SEC}s`));
  console.log(chalk.gray("  Agents:   ") + chalk.cyan("Analyst, Risk Manager, Executor"));
  console.log();

  // Create shared event bus and agents.
  const bus = new EventBus();
  const analyst = new MarketAnalyst(bus);
  const riskManager = new RiskManager();
  const executor = new Executor();

  // Track state for risk evaluation.
  let currentExposurePct = 35; // simulated
  const dailyDrawdownPct = -1.2;

  let cycle = 0;

  // Graceful shutdown
  let running = true;
  const shutdown = () => {
    console.log(chalk.gray("\n  Shutting down team..."));
    running = false;
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  while (running) {
    cycle++;
    if (MAX_CYCLES > 0 && cycle > MAX_CYCLES) break;

    const cycleStart = Date.now();
    let signalCount = 0;
    let approvedCount = 0;
    let executedCount = 0;

    console.log(chalk.blue(`  --- Cycle #${cycle} --- ${new Date().toLocaleTimeString()} ---`));
    console.log();

    // 1. Analyst scans markets
    printAnalystScanning();
    const snapshot = generateMockSnapshot(cycle);

    let signals: TradeSignal[];
    try {
      signals = await analyst.analyze(snapshot);
    } catch (err) {
      printError("analyst", err instanceof Error ? err.message : String(err));
      signals = [];
    }

    signalCount = signals.length;

    if (signals.length === 0) {
      printAnalystNoSignal();
    }

    // 2. Risk Manager evaluates each signal
    for (const signal of signals) {
      printAnalystSignal(
        signal.token,
        `${signal.direction} opportunity — confidence ${(signal.confidence * 100).toFixed(0)}%`,
      );

      const gasGwei = snapshot.gasPerChain[421614] ?? 1;
      printRiskReceived(`${signal.direction} ${signal.token}`);

      const evaluation = riskManager.evaluate(
        signal,
        currentExposurePct,
        dailyDrawdownPct,
        gasGwei,
      );

      for (const check of evaluation.checks) {
        printRiskCheck(check.detail, check.passed);
      }

      printRiskDecision(evaluation.approved, evaluation.reasoning);

      // 3. If approved, Executor executes
      if (evaluation.approved) {
        approvedCount++;

        printExecutorReceived(`${signal.direction} ${signal.suggestedSizePct}% ${signal.token}`);
        printExecutorPlan(
          `${signal.direction === "BUY" ? "USDC" : signal.token} -> ${signal.direction === "BUY" ? signal.token : "USDC"} via Uniswap V3`,
        );

        try {
          const result = await executor.execute(signal, evaluation, DRY_RUN);

          printExecutorResult(result.success, result.txHash);

          if (result.success) {
            executedCount++;
            // Update simulated exposure
            if (signal.direction === "BUY") {
              currentExposurePct += signal.suggestedSizePct;
            } else {
              currentExposurePct -= signal.suggestedSizePct;
            }
          }
        } catch (err) {
          printError("executor", err instanceof Error ? err.message : String(err));
        }
      }
    }

    // Team summary
    const cycleMs = Date.now() - cycleStart;
    printTeamSummary(cycle, signalCount, approvedCount, executedCount, cycleMs);

    if (running) {
      printWaiting(CYCLE_INTERVAL_SEC);
      await sleep(CYCLE_INTERVAL_SEC * 1000);
    }
  }

  console.log(chalk.gray("  Team session ended."));
  console.log(
    chalk.gray(
      `  Total: ${analyst.totalSignals} signals, ${riskManager.totalApproved} approved, ${riskManager.totalRejected} rejected, ${executor.totalExecuted} executed`,
    ),
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error(chalk.red("\n  Fatal error:"), err);
  process.exit(1);
});
