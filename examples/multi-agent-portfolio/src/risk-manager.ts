// ---------------------------------------------------------------------------
// Risk Manager agent — evaluates signals and approves/rejects.
// ---------------------------------------------------------------------------

import type { TradeSignal } from "./analyst.js";

// ---------------------------------------------------------------------------
// Risk decision
// ---------------------------------------------------------------------------

export interface RiskEvaluation {
  signalId: string;
  approved: boolean;
  checks: Array<{ name: string; passed: boolean; detail: string }>;
  reasoning: string;
}

// ---------------------------------------------------------------------------
// Risk limits
// ---------------------------------------------------------------------------

interface RiskLimits {
  maxExposurePct: number;
  maxDailyDrawdownPct: number;
  maxGasGwei: number;
  minConfidence: number;
  maxDailyTrades: number;
}

const DEFAULT_LIMITS: RiskLimits = {
  maxExposurePct: 40,
  maxDailyDrawdownPct: 10,
  maxGasGwei: 100,
  minConfidence: 0.5,
  maxDailyTrades: 20,
};

// ---------------------------------------------------------------------------
// Risk Manager
// ---------------------------------------------------------------------------

export class RiskManager {
  private dailyTrades = 0;
  private approved = 0;
  private rejected = 0;

  constructor(private limits: RiskLimits = DEFAULT_LIMITS) {}

  /**
   * Evaluate a trade signal against risk limits.
   */
  evaluate(
    signal: TradeSignal,
    currentExposurePct: number,
    dailyDrawdownPct: number,
    gasGwei: number,
  ): RiskEvaluation {
    const checks: Array<{ name: string; passed: boolean; detail: string }> = [];

    // Check 1: Portfolio exposure
    const exposureOk = currentExposurePct + signal.suggestedSizePct <= this.limits.maxExposurePct;
    checks.push({
      name: "Portfolio exposure",
      passed: exposureOk,
      detail: `${signal.token} at ${currentExposurePct}% + ${signal.suggestedSizePct}% = ${currentExposurePct + signal.suggestedSizePct}% (limit ${this.limits.maxExposurePct}%)`,
    });

    // Check 2: Daily drawdown
    const drawdownOk = Math.abs(dailyDrawdownPct) < this.limits.maxDailyDrawdownPct;
    checks.push({
      name: "Drawdown check",
      passed: drawdownOk,
      detail: `${dailyDrawdownPct.toFixed(1)}% today (limit -${this.limits.maxDailyDrawdownPct}%)`,
    });

    // Check 3: Gas cost
    const gasOk = gasGwei < this.limits.maxGasGwei;
    checks.push({
      name: "Gas check",
      passed: gasOk,
      detail: `${gasGwei.toFixed(1)} gwei (limit ${this.limits.maxGasGwei})`,
    });

    // Check 4: Signal confidence
    const confidenceOk = signal.confidence >= this.limits.minConfidence;
    checks.push({
      name: "Confidence check",
      passed: confidenceOk,
      detail: `${(signal.confidence * 100).toFixed(0)}% (min ${(this.limits.minConfidence * 100).toFixed(0)}%)`,
    });

    // Check 5: Daily trade count
    const tradeCountOk = this.dailyTrades < this.limits.maxDailyTrades;
    checks.push({
      name: "Trade count",
      passed: tradeCountOk,
      detail: `${this.dailyTrades}/${this.limits.maxDailyTrades} trades today`,
    });

    const allPassed = checks.every((c) => c.passed);

    if (allPassed) {
      this.dailyTrades++;
      this.approved++;
    } else {
      this.rejected++;
    }

    const failedChecks = checks.filter((c) => !c.passed).map((c) => c.name);
    const reasoning = allPassed
      ? "All risk checks passed. Forwarding to Executor."
      : `Rejected — failed checks: ${failedChecks.join(", ")}.`;

    return {
      signalId: signal.id,
      approved: allPassed,
      checks,
      reasoning,
    };
  }

  get totalApproved(): number {
    return this.approved;
  }

  get totalRejected(): number {
    return this.rejected;
  }
}
