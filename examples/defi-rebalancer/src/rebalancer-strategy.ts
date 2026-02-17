// ---------------------------------------------------------------------------
// Rebalancer Strategy — implements Meridian IStrategy for portfolio rebalancing.
// ---------------------------------------------------------------------------

import type { IStrategy } from "@meridian/sdk";
import { TriggerType, ActionType } from "@meridian/sdk";
import { config, TOKENS } from "./config.js";

/**
 * Build the rebalancer strategy object that can be loaded into a Meridian Agent.
 */
export function createRebalancerStrategy(): IStrategy {
  return {
    id: "defi-rebalancer-v1",
    name: "DeFi Portfolio Rebalancer",
    version: "1.0.0",
    description: [
      `Monitor portfolio on Arbitrum Sepolia.`,
      `Target allocation: ${TOKENS.map((t) => `${(t.targetPct * 100).toFixed(0)}% ${t.symbol}`).join(", ")}.`,
      `Rebalance when any token drifts more than ${(config.driftThreshold * 100).toFixed(0)}% from target.`,
      `Use Uniswap V3 for swaps. Max slippage ${config.maxSlippageBps}bps.`,
    ].join(" "),
    triggers: [
      {
        type: TriggerType.PORTFOLIO_DRIFT,
        params: {
          threshold: config.driftThreshold,
          tokens: TOKENS.map((t) => t.symbol),
          targets: Object.fromEntries(TOKENS.map((t) => [t.symbol, t.targetPct])),
        },
        description: `Trigger when any token drifts >${(config.driftThreshold * 100).toFixed(0)}% from target allocation`,
      },
      {
        type: TriggerType.TIME_INTERVAL,
        params: {
          intervalMs: config.tickIntervalSec * 1_000,
        },
        description: `Check portfolio every ${config.tickIntervalSec} seconds`,
      },
    ],
    actions: [
      {
        type: ActionType.REBALANCE,
        params: {
          protocol: "uniswap-v3",
          maxSlippageBps: config.maxSlippageBps,
          tokens: TOKENS.map((t) => ({
            symbol: t.symbol,
            address: t.address,
            targetPct: t.targetPct,
          })),
        },
        chainId: config.chainId,
        protocol: "uniswap-v3",
      },
    ],
    constraints: {
      maxPositionPct: 50,
      stopLossPct: -10,
      maxDailyTrades: 20,
      maxSlippageBps: config.maxSlippageBps,
      allowedChains: [config.chainId],
      allowedProtocols: ["uniswap-v3"],
    },
    params: {
      driftThreshold: config.driftThreshold,
      targetAllocations: Object.fromEntries(TOKENS.map((t) => [t.symbol, t.targetPct])),
    },
  };
}
