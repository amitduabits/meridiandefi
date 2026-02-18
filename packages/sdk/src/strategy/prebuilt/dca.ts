// ---------------------------------------------------------------------------
// Prebuilt: Dollar-Cost Averaging (DCA) Strategy
//
// Buys a fixed USD amount of a target token on a regular schedule,
// regardless of market conditions.
// ---------------------------------------------------------------------------

import type { IStrategy } from "../../types/strategy.js";
import { TriggerType, ActionType } from "../../types/strategy.js";

export interface DCAOpts {
  /** Token symbol to accumulate (e.g. "ETH", "BTC"). */
  token?: string;
  /**
   * How often to purchase, in milliseconds.
   * Defaults to 7 days (604_800_000 ms).
   */
  intervalMs?: number;
  /** Amount in USD to spend each interval. */
  amountUsd?: number;
  /** Input token used to buy (default: USDC). */
  inputToken?: string;
  /** Chain to execute on (default: 1 — Ethereum mainnet). */
  chainId?: number;
  /** Protocol to swap through (default: uniswap-v3). */
  protocol?: string;
  /** Maximum acceptable slippage in bps (default: 50 = 0.5%). */
  maxSlippageBps?: number;
}

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1_000;

/**
 * Create a dollar-cost averaging IStrategy.
 *
 * The strategy purchases `amountUsd` worth of `token` every `intervalMs`
 * milliseconds using the TIME_INTERVAL trigger and a SWAP action.
 *
 * @example
 * ```ts
 * const strategy = createDCAStrategy({
 *   token: 'ETH',
 *   intervalMs: 7 * 24 * 60 * 60 * 1000, // weekly
 *   amountUsd: 100,
 * });
 * ```
 */
export function createDCAStrategy(opts: DCAOpts = {}): IStrategy {
  const {
    token = "ETH",
    intervalMs = ONE_WEEK_MS,
    amountUsd = 100,
    inputToken = "USDC",
    chainId = 1,
    protocol = "uniswap-v3",
    maxSlippageBps = 50,
  } = opts;

  // Convert ms interval to approximate bar count (1 bar ≈ 1 hour in backtest).
  const barsPerInterval = Math.max(1, Math.round(intervalMs / (60 * 60 * 1_000)));

  const strategy: IStrategy = {
    id: "prebuilt-dca-v1",
    name: `DCA into ${token}`,
    version: "1.0.0",
    description:
      `Dollar-cost averaging strategy that buys $${amountUsd} of ${token} ` +
      `every ${formatInterval(intervalMs)} using ${inputToken} on chain ${chainId}.`,

    // ---- Triggers ---------------------------------------------------------
    triggers: [
      {
        type: TriggerType.TIME_INTERVAL,
        params: {
          intervalMs,
          bars: barsPerInterval,
        },
        description: `Purchase every ${formatInterval(intervalMs)}`,
      },
    ],

    // ---- Actions ----------------------------------------------------------
    actions: [
      {
        type: ActionType.SWAP,
        params: {
          inputToken,
          outputToken: token,
          amountUsd,
          slippageTolerance: maxSlippageBps / 10_000,
        },
        chainId,
        protocol,
      },
    ],

    // ---- Constraints -------------------------------------------------------
    constraints: {
      maxPositionPct: 100, // DCA accumulates, so no hard cap per purchase
      stopLossPct: -100,   // DCA never stops — intentional long-term hold
      maxDailyTrades: 3,
      maxSlippageBps,
      allowedChains: [chainId],
      allowedProtocols: [protocol],
    },

    // ---- Params ------------------------------------------------------------
    params: {
      token,
      intervalMs,
      amountUsd,
      inputToken,
    },
  };

  return strategy;
}

// ---------------------------------------------------------------------------
// Formatting helper
// ---------------------------------------------------------------------------

function formatInterval(ms: number): string {
  const seconds = ms / 1_000;
  if (seconds < 60) return `${seconds}s`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours}h`;
  const days = hours / 24;
  if (days < 7) return `${days}d`;
  const weeks = days / 7;
  return `${weeks}w`;
}
