// ---------------------------------------------------------------------------
// DSL parser tests
// ---------------------------------------------------------------------------

import { describe, it, expect } from "vitest";
import { parseDsl } from "./dsl-parser.js";
import { StrategyError } from "../core/errors.js";

// ---------------------------------------------------------------------------
// Valid simple DSL
// ---------------------------------------------------------------------------

describe("parseDsl — simple valid DSL", () => {
  const input = `
strategy "Rebalance Portfolio" v1.0
param target_eth = 0.4
param drift_threshold = 0.05
when portfolio.drift("ETH") > drift_threshold
  do rebalance("ETH", target_eth)
`.trim();

  it("returns a DslAst with type 'strategy'", () => {
    const ast = parseDsl(input);
    expect(ast.type).toBe("strategy");
  });

  it("extracts the strategy name correctly", () => {
    const ast = parseDsl(input);
    expect(ast.name).toBe("Rebalance Portfolio");
  });

  it("extracts the version correctly", () => {
    const ast = parseDsl(input);
    expect(ast.version).toBe("1.0");
  });

  it("extracts params array with two entries", () => {
    const ast = parseDsl(input);
    expect(ast.params).toHaveLength(2);
  });

  it("extracts param 'target_eth' with numeric value 0.4", () => {
    const ast = parseDsl(input);
    const param = ast.params.find((p) => p.name === "target_eth");
    expect(param).toBeDefined();
    expect(param!.value.kind).toBe("number");
    expect(param!.value.value).toBeCloseTo(0.4);
  });

  it("extracts param 'drift_threshold' with numeric value 0.05", () => {
    const ast = parseDsl(input);
    const param = ast.params.find((p) => p.name === "drift_threshold");
    expect(param).toBeDefined();
    expect(param!.value.kind).toBe("number");
    expect(param!.value.value).toBeCloseTo(0.05);
  });

  it("extracts one rule", () => {
    const ast = parseDsl(input);
    expect(ast.rules).toHaveLength(1);
  });

  it("rule has a condition and an action", () => {
    const ast = parseDsl(input);
    const rule = ast.rules[0]!;
    expect(rule.condition).toBeDefined();
    expect(rule.action).toBeDefined();
  });

  it("rule action callee includes 'rebalance'", () => {
    const ast = parseDsl(input);
    const rule = ast.rules[0]!;
    const callee = rule.action["callee"];
    expect(String(callee)).toContain("rebalance");
  });

  it("returns null constraints when none declared", () => {
    const ast = parseDsl(input);
    expect(ast.constraints).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Multiple params and rules
// ---------------------------------------------------------------------------

describe("parseDsl — multiple params and rules", () => {
  const input = `
strategy "Multi-Rule Bot" v2.1
param price_threshold = 3000
param pct_change = 0.03
param interval_bars = 5
when price > price_threshold
  do swap("ETH", "USDC")
when price < 1500
  do swap("USDC", "ETH")
`.trim();

  it("extracts three params", () => {
    const ast = parseDsl(input);
    expect(ast.params).toHaveLength(3);
  });

  it("param values are numbers", () => {
    const ast = parseDsl(input);
    for (const p of ast.params) {
      expect(p.value.kind).toBe("number");
      expect(typeof p.value.value).toBe("number");
    }
  });

  it("extracts two rules", () => {
    const ast = parseDsl(input);
    expect(ast.rules).toHaveLength(2);
  });

  it("each rule has a tokens array", () => {
    const ast = parseDsl(input);
    for (const rule of ast.rules) {
      expect(Array.isArray(rule.tokens)).toBe(true);
    }
  });

  it("strategy name is 'Multi-Rule Bot'", () => {
    const ast = parseDsl(input);
    expect(ast.name).toBe("Multi-Rule Bot");
  });

  it("version is 2.1", () => {
    const ast = parseDsl(input);
    expect(ast.version).toBe("2.1");
  });
});

// ---------------------------------------------------------------------------
// Invalid DSL → throws StrategyError
// ---------------------------------------------------------------------------

describe("parseDsl — invalid DSL", () => {
  it("throws StrategyError when strategy header is missing", () => {
    expect(() => parseDsl("param foo = 1")).toThrow(StrategyError);
  });

  it("throws StrategyError on completely empty input", () => {
    expect(() => parseDsl("")).toThrow(StrategyError);
  });

  it("error code is DSL_PARSE_ERROR", () => {
    try {
      parseDsl("not a valid dsl");
    } catch (err) {
      expect(err).toBeInstanceOf(StrategyError);
      expect((err as StrategyError).code).toBe("DSL_PARSE_ERROR");
    }
  });
});

// ---------------------------------------------------------------------------
// Constraints block
// ---------------------------------------------------------------------------

describe("parseDsl — constraints block", () => {
  const input = `
strategy "Constrained Bot" v1.0
param target_eth = 0.4
when portfolio.drift("ETH") > 0.05
  do rebalance("ETH", target_eth)
constraints {
  max_slippage: 0.5%
  max_gas: 50
  chains: [arbitrum, ethereum]
}
`.trim();

  it("parses constraints block", () => {
    const ast = parseDsl(input);
    expect(ast.constraints).not.toBeNull();
  });

  it("max_slippage is stored as a fraction (~0.005)", () => {
    const ast = parseDsl(input);
    const slippage = ast.constraints!["max_slippage"];
    expect(typeof slippage).toBe("number");
    expect(slippage as number).toBeCloseTo(0.005, 5);
  });

  it("max_gas is 50", () => {
    const ast = parseDsl(input);
    const gas = ast.constraints!["max_gas"];
    expect(gas).toBe(50);
  });

  it("chains list contains 'arbitrum' and 'ethereum'", () => {
    const ast = parseDsl(input);
    const chains = ast.constraints!["chains"] as string[];
    expect(Array.isArray(chains)).toBe(true);
    expect(chains).toContain("arbitrum");
    expect(chains).toContain("ethereum");
  });
});
