// ---------------------------------------------------------------------------
// Prebuilt: Portfolio Rebalancer Strategy
//
// Monitors portfolio allocation and triggers a rebalance when any asset
// drifts beyond the configured threshold.
// ---------------------------------------------------------------------------

import type { IStrategy } from "../../types/strategy.js";
import { TriggerType, ActionType } from "../../types/strategy.js";

export interface RebalancerOpts {
  /** Target allocations as fractions (0–1).  Values must sum to ≤ 1. */
  targets?: Record<string, number>;
  /** Minimum drift (as a fraction) required to trigger a rebalance. */
  driftThreshold?: number;
  /** Maximum position size as a percentage (1–100). */
  maxPositionPct?: number;
  /** Stop-loss percentage (negative, e.g. -5 means 5% drawdown). */
  stopLossPct?: number;
  /** Chain IDs the strategy is allowed to trade on. */
  allowedChains?: number[];
}

/**
 * Create a portfolio rebalancing IStrategy.
 *
 * The strategy fires when any tracked asset drifts from its target allocation
 * by more than `driftThreshold` and then executes a REBALANCE action.
 *
 * @example
 * ```ts
 * const strategy = createRebalancerStrategy({
 *   targets: { ETH: 0.4, BTC: 0.3, USDC: 0.3 },
 *   driftThreshold: 0.05,
 * });
 * ```
 */
export function createRebalancerStrategy(opts: RebalancerOpts = {}): IStrategy {
  const {
    targets = { ETH: 0.4, BTC: 0.3, USDC: 0.3 },
    driftThreshold = 0.05,
    maxPositionPct = 50,
    stopLossPct = -5,
    allowedChains = [1, 42161], // Ethereum mainnet + Arbitrum
  } = opts;

  const totalAllocation = Object.values(targets).reduce((sum, v) => sum + v, 0);

  const strategy: IStrategy = {
    id: "prebuilt-rebalancer-v1",
    name: "Portfolio Rebalancer",
    version: "1.0.0",
    description:
      "Automatically rebalances portfolio allocations when any asset drifts " +
      `beyond ${(driftThreshold * 100).toFixed(1)}% of its target weight.`,

    // ---- Triggers ---------------------------------------------------------
    // Fire when portfolio drift exceeds the threshold.
    triggers: [
      {
        type: TriggerType.PORTFOLIO_DRIFT,
        params: {
          driftThreshold,
          targets,
          totalAllocation,
        },
        description: `Trigger when drift exceeds ${(driftThreshold * 100).toFixed(1)}%`,
      },
    ],

    // ---- Actions ----------------------------------------------------------
    // Execute a rebalance across all target assets.
    actions: [
      {
        type: ActionType.REBALANCE,
        params: {
          targets,
          driftThreshold,
          slippageTolerance: 0.005, // 0.5%
        },
        chainId: allowedChains[0] ?? 1,
        protocol: "uniswap-v3",
      },
    ],

    // ---- Constraints -------------------------------------------------------
    constraints: {
      maxPositionPct,
      stopLossPct,
      maxDailyTrades: 12,
      maxSlippageBps: 50,
      allowedChains,
      allowedProtocols: ["uniswap-v3", "curve"],
    },

    // ---- Params ------------------------------------------------------------
    params: {
      targets,
      driftThreshold,
    },
  };

  return strategy;
}
