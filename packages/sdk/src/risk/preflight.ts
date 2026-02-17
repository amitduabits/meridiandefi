// ---------------------------------------------------------------------------
// Pre-flight validator — checks before EVERY transaction.
// DETERMINISTIC: pure logic, no LLM calls, no I/O.
// ---------------------------------------------------------------------------

import type { Logger } from "pino";
import type { RiskLimits, RiskDecision } from "../types/risk.js";
import { RiskLimitsSchema } from "../types/risk.js";
import { RiskError } from "../core/errors.js";
import { createLogger } from "../core/logger.js";

// ---------------------------------------------------------------------------
// Types local to pre-flight validation.
// ---------------------------------------------------------------------------

/** Snapshot of the portfolio state at the moment of validation. */
export interface PortfolioSnapshot {
  /** Total portfolio value in USD. */
  totalValueUsd: number;
  /** Per-position values in USD. */
  positionValues: number[];
  /** Number of currently open positions. */
  openPositions: number;
  /** Number of trades executed today. */
  dailyTradeCount: number;
  /** Portfolio equity at start of day in USD. */
  dayStartEquityUsd: number;
  /** Current portfolio equity in USD. */
  currentEquityUsd: number;
}

/** Parameters for the action being validated. */
export interface ActionParams {
  /** Action type, e.g. "SWAP", "PROVIDE_LIQUIDITY". */
  action: string;
  /** Trade value in USD. */
  tradeValueUsd: number;
  /** Estimated slippage in basis points. */
  estimatedSlippageBps: number;
  /** Estimated gas cost in USD. */
  gasCostUsd: number;
  /** Chain ID for the transaction. */
  chainId: number;
}

// ---------------------------------------------------------------------------
// Individual check results — collected and merged into a RiskDecision.
// ---------------------------------------------------------------------------

interface CheckResult {
  passed: boolean;
  reason?: string;
  warning?: string;
  /** Contribution to the overall risk score (0-100 scale). */
  riskContribution: number;
  /** Optional modification suggestions (e.g. reduce size). */
  modifications?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// PreFlightValidator
// ---------------------------------------------------------------------------

export class PreFlightValidator {
  private readonly limits: RiskLimits;
  private readonly log: Logger;

  constructor(limits: RiskLimits, logger?: Logger) {
    // Validate limits at construction time.
    const parsed = RiskLimitsSchema.safeParse(limits);
    if (!parsed.success) {
      throw new RiskError("Invalid risk limits", {
        code: "RISK_INVALID_LIMITS",
        context: { errors: parsed.error.flatten() },
      });
    }
    this.limits = parsed.data;
    this.log = logger ?? createLogger({ module: "PreFlightValidator" });
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Run all pre-flight checks and return a RiskDecision.
   *
   * If ANY check fails, the decision is **denied** (allowed = false).
   * Warnings are accumulated even when the overall decision is allowed.
   */
  validate(action: ActionParams, portfolio: PortfolioSnapshot): RiskDecision {
    const checks: CheckResult[] = [
      this.checkPositionSize(action, portfolio),
      this.checkPortfolioExposure(action, portfolio),
      this.checkGasCost(action),
      this.checkSlippage(action),
      this.checkDailyLoss(portfolio),
      this.checkDailyTradeLimit(portfolio),
      this.checkOpenPositionLimit(portfolio),
    ];

    const warnings: string[] = [];
    const reasons: string[] = [];
    let riskScore = 0;
    let allowed = true;
    let modifications: Record<string, unknown> = {};

    for (const check of checks) {
      if (!check.passed) {
        allowed = false;
        if (check.reason) reasons.push(check.reason);
      }
      if (check.warning) warnings.push(check.warning);
      riskScore += check.riskContribution;
      if (check.modifications) {
        modifications = { ...modifications, ...check.modifications };
      }
    }

    // Clamp risk score to [0, 100].
    riskScore = Math.min(100, Math.max(0, riskScore));

    const decision: RiskDecision = {
      allowed,
      riskScore,
      reason: allowed ? "All pre-flight checks passed" : reasons.join("; "),
      warnings,
      modifications: Object.keys(modifications).length > 0 ? modifications : undefined,
    };

    this.log.info({ allowed, riskScore, action: action.action }, "Pre-flight validation complete");
    if (!allowed) {
      this.log.warn({ reasons }, "Action VETOED by pre-flight validator");
    }

    return decision;
  }

  // -----------------------------------------------------------------------
  // Individual checks
  // -----------------------------------------------------------------------

  /**
   * Check 1: Position size within limits.
   * Trade value must not exceed maxPositionSizeUsd.
   */
  private checkPositionSize(action: ActionParams, _portfolio: PortfolioSnapshot): CheckResult {
    const { tradeValueUsd } = action;
    const { maxPositionSizeUsd } = this.limits;

    if (tradeValueUsd > maxPositionSizeUsd) {
      const suggestedSize = maxPositionSizeUsd;
      return {
        passed: false,
        reason: `Position size $${tradeValueUsd.toFixed(2)} exceeds limit $${maxPositionSizeUsd.toFixed(2)}`,
        riskContribution: 30,
        modifications: { suggestedTradeValueUsd: suggestedSize },
      };
    }

    // Warn if > 80% of limit.
    const ratio = tradeValueUsd / maxPositionSizeUsd;
    if (ratio > 0.8) {
      return {
        passed: true,
        warning: `Position size is ${(ratio * 100).toFixed(0)}% of limit`,
        riskContribution: ratio * 20,
      };
    }

    return { passed: true, riskContribution: ratio * 10 };
  }

  /**
   * Check 2: Portfolio exposure acceptable.
   * The trade must not push total deployed capital above maxPortfolioExposurePct
   * of the total portfolio value.
   *
   * For example, if totalValueUsd = 100k, positionValues sum to 60k, and the
   * new trade is 25k, deployed would become 85k = 85% of 100k. With a limit
   * of 80%, this would be rejected.
   */
  private checkPortfolioExposure(action: ActionParams, portfolio: PortfolioSnapshot): CheckResult {
    const { totalValueUsd, positionValues } = portfolio;
    const { maxPortfolioExposurePct } = this.limits;

    if (totalValueUsd <= 0) {
      return { passed: true, riskContribution: 0 };
    }

    // Sum of current position values = currently deployed capital.
    let deployedUsd = 0;
    for (const v of positionValues) deployedUsd += v;

    const newDeployedUsd = deployedUsd + action.tradeValueUsd;
    const newExposurePct = (newDeployedUsd / totalValueUsd) * 100;

    if (newExposurePct > maxPortfolioExposurePct) {
      return {
        passed: false,
        reason: `Portfolio exposure ${newExposurePct.toFixed(1)}% would exceed limit ${maxPortfolioExposurePct}%`,
        riskContribution: 25,
      };
    }

    // Warn at 90% of limit.
    const utilisation = newExposurePct / maxPortfolioExposurePct;
    if (utilisation > 0.9) {
      return {
        passed: true,
        warning: `Portfolio exposure at ${(utilisation * 100).toFixed(0)}% of limit`,
        riskContribution: utilisation * 15,
      };
    }

    return { passed: true, riskContribution: utilisation * 5 };
  }

  /**
   * Check 3: Gas cost < X% of trade value.
   */
  private checkGasCost(action: ActionParams): CheckResult {
    const { gasCostUsd, tradeValueUsd } = action;
    const { maxGasCostPct } = this.limits;

    if (tradeValueUsd <= 0) {
      return {
        passed: false,
        reason: "Trade value must be positive",
        riskContribution: 10,
      };
    }

    const gasPct = (gasCostUsd / tradeValueUsd) * 100;

    if (gasPct > maxGasCostPct) {
      return {
        passed: false,
        reason: `Gas cost ${gasPct.toFixed(2)}% of trade value exceeds limit ${maxGasCostPct}%`,
        riskContribution: 15,
      };
    }

    // Warn at 75% of limit.
    const utilisation = gasPct / maxGasCostPct;
    if (utilisation > 0.75) {
      return {
        passed: true,
        warning: `Gas cost is ${gasPct.toFixed(2)}% of trade value (limit ${maxGasCostPct}%)`,
        riskContribution: utilisation * 10,
      };
    }

    return { passed: true, riskContribution: utilisation * 5 };
  }

  /**
   * Check 4: Slippage within tolerance.
   */
  private checkSlippage(action: ActionParams): CheckResult {
    const { estimatedSlippageBps } = action;
    const { maxSlippageBps } = this.limits;

    if (estimatedSlippageBps > maxSlippageBps) {
      return {
        passed: false,
        reason: `Estimated slippage ${estimatedSlippageBps}bps exceeds limit ${maxSlippageBps}bps`,
        riskContribution: 20,
        modifications: { suggestedSlippageBps: maxSlippageBps },
      };
    }

    const utilisation = estimatedSlippageBps / maxSlippageBps;
    if (utilisation > 0.8) {
      return {
        passed: true,
        warning: `Slippage ${estimatedSlippageBps}bps is close to limit ${maxSlippageBps}bps`,
        riskContribution: utilisation * 10,
      };
    }

    return { passed: true, riskContribution: utilisation * 5 };
  }

  /**
   * Check 5: Daily loss limit not breached.
   */
  private checkDailyLoss(portfolio: PortfolioSnapshot): CheckResult {
    const { dayStartEquityUsd, currentEquityUsd } = portfolio;
    const { maxDailyLossPct } = this.limits;

    if (dayStartEquityUsd <= 0) {
      return { passed: true, riskContribution: 0 };
    }

    const lossPct = ((dayStartEquityUsd - currentEquityUsd) / dayStartEquityUsd) * 100;

    if (lossPct >= maxDailyLossPct) {
      return {
        passed: false,
        reason: `Daily loss ${lossPct.toFixed(2)}% has reached limit ${maxDailyLossPct}%`,
        riskContribution: 35,
      };
    }

    // Warn at 75% of daily loss limit.
    const utilisation = lossPct > 0 ? lossPct / maxDailyLossPct : 0;
    if (utilisation > 0.75) {
      return {
        passed: true,
        warning: `Daily loss ${lossPct.toFixed(2)}% is approaching limit ${maxDailyLossPct}%`,
        riskContribution: utilisation * 20,
      };
    }

    return { passed: true, riskContribution: Math.max(0, utilisation * 10) };
  }

  /**
   * Check 6: Daily trade count limit.
   */
  private checkDailyTradeLimit(portfolio: PortfolioSnapshot): CheckResult {
    const { dailyTradeCount } = portfolio;
    const { maxDailyTrades } = this.limits;

    if (dailyTradeCount >= maxDailyTrades) {
      return {
        passed: false,
        reason: `Daily trade count ${dailyTradeCount} has reached limit ${maxDailyTrades}`,
        riskContribution: 10,
      };
    }

    return { passed: true, riskContribution: 0 };
  }

  /**
   * Check 7: Open position limit.
   */
  private checkOpenPositionLimit(portfolio: PortfolioSnapshot): CheckResult {
    const { openPositions } = portfolio;
    const { maxOpenPositions } = this.limits;

    if (openPositions >= maxOpenPositions) {
      return {
        passed: false,
        reason: `Open positions ${openPositions} has reached limit ${maxOpenPositions}`,
        riskContribution: 10,
      };
    }

    return { passed: true, riskContribution: 0 };
  }
}
