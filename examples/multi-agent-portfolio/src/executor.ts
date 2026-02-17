// ---------------------------------------------------------------------------
// Executor agent — receives approved signals, plans and executes trades.
// ---------------------------------------------------------------------------

import type { TradeSignal } from "./analyst.js";
import type { RiskEvaluation } from "./risk-manager.js";

// ---------------------------------------------------------------------------
// Execution result
// ---------------------------------------------------------------------------

export interface ExecutionResult {
  signalId: string;
  success: boolean;
  action: string;
  route: string;
  txHash: string | null;
  estimatedSlippage: number;
  executionTimeMs: number;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

export class Executor {
  private executed = 0;
  private failed = 0;

  /**
   * Plan and execute a trade based on an approved signal.
   * In a real system, this would call chain connectors.
   * For the demo, we simulate execution.
   */
  async execute(
    signal: TradeSignal,
    _evaluation: RiskEvaluation,
    dryRun: boolean,
  ): Promise<ExecutionResult> {
    const start = Date.now();

    const route = `${signal.direction === "BUY" ? "USDC" : signal.token} -> ${signal.direction === "BUY" ? signal.token : "USDC"} via Uniswap V3 (Arbitrum)`;
    const action = `${signal.direction} ${signal.suggestedSizePct}% ${signal.token}`;

    // Simulate some execution time
    await sleep(200 + Math.random() * 300);

    // Simulate success/failure (90% success rate)
    const success = Math.random() > 0.1;

    if (success) {
      this.executed++;
    } else {
      this.failed++;
    }

    const txHash = success && !dryRun
      ? `0x${randomHex(64)}`
      : dryRun
        ? `0x${"0".repeat(64)} (dry run)`
        : null;

    return {
      signalId: signal.id,
      success,
      action,
      route,
      txHash,
      estimatedSlippage: 0.05 + Math.random() * 0.15,
      executionTimeMs: Date.now() - start,
      timestamp: Date.now(),
    };
  }

  get totalExecuted(): number {
    return this.executed;
  }

  get totalFailed(): number {
    return this.failed;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomHex(length: number): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
