// ---------------------------------------------------------------------------
// Portfolio router
// ---------------------------------------------------------------------------

import { z } from "zod";
import { router, publicProcedure } from "./init.js";

// ---------------------------------------------------------------------------
// Live on-chain balance fetcher for Arbitrum Sepolia
// ---------------------------------------------------------------------------

const AGENT_WALLET = "0xf12Eebe60EC31c58A488FEE0F57D890C2bd4Bf8d";
const ARB_SEPOLIA_TOKENS = [
  { symbol: "ETH",  address: "0x0000000000000000000000000000000000000000", decimals: 18, targetPct: 0.40, priceUsd: 3_400 },
  { symbol: "USDC", address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d", decimals: 6,  targetPct: 0.30, priceUsd: 1.0 },
  { symbol: "WBTC", address: "0x3Ec3D2e3E86B664EB61F4bDcC1D7E2C5F4D4C6e2", decimals: 8,  targetPct: 0.30, priceUsd: 97_000 },
];

async function rpcCall(rpcUrl: string, method: string, params: unknown[]): Promise<string> {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`RPC error ${res.status}`);
  const data = await res.json() as { result?: string; error?: unknown };
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data.result ?? "0x0";
}

function hexToDecimal(hex: string, decimals: number): number {
  // Guard against empty hex from non-existent ERC-20 contracts on testnet.
  if (!hex || hex === "0x" || hex.length <= 2) return 0;
  try {
    const wei = BigInt(hex);
    const divisor = BigInt(10 ** Math.min(decimals, 18));
    return Number((wei * 10_000n) / divisor) / 10_000;
  } catch {
    return 0;
  }
}

async function fetchOnChainBalances(): Promise<Array<{
  symbol: string; balance: number; valueUsd: number; targetPct: number; priceUsd: number;
}> | null> {
  const rpcUrl = process.env["ARB_SEPOLIA_RPC_URL"] ?? process.env["RPC_URL"];
  if (!rpcUrl) return null;

  try {
    // allSettled so one missing/broken token doesn't abort the whole call
    const results = await Promise.allSettled(
      ARB_SEPOLIA_TOKENS.map(async (token) => {
        let rawBalance: string;
        if (token.address === "0x0000000000000000000000000000000000000000") {
          rawBalance = await rpcCall(rpcUrl, "eth_getBalance", [AGENT_WALLET, "latest"]);
        } else {
          // ERC-20 balanceOf(address)
          const calldata = `0x70a08231${AGENT_WALLET.slice(2).toLowerCase().padStart(64, "0")}`;
          rawBalance = await rpcCall(rpcUrl, "eth_call", [
            { to: token.address, data: calldata },
            "latest",
          ]);
        }
        const balance = hexToDecimal(rawBalance, token.decimals);
        return {
          symbol: token.symbol, balance,
          valueUsd: balance * token.priceUsd,
          targetPct: token.targetPct, priceUsd: token.priceUsd,
        };
      }),
    );
    return results.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : {
            symbol: ARB_SEPOLIA_TOKENS[i]!.symbol, balance: 0, valueUsd: 0,
            targetPct: ARB_SEPOLIA_TOKENS[i]!.targetPct,
            priceUsd: ARB_SEPOLIA_TOKENS[i]!.priceUsd,
          },
    );
  } catch {
    return null;
  }
}

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

  /**
   * Live on-chain token balances for the DeFi agent wallet on Arbitrum Sepolia.
   * Falls back to null when RPC is unavailable.
   */
  agentPositions: publicProcedure.query(async () => {
    const balances = await fetchOnChainBalances();
    if (!balances) return null;
    const totalValueUsd = balances.reduce((s, b) => s + b.valueUsd, 0);
    return {
      wallet: AGENT_WALLET,
      chainId: 421614,
      chainName: "Arbitrum Sepolia",
      totalValueUsd,
      tokens: balances.map((b) => ({
        symbol: b.symbol,
        balance: b.balance.toFixed(b.symbol === "ETH" ? 6 : b.symbol === "USDC" ? 2 : 8),
        valueUsd: b.valueUsd,
        allocationPct: totalValueUsd > 0 ? (b.valueUsd / totalValueUsd) * 100 : 0,
        targetPct: b.targetPct * 100,
        driftPct: totalValueUsd > 0 ? ((b.valueUsd / totalValueUsd) - b.targetPct) * 100 : 0,
        priceUsd: b.priceUsd,
      })),
      updatedAt: new Date().toISOString(),
    };
  }),
});
