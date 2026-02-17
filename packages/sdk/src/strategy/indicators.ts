// ---------------------------------------------------------------------------
// Technical indicators — pure functions operating on numeric arrays.
// No external dependencies.  Every function is deterministic and side-effect
// free so that the same inputs always produce the same outputs.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Simple Moving Average
// ---------------------------------------------------------------------------

/**
 * Compute the simple moving average for every valid window.
 *
 * @returns Array of length `data.length - period + 1`.
 *          Entry `i` is the mean of `data[i .. i + period - 1]`.
 */
export function sma(data: readonly number[], period: number): number[] {
  if (period < 1) throw new RangeError("period must be >= 1");
  if (data.length < period) return [];

  const result: number[] = [];

  // Seed the running sum with the first window.
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i]!;
  }
  result.push(sum / period);

  // Slide the window.
  for (let i = period; i < data.length; i++) {
    sum += data[i]! - data[i - period]!;
    result.push(sum / period);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Exponential Moving Average
// ---------------------------------------------------------------------------

/**
 * Compute the exponential moving average.
 *
 * The first EMA value equals the SMA of the first `period` elements.
 * Subsequent values use the standard multiplier `k = 2 / (period + 1)`.
 *
 * @returns Array of length `data.length - period + 1`.
 */
export function ema(data: readonly number[], period: number): number[] {
  if (period < 1) throw new RangeError("period must be >= 1");
  if (data.length < period) return [];

  const k = 2 / (period + 1);
  const result: number[] = [];

  // Seed with the SMA of the first window.
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i]!;
  }
  let prev = sum / period;
  result.push(prev);

  for (let i = period; i < data.length; i++) {
    prev = data[i]! * k + prev * (1 - k);
    result.push(prev);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Relative Strength Index  (Wilder's smoothing)
// ---------------------------------------------------------------------------

/**
 * Compute the RSI indicator (0 – 100).
 *
 * Uses Wilder's smoothing method: the first RS is a simple average of
 * gains / losses over `period` bars, then subsequent values are smoothed
 * with `prev * (period - 1) + current) / period`.
 *
 * @returns Array of length `data.length - period`.
 *          The first value corresponds to data index `period`.
 */
export function rsi(data: readonly number[], period: number): number[] {
  if (period < 1) throw new RangeError("period must be >= 1");
  if (data.length < period + 1) return [];

  // Collect price changes.
  const changes: number[] = [];
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i]! - data[i - 1]!);
  }

  // Initial average gain / loss over the first `period` changes.
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    const c = changes[i]!;
    if (c > 0) avgGain += c;
    else avgLoss += Math.abs(c);
  }
  avgGain /= period;
  avgLoss /= period;

  const result: number[] = [];

  const pushRsi = () => {
    if (avgLoss === 0) {
      result.push(100);
    } else {
      const rs = avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  };

  pushRsi(); // first RSI value

  // Wilder's smoothing for the remaining values.
  for (let i = period; i < changes.length; i++) {
    const c = changes[i]!;
    const gain = c > 0 ? c : 0;
    const loss = c < 0 ? Math.abs(c) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    pushRsi();
  }

  return result;
}

// ---------------------------------------------------------------------------
// MACD  (Moving Average Convergence Divergence)
// ---------------------------------------------------------------------------

export interface MACDResult {
  /** MACD line values. */
  macd: number[];
  /** Signal line values. */
  signal: number[];
  /** Histogram (macd – signal). */
  histogram: number[];
}

/**
 * Compute the MACD indicator.
 *
 * @param fastPeriod   - Period for the fast EMA (default 12).
 * @param slowPeriod   - Period for the slow EMA (default 26).
 * @param signalPeriod - Period for the signal EMA (default 9).
 *
 * The returned arrays are aligned so that `macd[i]` and `signal[i]`
 * correspond to the same bar.  Length = `data.length - slowPeriod - signalPeriod + 2`.
 */
export function macd(
  data: readonly number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): MACDResult {
  if (fastPeriod < 1 || slowPeriod < 1 || signalPeriod < 1) {
    throw new RangeError("All periods must be >= 1");
  }

  const fastEma = ema(data, fastPeriod);
  const slowEma = ema(data, slowPeriod);

  // Both EMAs need to be aligned to the same starting bar.
  // fastEma starts at index `fastPeriod - 1`, slowEma at `slowPeriod - 1`.
  // We trim the fast EMA so both start at `slowPeriod - 1`.
  const offset = slowPeriod - fastPeriod;
  const alignedFast = fastEma.slice(offset);

  // MACD line = fastEMA – slowEMA.
  const macdLine: number[] = [];
  for (let i = 0; i < slowEma.length; i++) {
    macdLine.push(alignedFast[i]! - slowEma[i]!);
  }

  // Signal line = EMA of the MACD line.
  const signalLine = ema(macdLine, signalPeriod);

  // Align the MACD line to the signal line.
  const trimmedMacd = macdLine.slice(signalPeriod - 1);

  const histogram: number[] = [];
  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(trimmedMacd[i]! - signalLine[i]!);
  }

  return { macd: trimmedMacd, signal: signalLine, histogram };
}

// ---------------------------------------------------------------------------
// Bollinger Bands
// ---------------------------------------------------------------------------

export interface BollingerBandsResult {
  upper: number[];
  middle: number[];
  lower: number[];
}

/**
 * Compute Bollinger Bands.
 *
 * @param period - SMA look-back period (default 20).
 * @param stdDev - Number of standard deviations (default 2).
 *
 * @returns Arrays of length `data.length - period + 1`.
 */
export function bollingerBands(
  data: readonly number[],
  period = 20,
  stdDev = 2,
): BollingerBandsResult {
  if (period < 1) throw new RangeError("period must be >= 1");

  const middle = sma(data, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < middle.length; i++) {
    // Compute population std-dev for this window.
    const mid = middle[i]!;
    let variance = 0;
    for (let j = 0; j < period; j++) {
      const diff = data[i + j]! - mid;
      variance += diff * diff;
    }
    const sd = Math.sqrt(variance / period);

    upper.push(mid + stdDev * sd);
    lower.push(mid - stdDev * sd);
  }

  return { upper, middle, lower };
}

// ---------------------------------------------------------------------------
// VWAP  (Volume-Weighted Average Price)
// ---------------------------------------------------------------------------

/**
 * Compute the running VWAP for a session.
 *
 * Typical price = (high + low + close) / 3.
 * VWAP_i = cumSum(typicalPrice * volume) / cumSum(volume).
 *
 * @returns Array of the same length as the inputs.
 */
export function vwap(
  highs: readonly number[],
  lows: readonly number[],
  closes: readonly number[],
  volumes: readonly number[],
): number[] {
  const len = highs.length;
  if (lows.length !== len || closes.length !== len || volumes.length !== len) {
    throw new RangeError("All input arrays must have the same length");
  }

  const result: number[] = [];
  let cumTPV = 0;
  let cumVol = 0;

  for (let i = 0; i < len; i++) {
    const tp = (highs[i]! + lows[i]! + closes[i]!) / 3;
    cumTPV += tp * volumes[i]!;
    cumVol += volumes[i]!;
    result.push(cumVol === 0 ? 0 : cumTPV / cumVol);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Z-Score
// ---------------------------------------------------------------------------

/**
 * Compute the z-score of the latest value relative to the trailing `period`
 * window mean and standard deviation.
 *
 * @returns Array of length `data.length - period + 1`.
 *          Each entry is `(value - mean) / stddev` for the window ending at
 *          that index.  If stddev is zero the z-score is 0.
 */
export function zScore(data: readonly number[], period: number): number[] {
  if (period < 1) throw new RangeError("period must be >= 1");
  if (data.length < period) return [];

  const means = sma(data, period);
  const result: number[] = [];

  for (let i = 0; i < means.length; i++) {
    const mean = means[i]!;
    let variance = 0;
    for (let j = 0; j < period; j++) {
      const diff = data[i + j]! - mean;
      variance += diff * diff;
    }
    const sd = Math.sqrt(variance / period);
    const value = data[i + period - 1]!;
    result.push(sd === 0 ? 0 : (value - mean) / sd);
  }

  return result;
}
