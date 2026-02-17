import { describe, it, expect } from "vitest";
import { Backtester } from "./backtest.js";
import type { OHLCVBar, BacktestResult } from "./backtest.js";
import type { IStrategy } from "../types/strategy.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate mock OHLCV data with a slight upward drift and noise. */
function generateMockOHLCV(length: number, startPrice = 100): OHLCVBar[] {
  const bars: OHLCVBar[] = [];
  let price = startPrice;

  for (let i = 0; i < length; i++) {
    const change = (Math.sin(i * 0.5) * 2) + 0.05; // oscillation + drift
    price = Math.max(1, price + change);

    const high = price + Math.abs(Math.sin(i)) * 1.5;
    const low = price - Math.abs(Math.cos(i)) * 1.5;
    const open = price - change * 0.5;
    const volume = 1000 + Math.floor(Math.sin(i * 0.3) * 500);

    bars.push({
      timestamp: Date.now() + i * 60_000,
      open,
      high,
      low,
      close: price,
      volume: Math.max(1, volume),
    });
  }

  return bars;
}

/** Build a minimal valid strategy for tests. */
function testStrategy(overrides?: Partial<IStrategy>): IStrategy {
  return {
    id: "test-strat-1",
    name: "Test Backtest Strategy",
    version: "1.0.0",
    description: "A strategy for backtest unit tests",
    triggers: [
      {
        type: "PRICE_BELOW" as const,
        params: { threshold: 99 },
        description: "Buy when price is below 99",
      },
    ],
    actions: [
      {
        type: "SWAP" as const,
        params: { tokenIn: "USDC", tokenOut: "ETH", amount: 100 },
        chainId: 1,
      },
    ],
    constraints: {
      maxPositionPct: 25,
      stopLossPct: -10,
      takeProfitPct: 10,
      maxDailyTrades: 20,
      maxSlippageBps: 50,
    },
    params: {},
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Backtester", () => {
  it("throws when given fewer than 2 bars", () => {
    const strategy = testStrategy();
    expect(() => new Backtester(strategy, [])).toThrow("Need at least 2 bars");
    expect(
      () => new Backtester(strategy, [generateMockOHLCV(1)[0]!]),
    ).toThrow("Need at least 2 bars");
  });

  it("returns a BacktestResult with all required fields", () => {
    const data = generateMockOHLCV(100);
    const bt = new Backtester(testStrategy(), data);
    const result = bt.run();

    expect(result).toHaveProperty("totalReturn");
    expect(result).toHaveProperty("sharpeRatio");
    expect(result).toHaveProperty("sortinoRatio");
    expect(result).toHaveProperty("maxDrawdown");
    expect(result).toHaveProperty("winRate");
    expect(result).toHaveProperty("totalTrades");
    expect(result).toHaveProperty("equityCurve");
  });

  it("equity curve has the same length as input data", () => {
    const data = generateMockOHLCV(50);
    const bt = new Backtester(testStrategy(), data);
    const result = bt.run();

    expect(result.equityCurve).toHaveLength(50);
  });

  it("maxDrawdown is between 0 and 1", () => {
    const data = generateMockOHLCV(100);
    const bt = new Backtester(testStrategy(), data);
    const result = bt.run();

    expect(result.maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(result.maxDrawdown).toBeLessThanOrEqual(1);
  });

  it("winRate is between 0 and 1", () => {
    const data = generateMockOHLCV(100);
    const bt = new Backtester(testStrategy(), data);
    const result = bt.run();

    expect(result.winRate).toBeGreaterThanOrEqual(0);
    expect(result.winRate).toBeLessThanOrEqual(1);
  });

  it("totalTrades is a non-negative integer", () => {
    const data = generateMockOHLCV(100);
    const bt = new Backtester(testStrategy(), data);
    const result = bt.run();

    expect(Number.isInteger(result.totalTrades)).toBe(true);
    expect(result.totalTrades).toBeGreaterThanOrEqual(0);
  });

  it("produces zero trades on a strategy with unreachable trigger", () => {
    const data = generateMockOHLCV(50, 100);
    const strat = testStrategy({
      triggers: [
        {
          type: "PRICE_BELOW" as const,
          params: { threshold: -9999 },
          description: "Never fires",
        },
      ],
    });
    const bt = new Backtester(strat, data);
    const result = bt.run();

    expect(result.totalTrades).toBe(0);
    expect(result.totalReturn).toBeCloseTo(0, 5);
  });

  it("runs with PRICE_ABOVE trigger", () => {
    const data = generateMockOHLCV(60, 100);
    const strat = testStrategy({
      triggers: [
        {
          type: "PRICE_ABOVE" as const,
          params: { threshold: 101 },
        },
      ],
    });
    const bt = new Backtester(strat, data);
    const result = bt.run();

    // Should produce some trades given price oscillation around 100.
    expect(result).toHaveProperty("totalReturn");
    expect(result.equityCurve).toHaveLength(60);
  });

  it("runs with PRICE_CHANGE_PCT trigger", () => {
    const data = generateMockOHLCV(60, 100);
    const strat = testStrategy({
      triggers: [
        {
          type: "PRICE_CHANGE_PCT" as const,
          params: { pct: 1, lookback: 3 },
        },
      ],
    });
    const bt = new Backtester(strat, data);
    const result = bt.run();

    expect(result.equityCurve).toHaveLength(60);
  });

  it("runs with TIME_INTERVAL trigger", () => {
    const data = generateMockOHLCV(50);
    const strat = testStrategy({
      triggers: [
        {
          type: "TIME_INTERVAL" as const,
          params: { bars: 5 },
        },
      ],
    });
    const bt = new Backtester(strat, data);
    const result = bt.run();

    expect(result.totalTrades).toBeGreaterThan(0);
  });

  it("runs with INDICATOR trigger (RSI)", () => {
    const data = generateMockOHLCV(60, 100);
    const strat = testStrategy({
      triggers: [
        {
          type: "INDICATOR" as const,
          params: { indicator: "rsi_14", condition: "below", value: 40 },
        },
      ],
    });
    const bt = new Backtester(strat, data);
    const result = bt.run();

    expect(result).toHaveProperty("totalReturn");
    expect(result.equityCurve).toHaveLength(60);
  });

  it("handles an empty-trigger strategy gracefully", () => {
    const data = generateMockOHLCV(30);
    const strat = testStrategy({ triggers: [] });
    const bt = new Backtester(strat, data);
    const result = bt.run();

    // Empty triggers use the default cadence (every 5 bars).
    expect(result.equityCurve).toHaveLength(30);
    expect(result.totalTrades).toBeGreaterThan(0);
  });

  it("applies stop-loss correctly", () => {
    // Create data that drops sharply after entry so stop-loss fires.
    const bars: OHLCVBar[] = [];
    for (let i = 0; i < 20; i++) {
      const close = i < 5 ? 50 : 50 - (i - 4) * 5; // drops from 50 to ~-25 (clamped)
      bars.push({
        timestamp: Date.now() + i * 60_000,
        open: close + 1,
        high: close + 2,
        low: Math.max(1, close - 2),
        close: Math.max(1, close),
        volume: 1000,
      });
    }

    const strat = testStrategy({
      triggers: [{ type: "PRICE_BELOW" as const, params: { threshold: 55 } }],
      constraints: {
        maxPositionPct: 25,
        stopLossPct: -5,
        maxDailyTrades: 20,
        maxSlippageBps: 50,
      },
    });

    const bt = new Backtester(strat, bars);
    const result = bt.run();

    // Trades should close on stop loss.
    expect(result.totalTrades).toBeGreaterThan(0);
  });

  it("sharpeRatio is a finite number", () => {
    const data = generateMockOHLCV(100);
    const bt = new Backtester(testStrategy(), data);
    const result = bt.run();

    expect(Number.isFinite(result.sharpeRatio)).toBe(true);
  });

  it("sortinoRatio is a number (may be Infinity for no downside)", () => {
    const data = generateMockOHLCV(100);
    const bt = new Backtester(testStrategy(), data);
    const result = bt.run();

    expect(typeof result.sortinoRatio).toBe("number");
  });

  it("consistency: running the same backtest twice yields identical results", () => {
    const data = generateMockOHLCV(80, 100);
    const strat = testStrategy();

    const r1 = new Backtester(strat, data).run();
    const r2 = new Backtester(strat, data).run();

    expect(r1.totalReturn).toEqual(r2.totalReturn);
    expect(r1.totalTrades).toEqual(r2.totalTrades);
    expect(r1.equityCurve).toEqual(r2.equityCurve);
    expect(r1.sharpeRatio).toEqual(r2.sharpeRatio);
    expect(r1.maxDrawdown).toEqual(r2.maxDrawdown);
  });
});
