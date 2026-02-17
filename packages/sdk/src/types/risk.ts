import { z } from "zod";

// ---------------------------------------------------------------------------
// Risk limits — configurable per agent.
// ---------------------------------------------------------------------------

export const RiskLimitsSchema = z.object({
  maxPositionSizeUsd: z.number().positive(),
  maxPortfolioExposurePct: z.number().min(0).max(100).default(100),
  maxSlippageBps: z.number().int().min(0).max(10_000).default(100),
  maxGasCostPct: z.number().min(0).max(100).default(1),
  maxDailyLossPct: z.number().min(0).max(100).default(10),
  maxDrawdownPct: z.number().min(0).max(100).default(20),
  maxOpenPositions: z.number().int().positive().default(20),
  maxDailyTrades: z.number().int().positive().default(50),
});

export type RiskLimits = z.infer<typeof RiskLimitsSchema>;

// ---------------------------------------------------------------------------
// Risk decision — the output of the pre-flight validator.
// ---------------------------------------------------------------------------

export interface RiskDecision {
  allowed: boolean;
  riskScore: number;
  reason: string;
  warnings: string[];
  modifications?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Circuit breaker
// ---------------------------------------------------------------------------

export const BreakerType = {
  PORTFOLIO_DRAWDOWN: "PORTFOLIO_DRAWDOWN",
  FLASH_CRASH: "FLASH_CRASH",
  GAS_SPIKE: "GAS_SPIKE",
  RPC_FAILURE: "RPC_FAILURE",
  ORACLE_STALE: "ORACLE_STALE",
  CONTRACT_ANOMALY: "CONTRACT_ANOMALY",
} as const;

export type BreakerType = (typeof BreakerType)[keyof typeof BreakerType];

export const CircuitBreakerStatus = {
  CLOSED: "CLOSED",
  OPEN: "OPEN",
  HALF_OPEN: "HALF_OPEN",
} as const;

export type CircuitBreakerStatus =
  (typeof CircuitBreakerStatus)[keyof typeof CircuitBreakerStatus];

export interface CircuitBreakerState {
  type: BreakerType;
  status: CircuitBreakerStatus;
  trippedAt?: number;
  cooldownUntil?: number;
  tripCount: number;
  lastError?: string;
}
