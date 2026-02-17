// ---------------------------------------------------------------------------
// Portfolio risk — pure math functions.
// DETERMINISTIC: no LLM calls, no side effects, no I/O.
// ---------------------------------------------------------------------------

/**
 * Calculate the maximum drawdown from an equity curve.
 *
 * Drawdown = (peak - trough) / peak.
 * Returns a value in [0, 1] where 1 means the portfolio went to zero.
 *
 * @param equityCurve - Array of equity values over time (chronological order).
 * @returns Maximum drawdown as a fraction (0-1). Returns 0 for empty or single-element curves.
 */
export function calculateDrawdown(equityCurve: readonly number[]): number {
  if (equityCurve.length < 2) return 0;

  let peak = equityCurve[0]!;
  let maxDrawdown = 0;

  for (let i = 1; i < equityCurve.length; i++) {
    const value = equityCurve[i]!;
    if (value > peak) {
      peak = value;
    }
    const drawdown = peak > 0 ? (peak - value) / peak : 0;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}

/**
 * Calculate the mean of an array of numbers.
 * @internal
 */
function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

/**
 * Calculate the population standard deviation of an array.
 * @internal
 */
function stddev(values: readonly number[], avg?: number): number {
  if (values.length < 2) return 0;
  const mu = avg ?? mean(values);
  let sumSq = 0;
  for (const v of values) sumSq += (v - mu) ** 2;
  return Math.sqrt(sumSq / values.length);
}

/**
 * Annualised Sharpe ratio.
 *
 *   Sharpe = (mean(returns) - riskFreeRate) / stddev(returns)
 *
 * The result is **not** annualised — the caller decides the periodicity of
 * `returns` and can multiply by sqrt(N) themselves.
 *
 * @param returns      - Array of periodic returns (e.g. daily).
 * @param riskFreeRate - Risk-free rate for the same period (default 0).
 * @returns Sharpe ratio. Returns 0 when stddev is zero.
 */
export function calculateSharpeRatio(
  returns: readonly number[],
  riskFreeRate = 0,
): number {
  if (returns.length < 2) return 0;

  const excessReturns = returns.map((r) => r - riskFreeRate);
  const avg = mean(excessReturns);
  const sd = stddev(excessReturns, avg);

  return sd === 0 ? 0 : avg / sd;
}

/**
 * Sortino ratio — like Sharpe but penalises only downside volatility.
 *
 *   Sortino = (mean(returns) - riskFreeRate) / downsideDeviation
 *
 * @param returns      - Array of periodic returns.
 * @param riskFreeRate - Risk-free rate for the same period (default 0).
 * @returns Sortino ratio. Returns 0 when downside deviation is zero.
 */
export function calculateSortinoRatio(
  returns: readonly number[],
  riskFreeRate = 0,
): number {
  if (returns.length < 2) return 0;

  const excessReturns = returns.map((r) => r - riskFreeRate);
  const avg = mean(excessReturns);

  // Downside deviation: stddev of negative excess returns only.
  const downside = excessReturns.filter((r) => r < 0);
  if (downside.length === 0) return 0;

  let sumSq = 0;
  for (const d of downside) sumSq += d ** 2;
  const downsideDev = Math.sqrt(sumSq / returns.length);

  return downsideDev === 0 ? 0 : avg / downsideDev;
}

/**
 * Historical Value at Risk (VaR) using the percentile method.
 *
 * Sorts returns and picks the loss at the given confidence level.
 *
 * @param returns    - Array of periodic returns.
 * @param confidence - Confidence level in (0, 1), e.g. 0.95 for 95% VaR.
 * @returns VaR as a **positive** number representing the loss threshold.
 *          Returns 0 for empty arrays.
 */
export function calculateVaR(
  returns: readonly number[],
  confidence = 0.95,
): number {
  if (returns.length === 0) return 0;

  const sorted = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * sorted.length);
  const clampedIndex = Math.max(0, Math.min(index, sorted.length - 1));

  // VaR is the magnitude of the loss at the given percentile.
  return -sorted[clampedIndex]!;
}

/**
 * Herfindahl–Hirschman Index for portfolio concentration.
 *
 * HHI = sum(w_i^2) where w_i are portfolio weights summing to 1.
 * A fully diversified portfolio of N assets has HHI = 1/N.
 * A single-asset portfolio has HHI = 1.
 *
 * @param weights - Array of portfolio weights (must sum to ~1).
 * @returns HHI in [0, 1]. Returns 0 for empty arrays.
 */
export function concentrationIndex(weights: readonly number[]): number {
  if (weights.length === 0) return 0;

  let hhi = 0;
  for (const w of weights) hhi += w ** 2;
  return hhi;
}
