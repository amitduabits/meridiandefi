// ---------------------------------------------------------------------------
// CLI display — beautiful terminal output for the rebalancer demo.
// ---------------------------------------------------------------------------

import chalk from "chalk";
import type { TokenConfig } from "./config.js";

// ---------------------------------------------------------------------------
// Box drawing
// ---------------------------------------------------------------------------

const DIVIDER = chalk.gray("─".repeat(56));

export function printBanner(chainName: string, status: string): void {
  const top = chalk.blue("╔" + "═".repeat(56) + "╗");
  const bot = chalk.blue("╚" + "═".repeat(56) + "╝");
  const pad = (s: string, len: number) => s + " ".repeat(Math.max(0, len - s.length));

  console.log();
  console.log(top);
  console.log(
    chalk.blue("║") +
      chalk.bold.white("  MERIDIAN — DeFi Portfolio Rebalancer") +
      " ".repeat(18) +
      chalk.blue("║"),
  );
  console.log(
    chalk.blue("║") +
      chalk.gray(`  Chain: ${pad(chainName, 20)}`) +
      chalk.gray(`|  Status: ${pad(status, 14)}`) +
      chalk.blue("║"),
  );
  console.log(bot);
  console.log();
}

// ---------------------------------------------------------------------------
// Portfolio snapshot table
// ---------------------------------------------------------------------------

export interface AllocationRow {
  token: TokenConfig;
  currentPct: number;
  driftPct: number;
  balanceFormatted: string;
  valueUsd: number;
}

export function printPortfolioTable(
  rows: AllocationRow[],
  blockNumber: number,
  totalValueUsd: number,
): void {
  console.log(chalk.cyan(`  Portfolio Snapshot`) + chalk.gray(` (Block #${blockNumber})`));
  console.log(chalk.gray(`  Total Value: $${totalValueUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`));
  console.log();

  // Header
  console.log(
    chalk.gray("  ┌──────────┬──────────┬──────────┬────────────┐"),
  );
  console.log(
    chalk.gray("  │") +
      chalk.bold(" Token    ") +
      chalk.gray("│") +
      chalk.bold(" Current  ") +
      chalk.gray("│") +
      chalk.bold(" Target   ") +
      chalk.gray("│") +
      chalk.bold(" Drift      ") +
      chalk.gray("│"),
  );
  console.log(
    chalk.gray("  ├──────────┼──────────┼──────────┼────────────┤"),
  );

  for (const row of rows) {
    const driftStr = row.driftPct >= 0 ? `+${row.driftPct.toFixed(1)}%` : `${row.driftPct.toFixed(1)}%`;
    const needsRebalance = Math.abs(row.driftPct) >= 5;
    const driftColored = needsRebalance
      ? chalk.yellow(padRight(driftStr + " !", 10))
      : chalk.green(padRight(driftStr, 10));

    console.log(
      chalk.gray("  │") +
        chalk.white(padRight(` ${row.token.symbol}`, 10)) +
        chalk.gray("│") +
        chalk.white(padRight(` ${row.currentPct.toFixed(1)}%`, 10)) +
        chalk.gray("│") +
        chalk.gray(padRight(` ${(row.token.targetPct * 100).toFixed(1)}%`, 10)) +
        chalk.gray("│") +
        " " +
        driftColored +
        " " +
        chalk.gray("│"),
    );
  }

  console.log(
    chalk.gray("  └──────────┴──────────┴──────────┴────────────┘"),
  );
  console.log();
}

// ---------------------------------------------------------------------------
// Agent reasoning
// ---------------------------------------------------------------------------

export function printReasoning(reasoning: string): void {
  console.log(chalk.magenta("  Agent Reasoning:"));
  const lines = reasoning.split("\n");
  for (const line of lines) {
    console.log(chalk.gray(`    "${line.trim()}"`));
  }
  console.log();
}

// ---------------------------------------------------------------------------
// Action result
// ---------------------------------------------------------------------------

export function printAction(
  action: string,
  txHash: string | null,
  gasCost: string | null,
): void {
  if (action === "HOLD") {
    console.log(chalk.green("  Action: HOLD — no rebalance needed"));
  } else {
    console.log(chalk.green(`  Action: ${action}`));
    if (txHash) {
      const explorerUrl = `https://sepolia.arbiscan.io/tx/${txHash}`;
      console.log(chalk.gray(`    Tx: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`));
      console.log(chalk.blue(`    ${explorerUrl}`));
    }
    if (gasCost) {
      console.log(chalk.gray(`    Gas: ${gasCost}`));
    }
  }
  console.log();
}

// ---------------------------------------------------------------------------
// Wait indicator
// ---------------------------------------------------------------------------

export function printWaiting(seconds: number): void {
  console.log(chalk.gray(`  Next check in ${seconds} seconds...`));
  console.log(DIVIDER);
  console.log();
}

// ---------------------------------------------------------------------------
// Error display
// ---------------------------------------------------------------------------

export function printError(message: string): void {
  console.log(chalk.red(`  Error: ${message}`));
  console.log();
}

// ---------------------------------------------------------------------------
// Startup info
// ---------------------------------------------------------------------------

export function printStartup(
  address: string,
  chainId: number,
  dryRun: boolean,
  driftThreshold: number,
): void {
  console.log(chalk.gray(DIVIDER));
  console.log(chalk.white("  Wallet:     ") + chalk.cyan(address));
  console.log(chalk.white("  Chain ID:   ") + chalk.cyan(chainId.toString()));
  console.log(chalk.white("  Drift Thr:  ") + chalk.cyan(`${(driftThreshold * 100).toFixed(0)}%`));
  console.log(
    chalk.white("  Mode:       ") +
      (dryRun ? chalk.yellow("DRY RUN (no real txs)") : chalk.green("LIVE")),
  );
  console.log(chalk.gray(DIVIDER));
  console.log();
}

// ---------------------------------------------------------------------------
// Cycle header
// ---------------------------------------------------------------------------

export function printCycleHeader(cycle: number): void {
  console.log(chalk.blue(`  ━━━ Cycle #${cycle} ━━━ ${new Date().toLocaleTimeString()} ━━━`));
  console.log();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function padRight(str: string, len: number): string {
  return str + " ".repeat(Math.max(0, len - str.length));
}
