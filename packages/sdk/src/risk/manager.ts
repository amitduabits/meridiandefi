// ---------------------------------------------------------------------------
// Risk Manager — orchestrates pre-flight validation and circuit breaker checks.
// This module has VETO POWER over every agent action.
// DETERMINISTIC: no LLM calls, pure logic only.
// ---------------------------------------------------------------------------

import type { Logger } from "pino";
import {
  RiskLimitsSchema,
  CircuitBreakerStatus,
} from "../types/risk.js";
import type {
  RiskLimits,
  RiskDecision,
  BreakerType,
} from "../types/risk.js";
import { RiskError } from "../core/errors.js";
import { createLogger } from "../core/logger.js";
import { PreFlightValidator } from "./preflight.js";
import type { ActionParams, PortfolioSnapshot } from "./preflight.js";
import { CircuitBreakerManager } from "./circuit-breaker.js";
import type { CircuitBreakerManagerConfig, ICircuitBreakerStore } from "./circuit-breaker.js";
import {
  calculateDrawdown,
  calculateSharpeRatio,
  calculateVaR,
  concentrationIndex,
} from "./portfolio-risk.js";

// ---------------------------------------------------------------------------
// Portfolio risk statistics returned by getPortfolioRisk().
// ---------------------------------------------------------------------------

export interface PortfolioRiskStats {
  drawdown: number;
  sharpeRatio: number;
  valueAtRisk95: number;
  concentration: number;
  riskScore: number;
}

// ---------------------------------------------------------------------------
// IRiskManager — the interface that the rest of the framework depends on.
// ---------------------------------------------------------------------------

export interface IRiskManager {
  /**
   * Validate an action before execution. Returns a RiskDecision.
   * If the decision is { allowed: false }, the action MUST NOT proceed.
   */
  validateAction(
    action: string,
    params: ActionParams,
    portfolio: PortfolioSnapshot,
  ): RiskDecision;

  /**
   * Check all circuit breakers. Returns true if safe to proceed.
   */
  checkCircuitBreakers(): boolean;

  /**
   * Get aggregate portfolio risk statistics from historical data.
   */
  getPortfolioRisk(equityCurve: readonly number[], positionWeights: readonly number[]): PortfolioRiskStats;

  /**
   * Update risk limits at runtime.
   */
  setLimits(limits: RiskLimits): void;
}

// ---------------------------------------------------------------------------
// RiskManager configuration.
// ---------------------------------------------------------------------------

export interface RiskManagerConfig {
  limits: RiskLimits;
  circuitBreaker?: CircuitBreakerManagerConfig;
  store?: ICircuitBreakerStore;
  logger?: Logger;
  /** Override for Date.now() — useful for deterministic testing. */
  clock?: () => number;
}

// ---------------------------------------------------------------------------
// RiskManager implementation.
// ---------------------------------------------------------------------------

export class RiskManager implements IRiskManager {
  private preflight: PreFlightValidator;
  private readonly breakers: CircuitBreakerManager;
  private limits: RiskLimits;
  private readonly log: Logger;

  constructor(config: RiskManagerConfig) {
    const parsed = RiskLimitsSchema.safeParse(config.limits);
    if (!parsed.success) {
      throw new RiskError("Invalid risk limits", {
        code: "RISK_INVALID_LIMITS",
        context: { errors: parsed.error.flatten() },
      });
    }
    this.limits = parsed.data;
    this.log = config.logger ?? createLogger({ module: "RiskManager" });

    this.preflight = new PreFlightValidator(this.limits, this.log);
    this.breakers = new CircuitBreakerManager({
      store: config.store,
      config: config.circuitBreaker,
      logger: this.log,
      clock: config.clock,
    });
  }

  // -----------------------------------------------------------------------
  // IRiskManager implementation
  // -----------------------------------------------------------------------

  validateAction(
    action: string,
    params: ActionParams,
    portfolio: PortfolioSnapshot,
  ): RiskDecision {
    this.log.info({ action }, "Validating action");

    // 1. Circuit breaker check first — if any breaker is not CLOSED, veto.
    if (!this.checkCircuitBreakers()) {
      const tripped = this.breakers.getTrippedBreakers();
      const types = tripped.map((b) => b.type).join(", ");
      this.log.warn({ tripped: types }, "Action VETOED by circuit breakers");

      return {
        allowed: false,
        riskScore: 100,
        reason: `Circuit breakers active: ${types}`,
        warnings: tripped.map((b) => `${b.type}: ${b.lastError ?? "tripped"}`),
      };
    }

    // 2. Pre-flight validation.
    const actionParams: ActionParams = {
      ...params,
      action,
    };

    return this.preflight.validate(actionParams, portfolio);
  }

  checkCircuitBreakers(): boolean {
    return this.breakers.allClear();
  }

  getPortfolioRisk(
    equityCurve: readonly number[],
    positionWeights: readonly number[],
  ): PortfolioRiskStats {
    // Compute returns from equity curve.
    const returns: number[] = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const prev = equityCurve[i - 1]!;
      if (prev !== 0) {
        returns.push((equityCurve[i]! - prev) / prev);
      }
    }

    const drawdown = calculateDrawdown(equityCurve);
    const sharpeRatio = calculateSharpeRatio(returns);
    const valueAtRisk95 = calculateVaR(returns, 0.95);
    const concentration = concentrationIndex(positionWeights);

    // Composite risk score (0-100).
    // Weighted blend of individual risk signals.
    const drawdownScore = Math.min(drawdown * 200, 40);       // max 40 points
    const varScore = Math.min(valueAtRisk95 * 200, 25);       // max 25 points
    const concScore = Math.min(concentration * 30, 20);        // max 20 points
    const sharpeScore = sharpeRatio < 0 ? 15 : sharpeRatio < 0.5 ? 10 : 0; // max 15 points
    const riskScore = Math.min(100, Math.max(0, drawdownScore + varScore + concScore + sharpeScore));

    return {
      drawdown,
      sharpeRatio,
      valueAtRisk95,
      concentration,
      riskScore,
    };
  }

  setLimits(limits: RiskLimits): void {
    const parsed = RiskLimitsSchema.safeParse(limits);
    if (!parsed.success) {
      throw new RiskError("Invalid risk limits", {
        code: "RISK_INVALID_LIMITS",
        context: { errors: parsed.error.flatten() },
      });
    }
    this.limits = parsed.data;
    this.preflight = new PreFlightValidator(this.limits, this.log);
    this.log.info("Risk limits updated");
  }

  // -----------------------------------------------------------------------
  // Circuit breaker delegation — expose for framework integration.
  // -----------------------------------------------------------------------

  /** Trip a circuit breaker. */
  tripBreaker(type: BreakerType, error: string): void {
    this.breakers.trip(type, error);
  }

  /** Reset a circuit breaker. */
  resetBreaker(type: BreakerType): void {
    this.breakers.reset(type);
  }

  /** Record a successful probe for a HALF_OPEN breaker. */
  recordProbeSuccess(type: BreakerType): boolean {
    return this.breakers.recordProbeSuccess(type);
  }

  /** Check a specific breaker's status. */
  checkBreaker(type: BreakerType): CircuitBreakerStatus {
    return this.breakers.checkBreaker(type);
  }

  /** Get the current limits. */
  getLimits(): Readonly<RiskLimits> {
    return this.limits;
  }
}
