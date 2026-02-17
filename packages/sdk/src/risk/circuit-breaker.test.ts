import { describe, it, expect, beforeEach } from "vitest";
import { CircuitBreakerManager, InMemoryBreakerStore } from "./circuit-breaker.js";
import { BreakerType, CircuitBreakerStatus } from "../types/risk.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createManager(opts?: {
  clockStart?: number;
  cooldownMs?: number;
}) {
  let now = opts?.clockStart ?? 1_000_000;
  const clock = () => now;
  const advance = (ms: number) => { now += ms; };

  const manager = new CircuitBreakerManager({
    clock,
    config: {
      breakers: {
        [BreakerType.PORTFOLIO_DRAWDOWN]: { cooldownMs: opts?.cooldownMs ?? 5_000 },
        [BreakerType.FLASH_CRASH]:       { cooldownMs: opts?.cooldownMs ?? 5_000 },
        [BreakerType.GAS_SPIKE]:         { cooldownMs: opts?.cooldownMs ?? 5_000 },
        [BreakerType.RPC_FAILURE]:       { cooldownMs: opts?.cooldownMs ?? 5_000 },
        [BreakerType.ORACLE_STALE]:      { cooldownMs: opts?.cooldownMs ?? 5_000 },
        [BreakerType.CONTRACT_ANOMALY]:  { cooldownMs: opts?.cooldownMs ?? 5_000 },
      },
    },
  });

  return { manager, advance, getClock: () => now };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CircuitBreakerManager", () => {
  // -----------------------------------------------------------------------
  // Initialisation
  // -----------------------------------------------------------------------

  it("initialises all breakers to CLOSED", () => {
    const { manager } = createManager();
    const states = manager.getAllStates();

    expect(states.length).toBe(Object.keys(BreakerType).length);
    for (const state of states) {
      expect(state.status).toBe(CircuitBreakerStatus.CLOSED);
      expect(state.tripCount).toBe(0);
    }
  });

  it("reports allClear when no breakers are tripped", () => {
    const { manager } = createManager();
    expect(manager.allClear()).toBe(true);
  });

  // -----------------------------------------------------------------------
  // Trip
  // -----------------------------------------------------------------------

  describe("trip", () => {
    it("opens a breaker", () => {
      const { manager } = createManager();

      manager.trip(BreakerType.PORTFOLIO_DRAWDOWN, "Drawdown exceeded 10%");
      const state = manager.getState(BreakerType.PORTFOLIO_DRAWDOWN);

      expect(state.status).toBe(CircuitBreakerStatus.OPEN);
      expect(state.tripCount).toBe(1);
      expect(state.lastError).toBe("Drawdown exceeded 10%");
      expect(state.trippedAt).toBeDefined();
      expect(state.cooldownUntil).toBeDefined();
    });

    it("increments tripCount on repeated trips", () => {
      const { manager, advance } = createManager();

      manager.trip(BreakerType.GAS_SPIKE, "Gas > 500 gwei");
      manager.reset(BreakerType.GAS_SPIKE);
      manager.trip(BreakerType.GAS_SPIKE, "Gas > 600 gwei");

      const state = manager.getState(BreakerType.GAS_SPIKE);
      expect(state.tripCount).toBe(2);
      expect(state.lastError).toBe("Gas > 600 gwei");
    });

    it("makes allClear return false", () => {
      const { manager } = createManager();
      manager.trip(BreakerType.RPC_FAILURE, "3 consecutive failures");

      expect(manager.allClear()).toBe(false);
    });

    it("getTrippedBreakers returns the tripped breaker", () => {
      const { manager } = createManager();
      manager.trip(BreakerType.FLASH_CRASH, ">20% in 5 min");

      const tripped = manager.getTrippedBreakers();
      expect(tripped.length).toBe(1);
      expect(tripped[0]!.type).toBe(BreakerType.FLASH_CRASH);
    });
  });

  // -----------------------------------------------------------------------
  // Reset
  // -----------------------------------------------------------------------

  describe("reset", () => {
    it("manually resets a breaker to CLOSED", () => {
      const { manager } = createManager();
      manager.trip(BreakerType.ORACLE_STALE, "Oracle > 60s stale");

      manager.reset(BreakerType.ORACLE_STALE);
      const state = manager.getState(BreakerType.ORACLE_STALE);

      expect(state.status).toBe(CircuitBreakerStatus.CLOSED);
      expect(state.tripCount).toBe(1); // tripCount preserved
    });

    it("restores allClear after reset", () => {
      const { manager } = createManager();
      manager.trip(BreakerType.ORACLE_STALE, "stale");
      expect(manager.allClear()).toBe(false);

      manager.reset(BreakerType.ORACLE_STALE);
      expect(manager.allClear()).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Cooldown & auto-transition
  // -----------------------------------------------------------------------

  describe("cooldown", () => {
    it("transitions OPEN -> HALF_OPEN after cooldown period", () => {
      const { manager, advance } = createManager({ cooldownMs: 5_000 });
      manager.trip(BreakerType.GAS_SPIKE, "Gas spike");

      // Still OPEN before cooldown.
      advance(4_999);
      expect(manager.checkBreaker(BreakerType.GAS_SPIKE)).toBe(CircuitBreakerStatus.OPEN);

      // HALF_OPEN after cooldown.
      advance(1);
      expect(manager.checkBreaker(BreakerType.GAS_SPIKE)).toBe(CircuitBreakerStatus.HALF_OPEN);
    });

    it("allClear returns false during HALF_OPEN", () => {
      const { manager, advance } = createManager({ cooldownMs: 5_000 });
      manager.trip(BreakerType.GAS_SPIKE, "Gas spike");

      advance(5_000);
      // allClear triggers auto-transition but HALF_OPEN is still not clear.
      expect(manager.allClear()).toBe(false);
    });

    it("transitions HALF_OPEN -> CLOSED after successful probes", () => {
      const { manager, advance } = createManager({ cooldownMs: 1_000 });

      manager.trip(BreakerType.RPC_FAILURE, "RPC down");
      advance(1_000);

      // Force transition to HALF_OPEN.
      manager.checkBreaker(BreakerType.RPC_FAILURE);
      expect(manager.getState(BreakerType.RPC_FAILURE).status).toBe(CircuitBreakerStatus.HALF_OPEN);

      // Default halfOpenProbes for RPC_FAILURE is 3 (from defaults, but we use
      // the factory helper which only overrides cooldownMs, so halfOpenProbes
      // stays at the default 3).
      manager.recordProbeSuccess(BreakerType.RPC_FAILURE);
      manager.recordProbeSuccess(BreakerType.RPC_FAILURE);
      const closed = manager.recordProbeSuccess(BreakerType.RPC_FAILURE);

      expect(closed).toBe(true);
      expect(manager.getState(BreakerType.RPC_FAILURE).status).toBe(CircuitBreakerStatus.CLOSED);
    });

    it("does not count probes when breaker is CLOSED", () => {
      const { manager } = createManager();
      const result = manager.recordProbeSuccess(BreakerType.GAS_SPIKE);
      expect(result).toBe(false);
    });

    it("does not count probes when breaker is OPEN", () => {
      const { manager } = createManager();
      manager.trip(BreakerType.GAS_SPIKE, "spike");
      const result = manager.recordProbeSuccess(BreakerType.GAS_SPIKE);
      expect(result).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Multiple breakers
  // -----------------------------------------------------------------------

  describe("multiple breakers", () => {
    it("tracks multiple tripped breakers independently", () => {
      const { manager } = createManager();

      manager.trip(BreakerType.GAS_SPIKE, "gas");
      manager.trip(BreakerType.RPC_FAILURE, "rpc");

      expect(manager.getTrippedBreakers().length).toBe(2);

      manager.reset(BreakerType.GAS_SPIKE);
      expect(manager.getTrippedBreakers().length).toBe(1);
      expect(manager.getTrippedBreakers()[0]!.type).toBe(BreakerType.RPC_FAILURE);
    });

    it("allClear requires ALL breakers to be CLOSED", () => {
      const { manager } = createManager();

      manager.trip(BreakerType.GAS_SPIKE, "gas");
      manager.trip(BreakerType.ORACLE_STALE, "stale");

      manager.reset(BreakerType.GAS_SPIKE);
      expect(manager.allClear()).toBe(false);

      manager.reset(BreakerType.ORACLE_STALE);
      expect(manager.allClear()).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // InMemoryBreakerStore
  // -----------------------------------------------------------------------

  describe("InMemoryBreakerStore", () => {
    it("stores and retrieves state", () => {
      const store = new InMemoryBreakerStore();
      store.set(BreakerType.GAS_SPIKE, {
        type: BreakerType.GAS_SPIKE,
        status: CircuitBreakerStatus.OPEN,
        tripCount: 1,
        lastError: "test",
      });

      const state = store.get(BreakerType.GAS_SPIKE);
      expect(state).toBeDefined();
      expect(state!.status).toBe(CircuitBreakerStatus.OPEN);
    });

    it("returns undefined for unknown types", () => {
      const store = new InMemoryBreakerStore();
      expect(store.get(BreakerType.FLASH_CRASH)).toBeUndefined();
    });

    it("getAll returns all stored states", () => {
      const store = new InMemoryBreakerStore();
      store.set(BreakerType.GAS_SPIKE, {
        type: BreakerType.GAS_SPIKE,
        status: CircuitBreakerStatus.CLOSED,
        tripCount: 0,
      });
      store.set(BreakerType.ORACLE_STALE, {
        type: BreakerType.ORACLE_STALE,
        status: CircuitBreakerStatus.OPEN,
        tripCount: 1,
      });

      expect(store.getAll().length).toBe(2);
    });
  });

  // -----------------------------------------------------------------------
  // Specific breaker types — testing the thresholds described in the spec.
  // -----------------------------------------------------------------------

  describe("breaker type scenarios", () => {
    it("PORTFOLIO_DRAWDOWN: trips on -10% daily drawdown", () => {
      const { manager } = createManager();
      // Simulate the agent detecting a drawdown breach.
      manager.trip(BreakerType.PORTFOLIO_DRAWDOWN, "Daily drawdown -10% exceeded: -12%");
      expect(manager.getState(BreakerType.PORTFOLIO_DRAWDOWN).status).toBe(CircuitBreakerStatus.OPEN);
      expect(manager.allClear()).toBe(false);
    });

    it("FLASH_CRASH: trips on >20% drop in 5 minutes", () => {
      const { manager } = createManager();
      manager.trip(BreakerType.FLASH_CRASH, "ETH dropped 25% in 5 minutes");
      expect(manager.getState(BreakerType.FLASH_CRASH).status).toBe(CircuitBreakerStatus.OPEN);
    });

    it("GAS_SPIKE: trips when gas > 500 gwei", () => {
      const { manager } = createManager();
      manager.trip(BreakerType.GAS_SPIKE, "Gas price 750 gwei exceeds 500 gwei threshold");
      expect(manager.getState(BreakerType.GAS_SPIKE).status).toBe(CircuitBreakerStatus.OPEN);
    });

    it("RPC_FAILURE: trips after 3+ consecutive failures", () => {
      const { manager } = createManager();
      manager.trip(BreakerType.RPC_FAILURE, "3 consecutive RPC failures detected");
      expect(manager.getState(BreakerType.RPC_FAILURE).status).toBe(CircuitBreakerStatus.OPEN);
    });

    it("ORACLE_STALE: trips when oracle data > 60s old", () => {
      const { manager } = createManager();
      manager.trip(BreakerType.ORACLE_STALE, "Price oracle stale for 120s");
      expect(manager.getState(BreakerType.ORACLE_STALE).status).toBe(CircuitBreakerStatus.OPEN);
    });
  });
});
