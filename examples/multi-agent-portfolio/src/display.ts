// ---------------------------------------------------------------------------
// CLI display — beautiful terminal output for the multi-agent demo.
// ---------------------------------------------------------------------------

import chalk from "chalk";

// ---------------------------------------------------------------------------
// Banner
// ---------------------------------------------------------------------------

export function printBanner(): void {
  const top = chalk.blue("╔" + "═".repeat(63) + "╗");
  const bot = chalk.blue("╚" + "═".repeat(63) + "╝");

  console.log();
  console.log(top);
  console.log(
    chalk.blue("║") +
      chalk.bold.white("  MERIDIAN — Multi-Agent DeFi Portfolio Team") +
      " ".repeat(19) +
      chalk.blue("║"),
  );
  console.log(bot);
  console.log();
}

// ---------------------------------------------------------------------------
// Agent-specific prefixes
// ---------------------------------------------------------------------------

const AGENT_COLORS = {
  analyst: chalk.cyan,
  risk: chalk.yellow,
  executor: chalk.green,
} as const;

const AGENT_LABELS = {
  analyst: "Analyst",
  risk: "Risk Manager",
  executor: "Executor",
} as const;

const AGENT_ICONS = {
  analyst: "?",
  risk: "!",
  executor: ">",
} as const;

type AgentRole = keyof typeof AGENT_COLORS;

function prefix(role: AgentRole): string {
  const color = AGENT_COLORS[role];
  return color(`  ${AGENT_ICONS[role]} [${AGENT_LABELS[role]}]`);
}

// ---------------------------------------------------------------------------
// Analyst messages
// ---------------------------------------------------------------------------

export function printAnalystScanning(): void {
  console.log(prefix("analyst") + chalk.white(" Scanning markets..."));
}

export function printAnalystSignal(token: string, detail: string): void {
  console.log(prefix("analyst") + chalk.white(` Found: ${token} — ${detail}`));
  console.log(prefix("analyst") + chalk.gray(" Broadcasting signal to team..."));
  console.log();
}

export function printAnalystNoSignal(): void {
  console.log(prefix("analyst") + chalk.gray(" No actionable signals found."));
  console.log();
}

// ---------------------------------------------------------------------------
// Risk Manager messages
// ---------------------------------------------------------------------------

export function printRiskReceived(signalDescription: string): void {
  console.log(prefix("risk") + chalk.white(` Received signal: ${signalDescription}`));
}

export function printRiskCheck(label: string, passed: boolean): void {
  const status = passed ? chalk.green(" PASS") : chalk.red(" FAIL");
  console.log(prefix("risk") + chalk.gray(`   ${label}`) + status);
}

export function printRiskDecision(approved: boolean, reason: string): void {
  if (approved) {
    console.log(prefix("risk") + chalk.green(` APPROVED. ${reason}`));
  } else {
    console.log(prefix("risk") + chalk.red(` REJECTED. ${reason}`));
  }
  console.log();
}

// ---------------------------------------------------------------------------
// Executor messages
// ---------------------------------------------------------------------------

export function printExecutorReceived(task: string): void {
  console.log(prefix("executor") + chalk.white(` Received approved task: ${task}`));
}

export function printExecutorPlan(detail: string): void {
  console.log(prefix("executor") + chalk.gray(`   Plan: ${detail}`));
}

export function printExecutorResult(
  success: boolean,
  txHash: string | null,
): void {
  if (success) {
    console.log(prefix("executor") + chalk.green(" Execution complete"));
    if (txHash) {
      console.log(prefix("executor") + chalk.gray(`   Tx: ${txHash}`));
    }
  } else {
    console.log(prefix("executor") + chalk.red(" Execution failed"));
  }
  console.log();
}

// ---------------------------------------------------------------------------
// Team summary
// ---------------------------------------------------------------------------

export function printTeamSummary(
  cycle: number,
  signals: number,
  approved: number,
  executed: number,
  durationMs: number,
): void {
  console.log(
    chalk.magenta(`  [Team Summary]`) +
      chalk.white(` Cycle #${cycle} complete in ${(durationMs / 1000).toFixed(1)}s`),
  );
  console.log(
    chalk.gray(
      `    Signals: ${signals} | Approved: ${approved} | Executed: ${executed}`,
    ),
  );
  console.log();
}

// ---------------------------------------------------------------------------
// Waiting
// ---------------------------------------------------------------------------

export function printWaiting(seconds: number): void {
  console.log(chalk.gray(`  Next cycle in ${seconds} seconds...`));
  console.log(chalk.gray("  " + "─".repeat(56)));
  console.log();
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

export function printError(role: AgentRole, message: string): void {
  console.log(prefix(role) + chalk.red(` Error: ${message}`));
}
