// ---------------------------------------------------------------------------
// Prebuilt: Yield Rotation Strategy
//
// Monitors APY across configured DeFi protocols and rotates capital into
// the highest-yielding option when the differential exceeds a threshold.
// ---------------------------------------------------------------------------

import type { IStrategy } from "../../types/strategy.js";
import { TriggerType, ActionType } from "../../types/strategy.js";

export interface YieldRotationOpts {
  /**
   * Protocols to monitor and rotate between.
   * Defaults to the most commonly used yield sources.
   */
  protocols?: string[];
  /**
   * Minimum APY difference (as a fraction, e.g. 0.02 = 2 percentage points)
   * required before rotating.  Prevents thrashing on small differentials.
   */
  minYieldDiff?: number;
  /** Chain IDs the strategy is allowed to operate on. */
  allowedChains?: number[];
  /**
   * How often to check yields (interval expressed in ms).
   * Default: 4 hours.
   */
  checkIntervalMs?: number;
  /** Maximum position percentage for a single protocol. */
  maxPositionPct?: number;
}

const DEFAULT_PROTOCOLS = ["aave-v3", "compound-v3", "lido", "curve", "yearn"];
const FOUR_HOURS_MS = 4 * 60 * 60 * 1_000;

/**
 * Create a yield-rotation IStrategy.
 *
 * The strategy periodically compares APYs across `protocols` and moves
 * capital from the current protocol to a higher-yielding one when the
 * difference exceeds `minYieldDiff`.
 *
 * @example
 * ```ts
 * const strategy = createYieldRotationStrategy({
 *   protocols: ['aave-v3', 'compound-v3', 'lido'],
 *   minYieldDiff: 0.02, // rotate when 2+ APY points better
 * });
 * ```
 */
export function createYieldRotationStrategy(opts: YieldRotationOpts = {}): IStrategy {
  const {
    protocols = DEFAULT_PROTOCOLS,
    minYieldDiff = 0.02,
    allowedChains = [1, 42161, 10],   // Ethereum, Arbitrum, Optimism
    checkIntervalMs = FOUR_HOURS_MS,
    maxPositionPct = 80,
  } = opts;

  const barsPerInterval = Math.max(1, Math.round(checkIntervalMs / (60 * 60 * 1_000)));

  const strategy: IStrategy = {
    id: "prebuilt-yield-rotation-v1",
    name: "Yield Rotation",
    version: "1.0.0",
    description:
      `Automatically rotates capital to the highest-yielding protocol ` +
      `(min ${(minYieldDiff * 100).toFixed(1)}% APY improvement required) ` +
      `across: ${protocols.join(", ")}.`,

    // ---- Triggers ---------------------------------------------------------
    // Check yields on a time interval.
    triggers: [
      {
        type: TriggerType.TIME_INTERVAL,
        params: {
          intervalMs: checkIntervalMs,
          bars: barsPerInterval,
        },
        description: `Check APY every ${formatInterval(checkIntervalMs)}`,
      },
      // Also react to large, sudden APY spikes detected as custom events.
      {
        type: TriggerType.CUSTOM,
        params: {
          event: "apy_spike",
          minYieldDiff,
          protocols,
        },
        description: "React to real-time APY spikes from protocol event feeds",
      },
    ],

    // ---- Actions ----------------------------------------------------------
    // Move funds to the best-yielding protocol via a stake/unstake pair.
    actions: [
      {
        type: ActionType.UNSTAKE,
        params: {
          protocol: "current",   // resolved at runtime by the agent
          amount: "all",
          minYieldDiff,
          protocols,
        },
        chainId: allowedChains[0] ?? 1,
        protocol: "current",
      },
      {
        type: ActionType.STAKE,
        params: {
          protocol: "best",      // resolved at runtime by the agent
          amount: "all",
          minYieldDiff,
          protocols,
        },
        chainId: allowedChains[0] ?? 1,
        protocol: "best",
      },
    ],

    // ---- Constraints -------------------------------------------------------
    constraints: {
      maxPositionPct,
      stopLossPct: -10,
      maxDailyTrades: 6,
      maxSlippageBps: 30,
      allowedChains,
      allowedProtocols: protocols,
    },

    // ---- Params ------------------------------------------------------------
    params: {
      protocols,
      minYieldDiff,
      checkIntervalMs,
    },
  };

  return strategy;
}

// ---------------------------------------------------------------------------
// Formatting helper
// ---------------------------------------------------------------------------

function formatInterval(ms: number): string {
  const hours = ms / (60 * 60 * 1_000);
  if (hours < 1) {
    const minutes = ms / (60 * 1_000);
    return `${minutes}m`;
  }
  if (hours < 24) return `${hours}h`;
  const days = hours / 24;
  return `${days}d`;
}
