// ---------------------------------------------------------------------------
// Circuit breaker manager.
// DETERMINISTIC: pure logic, no LLM calls.
// State is stored in-memory; a Redis-backed implementation can be plugged in
// via the ICircuitBreakerStore interface.
// ---------------------------------------------------------------------------

import type { Logger } from "pino";
import {
  BreakerType,
  CircuitBreakerStatus,
} from "../types/risk.js";
import type { CircuitBreakerState } from "../types/risk.js";
import { RiskError } from "../core/errors.js";
import { createLogger } from "../core/logger.js";

// ---------------------------------------------------------------------------
// Store interface — in-memory by default, Redis can implement this.
// ---------------------------------------------------------------------------

export interface ICircuitBreakerStore {
  get(type: BreakerType): CircuitBreakerState | undefined;
  set(type: BreakerType, state: CircuitBreakerState): void;
  getAll(): CircuitBreakerState[];
}

// ---------------------------------------------------------------------------
// In-memory store implementation.
// ---------------------------------------------------------------------------

export class InMemoryBreakerStore implements ICircuitBreakerStore {
  private readonly state = new Map<BreakerType, CircuitBreakerState>();

  get(type: BreakerType): CircuitBreakerState | undefined {
    return this.state.get(type);
  }

  set(type: BreakerType, state: CircuitBreakerState): void {
    this.state.set(type, state);
  }

  getAll(): CircuitBreakerState[] {
    return [...this.state.values()];
  }
}

// ---------------------------------------------------------------------------
// Configuration for individual breaker types.
// ---------------------------------------------------------------------------

export interface BreakerConfig {
  /** Cooldown period in milliseconds before auto-reset from OPEN to HALF_OPEN. */
  cooldownMs: number;
  /** Number of successful probes in HALF_OPEN before moving back to CLOSED. */
  halfOpenProbes: number;
}

export interface CircuitBreakerManagerConfig {
  /** Per-type configuration. Falls back to defaults if not specified. */
  breakers?: Partial<Record<BreakerType, Partial<BreakerConfig>>>;
}

// ---------------------------------------------------------------------------
// Default configurations per breaker type.
// ---------------------------------------------------------------------------

const DEFAULT_BREAKER_CONFIGS: Record<BreakerType, BreakerConfig> = {
  [BreakerType.PORTFOLIO_DRAWDOWN]: { cooldownMs: 30 * 60_000, halfOpenProbes: 3 },  // 30 min
  [BreakerType.FLASH_CRASH]:       { cooldownMs: 15 * 60_000, halfOpenProbes: 5 },  // 15 min
  [BreakerType.GAS_SPIKE]:         { cooldownMs: 5 * 60_000,  halfOpenProbes: 2 },  // 5 min
  [BreakerType.RPC_FAILURE]:       { cooldownMs: 2 * 60_000,  halfOpenProbes: 3 },  // 2 min
  [BreakerType.ORACLE_STALE]:      { cooldownMs: 5 * 60_000,  halfOpenProbes: 2 },  // 5 min
  [BreakerType.CONTRACT_ANOMALY]:  { cooldownMs: 60 * 60_000, halfOpenProbes: 5 },  // 1 hour
};

// ---------------------------------------------------------------------------
// CircuitBreakerManager
// ---------------------------------------------------------------------------

export class CircuitBreakerManager {
  private readonly store: ICircuitBreakerStore;
  private readonly configs: Record<BreakerType, BreakerConfig>;
  private readonly log: Logger;
  /** Tracks successful probes in HALF_OPEN state per breaker type. */
  private readonly probeCount = new Map<BreakerType, number>();
  /** Allows injecting a clock for deterministic testing. */
  private readonly now: () => number;

  constructor(
    opts?: {
      store?: ICircuitBreakerStore;
      config?: CircuitBreakerManagerConfig;
      logger?: Logger;
      /** Override for Date.now() — useful for testing. */
      clock?: () => number;
    },
  ) {
    this.store = opts?.store ?? new InMemoryBreakerStore();
    this.log = opts?.logger ?? createLogger({ module: "CircuitBreaker" });
    this.now = opts?.clock ?? (() => Date.now());

    // Merge user config with defaults.
    this.configs = { ...DEFAULT_BREAKER_CONFIGS };
    if (opts?.config?.breakers) {
      for (const [type, partial] of Object.entries(opts.config.breakers)) {
        const bt = type as BreakerType;
        if (this.configs[bt] && partial) {
          this.configs[bt] = { ...this.configs[bt], ...partial };
        }
      }
    }

    // Initialise all breakers to CLOSED if not already present.
    for (const type of Object.values(BreakerType)) {
      if (!this.store.get(type)) {
        this.store.set(type, {
          type,
          status: CircuitBreakerStatus.CLOSED,
          tripCount: 0,
        });
      }
    }
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Trip (open) a circuit breaker.
   *
   * @param type  - Which breaker to trip.
   * @param error - Human-readable reason for the trip.
   */
  trip(type: BreakerType, error: string): void {
    const current = this.getState(type);
    const config = this.configs[type];
    if (!config) {
      throw new RiskError(`Unknown breaker type: ${type}`, { code: "RISK_UNKNOWN_BREAKER" });
    }

    const now = this.now();
    const updated: CircuitBreakerState = {
      type,
      status: CircuitBreakerStatus.OPEN,
      trippedAt: now,
      cooldownUntil: now + config.cooldownMs,
      tripCount: current.tripCount + 1,
      lastError: error,
    };

    this.store.set(type, updated);
    this.probeCount.delete(type);

    this.log.warn({ type, error, tripCount: updated.tripCount, cooldownUntil: updated.cooldownUntil },
      "Circuit breaker TRIPPED");
  }

  /**
   * Manually reset a breaker to CLOSED.
   */
  reset(type: BreakerType): void {
    const current = this.getState(type);
    this.store.set(type, {
      type,
      status: CircuitBreakerStatus.CLOSED,
      tripCount: current.tripCount,
    });
    this.probeCount.delete(type);
    this.log.info({ type }, "Circuit breaker manually RESET");
  }

  /**
   * Record a successful probe while in HALF_OPEN state.
   * After enough probes, the breaker moves back to CLOSED.
   *
   * @returns true if the breaker transitioned to CLOSED.
   */
  recordProbeSuccess(type: BreakerType): boolean {
    const state = this.getState(type);
    if (state.status !== CircuitBreakerStatus.HALF_OPEN) {
      return false;
    }

    const config = this.configs[type];
    if (!config) return false;

    const count = (this.probeCount.get(type) ?? 0) + 1;
    this.probeCount.set(type, count);

    if (count >= config.halfOpenProbes) {
      this.reset(type);
      this.log.info({ type, probes: count }, "Circuit breaker auto-CLOSED after successful probes");
      return true;
    }

    return false;
  }

  /**
   * Check whether ALL breakers allow operations to proceed.
   *
   * This method also handles automatic OPEN -> HALF_OPEN transitions
   * when the cooldown period has elapsed.
   *
   * @returns true if all breakers are CLOSED (safe to proceed).
   */
  allClear(): boolean {
    const now = this.now();

    for (const state of this.store.getAll()) {
      // Auto-transition: OPEN -> HALF_OPEN after cooldown.
      if (
        state.status === CircuitBreakerStatus.OPEN &&
        state.cooldownUntil !== undefined &&
        now >= state.cooldownUntil
      ) {
        this.store.set(state.type, {
          ...state,
          status: CircuitBreakerStatus.HALF_OPEN,
        });
        this.log.info({ type: state.type }, "Circuit breaker transitioned to HALF_OPEN");
        return false; // HALF_OPEN still blocks normal operations.
      }

      if (state.status !== CircuitBreakerStatus.CLOSED) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check a specific breaker's effective status (applying auto-transition logic).
   */
  checkBreaker(type: BreakerType): CircuitBreakerStatus {
    const state = this.getState(type);
    const now = this.now();

    // Auto-transition: OPEN -> HALF_OPEN after cooldown.
    if (
      state.status === CircuitBreakerStatus.OPEN &&
      state.cooldownUntil !== undefined &&
      now >= state.cooldownUntil
    ) {
      const updated: CircuitBreakerState = {
        ...state,
        status: CircuitBreakerStatus.HALF_OPEN,
      };
      this.store.set(type, updated);
      this.log.info({ type }, "Circuit breaker transitioned to HALF_OPEN");
      return CircuitBreakerStatus.HALF_OPEN;
    }

    return state.status;
  }

  /**
   * Get the raw state of a specific breaker.
   */
  getState(type: BreakerType): CircuitBreakerState {
    const state = this.store.get(type);
    if (!state) {
      throw new RiskError(`Breaker state not found for type: ${type}`, {
        code: "RISK_BREAKER_NOT_FOUND",
      });
    }
    return state;
  }

  /**
   * Get all breaker states.
   */
  getAllStates(): CircuitBreakerState[] {
    return this.store.getAll();
  }

  /**
   * Return an array of breaker types that are currently NOT closed.
   */
  getTrippedBreakers(): CircuitBreakerState[] {
    return this.store.getAll().filter(
      (s) => s.status !== CircuitBreakerStatus.CLOSED,
    );
  }
}
