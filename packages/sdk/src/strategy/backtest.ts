// ---------------------------------------------------------------------------
// Backtester — simulates an IStrategy against historical OHLCV data.
// ---------------------------------------------------------------------------

import type { IStrategy } from "../types/strategy.js";
import { TriggerType } from "../types/strategy.js";
import { StrategyError } from "../core/errors.js";
import { createLogger } from "../core/logger.js";
import { sma, ema, rsi, bollingerBands } from "./indicators.js";

const log = createLogger({ module: "Backtester" });

// ---------------------------------------------------------------------------
// OHLCV bar
// ---------------------------------------------------------------------------

export interface OHLCVBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

export interface BacktestResult {
  /** Total return as a decimal (0.05 = 5%). */
  totalReturn: number;
  /** Annualised Sharpe ratio (assuming 252 trading days). */
  sharpeRatio: number;
  /** Annualised Sortino ratio (downside deviation only). */
  sortinoRatio: number;
  /** Maximum drawdown as a positive decimal (0.10 = 10% peak-to-trough). */
  maxDrawdown: number;
  /** Win rate as a decimal (0.6 = 60%). */
  winRate: number;
  /** Total number of completed round-trip trades. */
  totalTrades: number;
  /** Equity curve — portfolio value at each bar. */
  equityCurve: number[];
}

// ---------------------------------------------------------------------------
// Internal trade representation
// ---------------------------------------------------------------------------

interface OpenTrade {
  entryBar: number;
  entryPrice: number;
}

interface ClosedTrade {
  entryPrice: number;
  exitPrice: number;
  returnPct: number;
}

// ---------------------------------------------------------------------------
// Backtester
// ---------------------------------------------------------------------------

export class Backtester {
  private readonly strategy: IStrategy;
  private readonly data: readonly OHLCVBar[];

  constructor(strategy: IStrategy, historicalData: readonly OHLCVBar[]) {
    if (historicalData.length < 2) {
      throw new StrategyError("Need at least 2 bars for backtesting", {
        code: "BACKTEST_INSUFFICIENT_DATA",
      });
    }
    this.strategy = strategy;
    this.data = historicalData;
  }

  /**
   * Execute the back-test and return performance metrics.
   *
   * Simulation rules:
   *  - Cash starts at the first bar's close price (i.e. 1 unit of capital).
   *  - When a trigger fires and no position is open, we *buy* at that bar's close.
   *  - Position is closed when stop-loss or take-profit is hit, or an opposing
   *    trigger fires.
   *  - Equity curve is tracked bar-by-bar.
   */
  run(): BacktestResult {
    const closes = this.data.map((b) => b.close);
    const highs = this.data.map((b) => b.high);
    const lows = this.data.map((b) => b.low);

    // Pre-compute indicators that triggers may reference.
    const indicators = this.precomputeIndicators(closes, highs, lows);

    const initialCapital = closes[0]!;
    let cash = initialCapital;
    let position: OpenTrade | null = null;
    const closedTrades: ClosedTrade[] = [];
    const equityCurve: number[] = [];
    const barReturns: number[] = [];

    const stopLossPct = this.strategy.constraints.stopLossPct ?? -5;
    const takeProfitPct = this.strategy.constraints.takeProfitPct;

    for (let i = 0; i < this.data.length; i++) {
      const close = closes[i]!;

      // ---- Track equity -----------------------------------------------------
      const equity = position ? cash + close - position.entryPrice : cash;
      equityCurve.push(equity);

      if (i > 0) {
        const prevEquity = equityCurve[i - 1]!;
        barReturns.push(prevEquity === 0 ? 0 : (equity - prevEquity) / prevEquity);
      }

      // ---- Check stop-loss / take-profit if we have a position ---------------
      if (position) {
        const pnlPct = ((close - position.entryPrice) / position.entryPrice) * 100;

        if (pnlPct <= stopLossPct) {
          closedTrades.push(this.closeTrade(position, close));
          cash += close - position.entryPrice;
          position = null;
          continue;
        }

        if (takeProfitPct !== undefined && pnlPct >= takeProfitPct) {
          closedTrades.push(this.closeTrade(position, close));
          cash += close - position.entryPrice;
          position = null;
          continue;
        }
      }

      // ---- Evaluate triggers ------------------------------------------------
      const triggered = this.evaluateTriggers(i, closes, indicators);

      if (triggered && !position) {
        // Open a new position.
        position = { entryBar: i, entryPrice: close };
      } else if (!triggered && position) {
        // Close position on trigger de-assertion.
        closedTrades.push(this.closeTrade(position, close));
        cash += close - position.entryPrice;
        position = null;
      }
    }

    // Close any dangling position at last bar.
    if (position) {
      const lastClose = closes[closes.length - 1]!;
      closedTrades.push(this.closeTrade(position, lastClose));
      cash += lastClose - position.entryPrice;
    }

    // Final equity.
    const finalEquity = cash;

    // ---- Metrics ----------------------------------------------------------
    const totalReturn = (finalEquity - initialCapital) / initialCapital;
    const totalTrades = closedTrades.length;
    const winRate =
      totalTrades === 0
        ? 0
        : closedTrades.filter((t) => t.returnPct > 0).length / totalTrades;

    const sharpeRatio = this.computeSharpe(barReturns);
    const sortinoRatio = this.computeSortino(barReturns);
    const maxDrawdown = this.computeMaxDrawdown(equityCurve);

    log.info(
      {
        strategyId: this.strategy.id,
        totalReturn: (totalReturn * 100).toFixed(2) + "%",
        sharpeRatio: sharpeRatio.toFixed(2),
        maxDrawdown: (maxDrawdown * 100).toFixed(2) + "%",
        totalTrades,
      },
      "Backtest complete",
    );

    return {
      totalReturn,
      sharpeRatio,
      sortinoRatio,
      maxDrawdown,
      winRate,
      totalTrades,
      equityCurve,
    };
  }

  // =========================================================================
  // Private helpers
  // =========================================================================

  // ---- Indicator cache ----------------------------------------------------

  private precomputeIndicators(
    closes: number[],
    _highs: number[],
    _lows: number[],
  ): Map<string, number[]> {
    const cache = new Map<string, number[]>();

    // Pre-compute commonly used indicators so trigger evaluation is O(1).
    if (closes.length >= 20) {
      cache.set("sma_20", sma(closes, 20));
      cache.set("ema_12", ema(closes, 12));
      cache.set("ema_26", ema(closes, 26));
    }
    if (closes.length >= 14) {
      cache.set("rsi_14", rsi(closes, 14));
    }
    if (closes.length >= 20) {
      const bb = bollingerBands(closes, 20, 2);
      cache.set("bb_upper_20", bb.upper);
      cache.set("bb_lower_20", bb.lower);
      cache.set("bb_middle_20", bb.middle);
    }

    return cache;
  }

  // ---- Trigger evaluation -------------------------------------------------

  private evaluateTriggers(
    barIndex: number,
    closes: number[],
    indicators: Map<string, number[]>,
  ): boolean {
    // If no triggers are defined, every bar triggers (useful for always-on
    // DCA-like strategies during tests).
    if (this.strategy.triggers.length === 0) {
      return barIndex % 5 === 0; // fire every 5 bars as a default cadence
    }

    // ANY trigger firing counts as a signal.
    for (const trigger of this.strategy.triggers) {
      if (this.evaluateSingleTrigger(trigger, barIndex, closes, indicators)) {
        return true;
      }
    }
    return false;
  }

  private evaluateSingleTrigger(
    trigger: IStrategy["triggers"][number],
    barIndex: number,
    closes: number[],
    indicators: Map<string, number[]>,
  ): boolean {
    const close = closes[barIndex]!;
    const params = trigger.params;

    switch (trigger.type) {
      case TriggerType.PRICE_ABOVE: {
        const threshold = Number(params["threshold"]);
        return !isNaN(threshold) && close > threshold;
      }

      case TriggerType.PRICE_BELOW: {
        const threshold = Number(params["threshold"]);
        return !isNaN(threshold) && close < threshold;
      }

      case TriggerType.PRICE_CHANGE_PCT: {
        const pct = Number(params["pct"]);
        const lookback = Number(params["lookback"] ?? 1);
        if (isNaN(pct) || barIndex < lookback) return false;
        const prev = closes[barIndex - lookback]!;
        if (prev === 0) return false;
        const change = ((close - prev) / prev) * 100;
        return Math.abs(change) >= Math.abs(pct);
      }

      case TriggerType.INDICATOR: {
        return this.evaluateIndicatorTrigger(params, barIndex, closes, indicators);
      }

      case TriggerType.TIME_INTERVAL: {
        const interval = Number(params["bars"] ?? 10);
        return barIndex % interval === 0;
      }

      case TriggerType.GAS_BELOW: {
        // Gas data not available in backtest — always true.
        return true;
      }

      case TriggerType.PORTFOLIO_DRIFT:
      case TriggerType.CUSTOM:
      default:
        // Cannot evaluate without live data — default to no-trigger.
        return false;
    }
  }

  private evaluateIndicatorTrigger(
    params: Record<string, unknown>,
    barIndex: number,
    _closes: number[],
    indicators: Map<string, number[]>,
  ): boolean {
    const indicator = String(params["indicator"] ?? "").toLowerCase();
    const condition = String(params["condition"] ?? "above");
    const value = Number(params["value"] ?? 0);

    // Map the indicator name to a precomputed series.
    let series: number[] | undefined;
    let seriesOffset = 0;

    switch (indicator) {
      case "sma":
      case "sma_20": {
        series = indicators.get("sma_20");
        seriesOffset = 20 - 1;
        break;
      }
      case "rsi":
      case "rsi_14": {
        series = indicators.get("rsi_14");
        seriesOffset = 14;
        break;
      }
      case "bb_upper":
      case "bb_upper_20": {
        series = indicators.get("bb_upper_20");
        seriesOffset = 20 - 1;
        break;
      }
      case "bb_lower":
      case "bb_lower_20": {
        series = indicators.get("bb_lower_20");
        seriesOffset = 20 - 1;
        break;
      }
      default: {
        // Try to find it in the cache by exact name.
        series = indicators.get(indicator);
        break;
      }
    }

    if (!series) return false;

    const idx = barIndex - seriesOffset;
    if (idx < 0 || idx >= series.length) return false;

    const indicatorValue = series[idx]!;

    switch (condition) {
      case "above":
        return indicatorValue > value;
      case "below":
        return indicatorValue < value;
      case "cross_above": {
        if (idx < 1) return false;
        const prev = series[idx - 1]!;
        return prev <= value && indicatorValue > value;
      }
      case "cross_below": {
        if (idx < 1) return false;
        const prev = series[idx - 1]!;
        return prev >= value && indicatorValue < value;
      }
      default:
        return false;
    }
  }

  // ---- Trade helpers ------------------------------------------------------

  private closeTrade(open: OpenTrade, exitPrice: number): ClosedTrade {
    const returnPct = ((exitPrice - open.entryPrice) / open.entryPrice) * 100;
    return { entryPrice: open.entryPrice, exitPrice, returnPct };
  }

  // ---- Statistical helpers ------------------------------------------------

  /**
   * Annualised Sharpe ratio (assuming risk-free rate = 0).
   * Uses 252 trading days for annualisation.
   */
  private computeSharpe(returns: number[]): number {
    if (returns.length < 2) return 0;

    const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
    const variance =
      returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1);
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;
    return (mean / stdDev) * Math.sqrt(252);
  }

  /**
   * Annualised Sortino ratio — like Sharpe but only penalises downside vol.
   */
  private computeSortino(returns: number[]): number {
    if (returns.length < 2) return 0;

    const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
    const downsideSquares = returns
      .filter((r) => r < 0)
      .map((r) => r ** 2);

    if (downsideSquares.length === 0) return mean === 0 ? 0 : Infinity;

    const downsideVariance =
      downsideSquares.reduce((s, v) => s + v, 0) / downsideSquares.length;
    const downsideDev = Math.sqrt(downsideVariance);

    if (downsideDev === 0) return 0;
    return (mean / downsideDev) * Math.sqrt(252);
  }

  /**
   * Maximum drawdown — peak-to-trough decline as a positive decimal.
   */
  private computeMaxDrawdown(equityCurve: number[]): number {
    if (equityCurve.length === 0) return 0;

    let peak = equityCurve[0]!;
    let maxDD = 0;

    for (const equity of equityCurve) {
      if (equity > peak) peak = equity;
      const dd = peak === 0 ? 0 : (peak - equity) / peak;
      if (dd > maxDD) maxDD = dd;
    }

    return maxDD;
  }
}
