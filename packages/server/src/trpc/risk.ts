// ---------------------------------------------------------------------------
// Risk router
// ---------------------------------------------------------------------------

import { router, publicProcedure } from "./init.js";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

export interface MockCircuitBreaker {
  type: string;
  status: "CLOSED" | "OPEN" | "HALF_OPEN";
  trippedAt: number | null;
  cooldownUntil: number | null;
  tripCount: number;
  lastError: string | null;
}

const mockBreakers: MockCircuitBreaker[] = [
  {
    type: "PORTFOLIO_DRAWDOWN",
    status: "CLOSED",
    trippedAt: null,
    cooldownUntil: null,
    tripCount: 0,
    lastError: null,
  },
  {
    type: "FLASH_CRASH",
    status: "CLOSED",
    trippedAt: null,
    cooldownUntil: null,
    tripCount: 1,
    lastError: "ETH dropped 8% in 5 minutes on 2026-01-20",
  },
  {
    type: "GAS_SPIKE",
    status: "HALF_OPEN",
    trippedAt: Date.now() - 600_000,
    cooldownUntil: Date.now() + 300_000,
    tripCount: 3,
    lastError: "Ethereum gas > 200 gwei",
  },
  {
    type: "RPC_FAILURE",
    status: "CLOSED",
    trippedAt: null,
    cooldownUntil: null,
    tripCount: 0,
    lastError: null,
  },
  {
    type: "ORACLE_STALE",
    status: "CLOSED",
    trippedAt: null,
    cooldownUntil: null,
    tripCount: 2,
    lastError: "Chainlink ETH/USD price stale > 1h on 2026-02-05",
  },
  {
    type: "CONTRACT_ANOMALY",
    status: "CLOSED",
    trippedAt: null,
    cooldownUntil: null,
    tripCount: 0,
    lastError: null,
  },
];

export interface MockExposure {
  chainId: number;
  chainName: string;
  exposureUsd: number;
  exposurePct: number;
  protocols: Array<{ name: string; valueUsd: number; pct: number }>;
}

const totalPortfolioUsd = 118_000;

const mockExposure: MockExposure[] = [
  {
    chainId: 1,
    chainName: "Ethereum",
    exposureUsd: 92_500,
    exposurePct: (92_500 / totalPortfolioUsd) * 100,
    protocols: [
      { name: "Uniswap V3", valueUsd: 42_500, pct: (42_500 / totalPortfolioUsd) * 100 },
      { name: "Aave V3", valueUsd: 50_000, pct: (50_000 / totalPortfolioUsd) * 100 },
    ],
  },
  {
    chainId: 42161,
    chainName: "Arbitrum",
    exposureUsd: 25_500,
    exposurePct: (25_500 / totalPortfolioUsd) * 100,
    protocols: [
      { name: "Uniswap V3", valueUsd: 17_000, pct: (17_000 / totalPortfolioUsd) * 100 },
      { name: "Arbitrum Staking", valueUsd: 8_500, pct: (8_500 / totalPortfolioUsd) * 100 },
    ],
  },
];

export interface MockLimits {
  maxPositionSizeUsd: number;
  maxPortfolioExposurePct: number;
  maxSlippageBps: number;
  maxGasCostPct: number;
  maxDailyLossPct: number;
  maxDrawdownPct: number;
  maxOpenPositions: number;
  maxDailyTrades: number;
  /** Current utilisation of each limit. */
  utilisation: {
    dailyLossPct: number;
    drawdownPct: number;
    openPositions: number;
    dailyTrades: number;
  };
}

const mockLimits: MockLimits = {
  maxPositionSizeUsd: 25_000,
  maxPortfolioExposurePct: 100,
  maxSlippageBps: 100,
  maxGasCostPct: 1,
  maxDailyLossPct: 10,
  maxDrawdownPct: 20,
  maxOpenPositions: 20,
  maxDailyTrades: 50,
  utilisation: {
    dailyLossPct: 1.2,
    drawdownPct: 3.5,
    openPositions: 4,
    dailyTrades: 12,
  },
};

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const riskRouter = router({
  /** All circuit breaker statuses. */
  circuitBreakers: publicProcedure.query(() => {
    return mockBreakers;
  }),

  /** Portfolio exposure by chain and protocol. */
  exposure: publicProcedure.query(() => {
    return {
      totalValueUsd: totalPortfolioUsd,
      chains: mockExposure,
      updatedAt: new Date().toISOString(),
    };
  }),

  /** Current risk limits and their utilisation. */
  limits: publicProcedure.query(() => {
    return mockLimits;
  }),
});
