// ---------------------------------------------------------------------------
// Portfolio router
// ---------------------------------------------------------------------------

import { z } from "zod";
import { router, publicProcedure } from "./init.js";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

export interface MockPosition {
  id: string;
  token: string;
  symbol: string;
  chainId: number;
  balance: string;
  valueUsd: number;
  positionType: "spot" | "lp" | "lent" | "borrowed" | "staked";
  protocol: string | null;
  entryPrice: number;
  currentPrice: number;
  pnlUsd: number;
  pnlPct: number;
}

const mockPositions: MockPosition[] = [
  {
    id: "pos-001",
    token: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    symbol: "WETH",
    chainId: 1,
    balance: "12.500000000000000000",
    valueUsd: 42_500.00,
    positionType: "spot",
    protocol: null,
    entryPrice: 3_200.00,
    currentPrice: 3_400.00,
    pnlUsd: 2_500.00,
    pnlPct: 6.25,
  },
  {
    id: "pos-002",
    token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    symbol: "USDC",
    chainId: 1,
    balance: "50000.000000",
    valueUsd: 50_000.00,
    positionType: "lent",
    protocol: "Aave V3",
    entryPrice: 1.00,
    currentPrice: 1.00,
    pnlUsd: 320.00,
    pnlPct: 0.64,
  },
  {
    id: "pos-003",
    token: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    symbol: "WETH",
    chainId: 42161,
    balance: "5.000000000000000000",
    valueUsd: 17_000.00,
    positionType: "lp",
    protocol: "Uniswap V3",
    entryPrice: 3_300.00,
    currentPrice: 3_400.00,
    pnlUsd: 500.00,
    pnlPct: 3.03,
  },
  {
    id: "pos-004",
    token: "0x912CE59144191C1204E64559FE8253a0e49E6548",
    symbol: "ARB",
    chainId: 42161,
    balance: "10000.000000000000000000",
    valueUsd: 8_500.00,
    positionType: "staked",
    protocol: "Arbitrum Staking",
    entryPrice: 0.95,
    currentPrice: 0.85,
    pnlUsd: -1_000.00,
    pnlPct: -10.53,
  },
];

function generateEquityCurve(days: number): Array<{ timestamp: number; valueUsd: number }> {
  const now = Date.now();
  const msPerDay = 86_400_000;
  const baseValue = 100_000;
  const points: Array<{ timestamp: number; valueUsd: number }> = [];

  for (let i = days; i >= 0; i--) {
    const drift = (days - i) * 30 + (Math.sin(i * 0.3) * 2_000);
    points.push({
      timestamp: now - i * msPerDay,
      valueUsd: baseValue + drift,
    });
  }
  return points;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const portfolioRouter = router({
  /** Total portfolio overview: aggregate value, position count. */
  overview: publicProcedure.query(() => {
    const totalValue = mockPositions.reduce((sum, p) => sum + p.valueUsd, 0);
    const totalPnl = mockPositions.reduce((sum, p) => sum + p.pnlUsd, 0);
    const chainBreakdown = mockPositions.reduce<Record<number, number>>(
      (acc, p) => {
        acc[p.chainId] = (acc[p.chainId] ?? 0) + p.valueUsd;
        return acc;
      },
      {},
    );

    return {
      totalValueUsd: totalValue,
      totalPnlUsd: totalPnl,
      totalPnlPct: (totalPnl / (totalValue - totalPnl)) * 100,
      positionCount: mockPositions.length,
      chainBreakdown,
      updatedAt: new Date().toISOString(),
    };
  }),

  /** All positions, optionally filtered by chain or type. */
  positions: publicProcedure
    .input(
      z.object({
        chainId: z.number().int().positive().optional(),
        positionType: z.enum(["spot", "lp", "lent", "borrowed", "staked"]).optional(),
      }).optional(),
    )
    .query(({ input }) => {
      let filtered = mockPositions;
      if (input?.chainId) {
        filtered = filtered.filter((p) => p.chainId === input.chainId);
      }
      if (input?.positionType) {
        filtered = filtered.filter((p) => p.positionType === input.positionType);
      }
      return filtered;
    }),

  /** Profit and loss data. */
  pnl: publicProcedure
    .input(
      z.object({
        period: z.enum(["1d", "7d", "30d", "90d", "all"]).default("30d"),
      }).optional(),
    )
    .query(({ input }) => {
      const period = input?.period ?? "30d";
      const realizedPnl = 3_120.50;
      const unrealizedPnl = mockPositions.reduce((s, p) => s + p.pnlUsd, 0);

      return {
        period,
        realizedPnlUsd: realizedPnl,
        unrealizedPnlUsd: unrealizedPnl,
        totalPnlUsd: realizedPnl + unrealizedPnl,
        winRate: 0.62,
        tradesCount: 47,
        bestTradeUsd: 1_200.00,
        worstTradeUsd: -450.00,
        sharpeRatio: 1.85,
        maxDrawdownPct: 8.2,
      };
    }),

  /** Equity curve data for chart rendering. */
  history: publicProcedure
    .input(
      z.object({
        days: z.number().int().min(1).max(365).default(30),
      }).optional(),
    )
    .query(({ input }) => {
      const days = input?.days ?? 30;
      return {
        points: generateEquityCurve(days),
        periodDays: days,
      };
    }),
});
