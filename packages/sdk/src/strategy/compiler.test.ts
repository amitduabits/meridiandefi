// ---------------------------------------------------------------------------
// Compiler tests — compileDsl and validateStrategy
// ---------------------------------------------------------------------------

import { describe, it, expect } from "vitest";
import { compileDsl, validateStrategy } from "./compiler.js";
import { parseDsl } from "./dsl-parser.js";
import type { IStrategy } from "../types/strategy.js";
import { TriggerType, ActionType } from "../types/strategy.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMinimalStrategy(overrides: Partial<IStrategy> = {}): IStrategy {
  return {
    id: "test-id",
    name: "Test Strategy",
    version: "1.0.0",
    description: "A test strategy",
    triggers: [
      {
        type: TriggerType.TIME_INTERVAL,
        params: { bars: 10 },
      },
    ],
    actions: [
      {
        type: ActionType.NOTIFY,
        params: { message: "hello" },
        chainId: 1,
      },
    ],
    constraints: {
      maxPositionPct: 25,
      stopLossPct: -5,
      maxDailyTrades: 10,
      maxSlippageBps: 50,
    },
    params: {},
    ...overrides,
  };
}

function makeSimpleDslAst() {
  const dsl = `
strategy "Rebalance Portfolio" v1.0
param target_eth = 0.4
param drift_threshold = 0.05
when portfolio.drift("ETH") > drift_threshold
  do rebalance("ETH", target_eth)
`.trim();
  return parseDsl(dsl);
}

// ---------------------------------------------------------------------------
// compileDsl
// ---------------------------------------------------------------------------

describe("compileDsl — valid AST", () => {
  it("returns a CompileResult with strategy, errors, warnings arrays", () => {
    const ast = makeSimpleDslAst();
    const result = compileDsl(ast);
    expect(result).toHaveProperty("strategy");
    expect(result).toHaveProperty("errors");
    expect(result).toHaveProperty("warnings");
  });

  it("produces no errors for a well-formed DSL", () => {
    const ast = makeSimpleDslAst();
    const result = compileDsl(ast);
    expect(result.errors).toHaveLength(0);
  });

  it("strategy.name matches the DSL header name", () => {
    const ast = makeSimpleDslAst();
    const { strategy } = compileDsl(ast);
    expect(strategy.name).toBe("Rebalance Portfolio");
  });

  it("strategy.version is a valid semver string", () => {
    const ast = makeSimpleDslAst();
    const { strategy } = compileDsl(ast);
    expect(strategy.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it("strategy has at least one trigger", () => {
    const ast = makeSimpleDslAst();
    const { strategy } = compileDsl(ast);
    expect(strategy.triggers.length).toBeGreaterThan(0);
  });

  it("strategy has at least one action", () => {
    const ast = makeSimpleDslAst();
    const { strategy } = compileDsl(ast);
    expect(strategy.actions.length).toBeGreaterThan(0);
  });

  it("resolved params are stored in strategy.params", () => {
    const ast = makeSimpleDslAst();
    const { strategy } = compileDsl(ast);
    expect(strategy.params).toHaveProperty("target_eth");
    expect(strategy.params["target_eth"]).toBeCloseTo(0.4);
    expect(strategy.params).toHaveProperty("drift_threshold");
    expect(strategy.params["drift_threshold"]).toBeCloseTo(0.05);
  });

  it("each action has a positive chainId", () => {
    const ast = makeSimpleDslAst();
    const { strategy } = compileDsl(ast);
    for (const action of strategy.actions) {
      expect(action.chainId).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// compileDsl — constraints errors
// ---------------------------------------------------------------------------

describe("compileDsl — constraints with invalid slippage", () => {
  it("returns an error when max_slippage exceeds 5%", () => {
    const dsl = `
strategy "Bad Slippage" v1.0
when portfolio.drift("ETH") > 0.05
  do rebalance("ETH", 0.4)
constraints {
  max_slippage: 10%
}
`.trim();
    const ast = parseDsl(dsl);
    const result = compileDsl(ast);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.toLowerCase().includes("slippage"))).toBe(true);
  });

  it("returns an error when max_daily_trades > 1000", () => {
    const dsl = `
strategy "Too Many Trades" v1.0
when portfolio.drift("ETH") > 0.05
  do rebalance("ETH", 0.4)
constraints {
  max_daily_trades: 9999
}
`.trim();
    const ast = parseDsl(dsl);
    const result = compileDsl(ast);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.includes("max_daily_trades"))).toBe(true);
  });
});

describe("compileDsl — DSL with no rules", () => {
  it("produces a warning about no when-do rules", () => {
    const ast = parseDsl("strategy \"Empty\" v1.0");
    const result = compileDsl(ast);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("still returns a valid strategy object even with no rules", () => {
    const ast = parseDsl("strategy \"Empty\" v1.0");
    const result = compileDsl(ast);
    expect(result.strategy).toBeDefined();
    expect(result.strategy.triggers.length).toBeGreaterThan(0);
    expect(result.strategy.actions.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// validateStrategy — valid strategy
// ---------------------------------------------------------------------------

describe("validateStrategy — valid strategy", () => {
  it("returns valid: true for a minimal correct strategy", () => {
    const strategy = makeMinimalStrategy();
    const result = validateStrategy(strategy);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("returns valid: true for the rebalancer prebuilt", async () => {
    const { createRebalancerStrategy } = await import("./prebuilt/rebalancer.js");
    const strategy = createRebalancerStrategy();
    const result = validateStrategy(strategy);
    expect(result.valid).toBe(true);
  });

  it("returns valid: true for the DCA prebuilt", async () => {
    const { createDCAStrategy } = await import("./prebuilt/dca.js");
    const strategy = createDCAStrategy();
    const result = validateStrategy(strategy);
    expect(result.valid).toBe(true);
  });

  it("returns valid: true for the yield rotation prebuilt", async () => {
    const { createYieldRotationStrategy } = await import("./prebuilt/yield-rotation.js");
    const strategy = createYieldRotationStrategy();
    const result = validateStrategy(strategy);
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateStrategy — invalid strategies
// ---------------------------------------------------------------------------

describe("validateStrategy — missing required fields", () => {
  it("returns valid: false when id is empty", () => {
    const strategy = makeMinimalStrategy({ id: "" });
    const result = validateStrategy(strategy);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("id"))).toBe(true);
  });

  it("returns valid: false when name is empty", () => {
    const strategy = makeMinimalStrategy({ name: "" });
    const result = validateStrategy(strategy);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("name"))).toBe(true);
  });

  it("returns valid: false when version is not semver", () => {
    const strategy = makeMinimalStrategy({ version: "not-semver" });
    const result = validateStrategy(strategy);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("version"))).toBe(true);
  });

  it("returns valid: false when description is empty", () => {
    const strategy = makeMinimalStrategy({ description: "" });
    const result = validateStrategy(strategy);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("description"))).toBe(true);
  });

  it("returns valid: false when triggers is empty array", () => {
    const strategy = makeMinimalStrategy({ triggers: [] });
    const result = validateStrategy(strategy);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes("trigger"))).toBe(true);
  });

  it("returns valid: false when actions is empty array", () => {
    const strategy = makeMinimalStrategy({ actions: [] });
    const result = validateStrategy(strategy);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.toLowerCase().includes("action"))).toBe(true);
  });

  it("returns valid: false when trigger type is unknown", () => {
    const strategy = makeMinimalStrategy({
      triggers: [{ type: "NOT_A_TYPE" as typeof TriggerType[keyof typeof TriggerType], params: {} }],
    });
    const result = validateStrategy(strategy);
    expect(result.valid).toBe(false);
  });

  it("returns valid: false when action chainId is 0", () => {
    const strategy = makeMinimalStrategy({
      actions: [{ type: ActionType.NOTIFY, params: {}, chainId: 0 }],
    });
    const result = validateStrategy(strategy);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("chainId"))).toBe(true);
  });

  it("returns valid: false when maxSlippageBps > 500", () => {
    const strategy = makeMinimalStrategy({
      constraints: {
        maxPositionPct: 25,
        stopLossPct: -5,
        maxDailyTrades: 10,
        maxSlippageBps: 600,
      },
    });
    const result = validateStrategy(strategy);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("maxSlippageBps"))).toBe(true);
  });

  it("errors array is non-empty for invalid strategy", () => {
    const strategy = makeMinimalStrategy({ id: "", name: "", description: "" });
    const result = validateStrategy(strategy);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
