import { z } from "zod";

// ---------------------------------------------------------------------------
// Triggers — what activates a strategy action.
// ---------------------------------------------------------------------------

export const TriggerType = {
  PRICE_ABOVE: "PRICE_ABOVE",
  PRICE_BELOW: "PRICE_BELOW",
  PRICE_CHANGE_PCT: "PRICE_CHANGE_PCT",
  INDICATOR: "INDICATOR",
  TIME_INTERVAL: "TIME_INTERVAL",
  PORTFOLIO_DRIFT: "PORTFOLIO_DRIFT",
  GAS_BELOW: "GAS_BELOW",
  CUSTOM: "CUSTOM",
} as const;

export type TriggerType = (typeof TriggerType)[keyof typeof TriggerType];

export interface Trigger {
  type: TriggerType;
  params: Record<string, unknown>;
  description?: string;
}

// ---------------------------------------------------------------------------
// Actions — what the agent does when a trigger fires.
// ---------------------------------------------------------------------------

export const ActionType = {
  SWAP: "SWAP",
  ADD_LIQUIDITY: "ADD_LIQUIDITY",
  REMOVE_LIQUIDITY: "REMOVE_LIQUIDITY",
  BORROW: "BORROW",
  REPAY: "REPAY",
  STAKE: "STAKE",
  UNSTAKE: "UNSTAKE",
  BRIDGE: "BRIDGE",
  NOTIFY: "NOTIFY",
  REBALANCE: "REBALANCE",
  CUSTOM: "CUSTOM",
} as const;

export type ActionType = (typeof ActionType)[keyof typeof ActionType];

export interface Action {
  type: ActionType;
  params: Record<string, unknown>;
  chainId: number;
  protocol?: string;
}

// ---------------------------------------------------------------------------
// Strategy constraints — hard limits enforced by the risk module.
// ---------------------------------------------------------------------------

export const StrategyConstraintsSchema = z.object({
  maxPositionPct: z.number().min(0).max(100).default(25),
  stopLossPct: z.number().min(-100).max(0).default(-5),
  takeProfitPct: z.number().min(0).max(1000).optional(),
  maxDailyTrades: z.number().int().positive().default(10),
  maxSlippageBps: z.number().int().min(0).max(10_000).default(50),
  allowedChains: z.array(z.number().int().positive()).optional(),
  allowedProtocols: z.array(z.string()).optional(),
});

export type StrategyConstraints = z.infer<typeof StrategyConstraintsSchema>;

// ---------------------------------------------------------------------------
// Strategy interface — the executable strategy object.
// ---------------------------------------------------------------------------

export interface IStrategy {
  id: string;
  name: string;
  version: string;
  description: string;
  triggers: Trigger[];
  actions: Action[];
  constraints: StrategyConstraints;
  params: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Natural-language strategy input — what the user provides.
// ---------------------------------------------------------------------------

export const NLStrategyInputSchema = z.object({
  description: z.string().min(1),
  riskTolerance: z.enum(["conservative", "moderate", "aggressive"]).default("moderate"),
  budget: z.object({
    token: z.string().min(1),
    amount: z.number().positive(),
  }),
  chains: z.array(z.string().min(1)).min(1),
});

export type NLStrategyInput = z.infer<typeof NLStrategyInputSchema>;
