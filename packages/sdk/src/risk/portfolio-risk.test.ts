import { describe, it, expect } from "vitest";
import {
  calculateDrawdown,
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateVaR,
  concentrationIndex,
} from "./portfolio-risk.js";

// ---------------------------------------------------------------------------
// calculateDrawdown
// ---------------------------------------------------------------------------

describe("calculateDrawdown", () => {
  it("returns 0 for an empty equity curve", () => {
    expect(calculateDrawdown([])).toBe(0);
  });

  it("returns 0 for a single-element equity curve", () => {
    expect(calculateDrawdown([100])).toBe(0);
  });

  it("returns 0 for a monotonically increasing curve", () => {
    expect(calculateDrawdown([100, 110, 120, 130])).toBe(0);
  });

  it("calculates correct drawdown for a simple dip", () => {
    // Peak = 200, trough = 150 => drawdown = 50/200 = 0.25
    const curve = [100, 200, 150, 180];
    expect(calculateDrawdown(curve)).toBeCloseTo(0.25, 10);
  });

  it("calculates 100% drawdown when equity goes to zero", () => {
    const curve = [100, 50, 0];
    expect(calculateDrawdown(curve)).toBeCloseTo(1.0, 10);
  });

  it("uses the highest peak before the trough", () => {
    // Peak = 300, trough = 210 => drawdown = 90/300 = 0.30
    const curve = [100, 200, 300, 210, 280, 290];
    expect(calculateDrawdown(curve)).toBeCloseTo(0.3, 10);
  });

  it("handles a V-shaped recovery correctly", () => {
    // Peak = 100, trough = 80 => drawdown = 20/100 = 0.20
    const curve = [100, 90, 80, 90, 100];
    expect(calculateDrawdown(curve)).toBeCloseTo(0.2, 10);
  });

  it("handles multiple drawdowns and picks the max", () => {
    // First dip: peak=100, trough=90 => 10%
    // Second dip: peak=120, trough=84 => 30%
    const curve = [100, 90, 110, 120, 84, 100];
    expect(calculateDrawdown(curve)).toBeCloseTo(0.3, 10);
  });
});

// ---------------------------------------------------------------------------
// calculateSharpeRatio
// ---------------------------------------------------------------------------

describe("calculateSharpeRatio", () => {
  it("returns 0 for fewer than 2 data points", () => {
    expect(calculateSharpeRatio([])).toBe(0);
    expect(calculateSharpeRatio([0.01])).toBe(0);
  });

  it("returns 0 when all returns are equal (zero stddev)", () => {
    expect(calculateSharpeRatio([0.01, 0.01, 0.01])).toBe(0);
  });

  it("returns positive Sharpe for positive mean excess returns", () => {
    // Known values: returns = [0.02, 0.04, 0.06]
    // mean = 0.04, stddev ~= 0.01633
    // Sharpe = 0.04 / 0.01633 ~ 2.449
    const returns = [0.02, 0.04, 0.06];
    expect(calculateSharpeRatio(returns, 0)).toBeCloseTo(2.449, 2);
  });

  it("subtracts risk-free rate correctly", () => {
    // returns = [0.05, 0.05, 0.05], rf = 0.03
    // excess = [0.02, 0.02, 0.02] => mean = 0.02, stddev = 0 => 0
    expect(calculateSharpeRatio([0.05, 0.05, 0.05], 0.03)).toBe(0);
  });

  it("returns negative Sharpe for negative mean excess returns", () => {
    const returns = [-0.02, -0.04, -0.06];
    expect(calculateSharpeRatio(returns, 0)).toBeLessThan(0);
  });

  it("computes correctly with mixed positive and negative returns", () => {
    // returns = [0.10, -0.05, 0.03, -0.02, 0.08]
    // mean = 0.028, stddev of population
    const returns = [0.10, -0.05, 0.03, -0.02, 0.08];
    const sharpe = calculateSharpeRatio(returns, 0);
    expect(sharpe).toBeGreaterThan(0);
    expect(sharpe).toBeLessThan(2);
  });
});

// ---------------------------------------------------------------------------
// calculateSortinoRatio
// ---------------------------------------------------------------------------

describe("calculateSortinoRatio", () => {
  it("returns 0 for fewer than 2 data points", () => {
    expect(calculateSortinoRatio([])).toBe(0);
    expect(calculateSortinoRatio([0.05])).toBe(0);
  });

  it("returns 0 when there are no negative excess returns", () => {
    // All returns positive => no downside => returns 0 by convention.
    expect(calculateSortinoRatio([0.01, 0.02, 0.03], 0)).toBe(0);
  });

  it("is higher than Sharpe when upside is large", () => {
    // Sortino ignores upside volatility, so it should be >= Sharpe
    // when there's large upside variance.
    const returns = [0.10, -0.01, 0.15, -0.02, 0.20];
    const sharpe = calculateSharpeRatio(returns, 0);
    const sortino = calculateSortinoRatio(returns, 0);
    expect(sortino).toBeGreaterThan(sharpe);
  });

  it("handles purely negative returns", () => {
    const returns = [-0.05, -0.03, -0.07];
    const sortino = calculateSortinoRatio(returns, 0);
    expect(sortino).toBeLessThan(0);
  });
});

// ---------------------------------------------------------------------------
// calculateVaR
// ---------------------------------------------------------------------------

describe("calculateVaR", () => {
  it("returns 0 for an empty array", () => {
    expect(calculateVaR([])).toBe(0);
  });

  it("computes 95% VaR with known returns", () => {
    // 100 returns from -10 to +10.
    // Sorted: -10, -9.8, -9.6, ..., +10
    // 5th percentile index = floor(0.05 * 100) = 5 => sorted[5] = -9
    // VaR = -(-9) = 9 ... let's do exact.
    const returns: number[] = [];
    for (let i = 0; i < 100; i++) {
      returns.push(-10 + (i * 20) / 99);
    }
    const var95 = calculateVaR(returns, 0.95);
    expect(var95).toBeGreaterThan(8);
    expect(var95).toBeLessThan(10.5);
  });

  it("returns the worst loss for 99% confidence", () => {
    // 10 returns: the 1st percentile index = floor(0.01 * 10) = 0
    const returns = [-0.10, -0.05, 0.0, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07];
    const var99 = calculateVaR(returns, 0.99);
    expect(var99).toBeCloseTo(0.10, 2);
  });

  it("returns a positive number (loss magnitude) for typical portfolio", () => {
    const returns = [-0.02, 0.01, 0.03, -0.01, 0.02, -0.03, 0.01, 0.00, -0.04, 0.02];
    const var95 = calculateVaR(returns, 0.95);
    expect(var95).toBeGreaterThan(0);
  });

  it("handles a single return", () => {
    const var95 = calculateVaR([-0.05], 0.95);
    expect(var95).toBeCloseTo(0.05, 10);
  });
});

// ---------------------------------------------------------------------------
// concentrationIndex
// ---------------------------------------------------------------------------

describe("concentrationIndex", () => {
  it("returns 0 for an empty portfolio", () => {
    expect(concentrationIndex([])).toBe(0);
  });

  it("returns 1 for a single-asset portfolio", () => {
    expect(concentrationIndex([1.0])).toBeCloseTo(1.0, 10);
  });

  it("returns 0.5 for two equal-weight assets", () => {
    // HHI = 0.5^2 + 0.5^2 = 0.5
    expect(concentrationIndex([0.5, 0.5])).toBeCloseTo(0.5, 10);
  });

  it("returns 1/N for N equal-weight assets", () => {
    const n = 10;
    const weights = Array.from({ length: n }, () => 1 / n);
    expect(concentrationIndex(weights)).toBeCloseTo(1 / n, 10);
  });

  it("increases with concentration", () => {
    const diversified = concentrationIndex([0.2, 0.2, 0.2, 0.2, 0.2]);
    const concentrated = concentrationIndex([0.8, 0.05, 0.05, 0.05, 0.05]);
    expect(concentrated).toBeGreaterThan(diversified);
  });

  it("computes a known HHI correctly", () => {
    // weights = [0.6, 0.3, 0.1]
    // HHI = 0.36 + 0.09 + 0.01 = 0.46
    expect(concentrationIndex([0.6, 0.3, 0.1])).toBeCloseTo(0.46, 10);
  });
});
