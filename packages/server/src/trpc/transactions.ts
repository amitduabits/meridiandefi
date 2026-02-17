// ---------------------------------------------------------------------------
// Transaction router
// ---------------------------------------------------------------------------

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "./init.js";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

export interface MockTransaction {
  id: string;
  hash: string;
  chainId: number;
  agentId: string;
  type: "swap" | "addLiquidity" | "removeLiquidity" | "borrow" | "repay" | "stake" | "bridge";
  status: "pending" | "confirmed" | "failed";
  tokenIn: string;
  tokenOut: string | null;
  amountIn: string;
  amountOut: string | null;
  valueUsd: number;
  gasUsed: string | null;
  gasCostUsd: number | null;
  protocol: string;
  timestamp: string;
  blockNumber: number | null;
  description: string;
}

const mockTransactions: MockTransaction[] = [
  {
    id: "tx-001",
    hash: "0xabc123def456789012345678901234567890abcdef1234567890abcdef123456",
    chainId: 1,
    agentId: "agent-001",
    type: "swap",
    status: "confirmed",
    tokenIn: "WETH",
    tokenOut: "USDC",
    amountIn: "2.500000000000000000",
    amountOut: "8500.000000",
    valueUsd: 8_500.00,
    gasUsed: "185000",
    gasCostUsd: 12.30,
    protocol: "Uniswap V3",
    timestamp: "2026-02-12T14:30:00Z",
    blockNumber: 19_500_001,
    description: "Swap 2.5 WETH for 8,500 USDC on Uniswap V3",
  },
  {
    id: "tx-002",
    hash: "0xdef789abc012345678901234567890123456789012345678901234567890abcd",
    chainId: 42161,
    agentId: "agent-002",
    type: "swap",
    status: "confirmed",
    tokenIn: "USDC",
    tokenOut: "WETH",
    amountIn: "5000.000000",
    amountOut: "1.470000000000000000",
    valueUsd: 5_000.00,
    gasUsed: "320000",
    gasCostUsd: 0.45,
    protocol: "Uniswap V3",
    timestamp: "2026-02-12T15:00:00Z",
    blockNumber: 180_000_001,
    description: "Arbitrage: buy 1.47 WETH on Arbitrum",
  },
  {
    id: "tx-003",
    hash: "0x111222333444555666777888999000aaabbbcccdddeeefffaaa111222333444",
    chainId: 1,
    agentId: "agent-001",
    type: "swap",
    status: "pending",
    tokenIn: "USDC",
    tokenOut: "WETH",
    amountIn: "10000.000000",
    amountOut: null,
    valueUsd: 10_000.00,
    gasUsed: null,
    gasCostUsd: null,
    protocol: "Uniswap V3",
    timestamp: "2026-02-13T08:00:00Z",
    blockNumber: null,
    description: "Swap 10,000 USDC for WETH on Uniswap V3",
  },
  {
    id: "tx-004",
    hash: "0x555666777888999aaabbbcccdddeeefffaaa111222333444555666777888999a",
    chainId: 42161,
    agentId: "agent-003",
    type: "addLiquidity",
    status: "confirmed",
    tokenIn: "WETH/USDC",
    tokenOut: null,
    amountIn: "5.000000000000000000",
    amountOut: null,
    valueUsd: 17_000.00,
    gasUsed: "450000",
    gasCostUsd: 0.62,
    protocol: "Uniswap V3",
    timestamp: "2026-02-11T10:00:00Z",
    blockNumber: 179_500_000,
    description: "Add WETH/USDC liquidity on Uniswap V3 Arbitrum",
  },
  {
    id: "tx-005",
    hash: "0xeee111222333444555666777888999aaabbbcccdddeeefffaaa111222333444",
    chainId: 1,
    agentId: "agent-001",
    type: "swap",
    status: "failed",
    tokenIn: "WETH",
    tokenOut: "DAI",
    amountIn: "1.000000000000000000",
    amountOut: null,
    valueUsd: 3_400.00,
    gasUsed: "42000",
    gasCostUsd: 3.20,
    protocol: "Uniswap V3",
    timestamp: "2026-02-10T22:00:00Z",
    blockNumber: 19_490_000,
    description: "Failed: slippage exceeded on WETH->DAI swap",
  },
];

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const transactionsRouter = router({
  /** List transactions with optional filters. */
  list: publicProcedure
    .input(
      z.object({
        chainId: z.number().int().positive().optional(),
        agentId: z.string().optional(),
        status: z.enum(["pending", "confirmed", "failed"]).optional(),
        type: z.enum(["swap", "addLiquidity", "removeLiquidity", "borrow", "repay", "stake", "bridge"]).optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().nonnegative().default(0),
      }).optional(),
    )
    .query(({ input }) => {
      let filtered = mockTransactions;

      if (input?.chainId) {
        filtered = filtered.filter((t) => t.chainId === input.chainId);
      }
      if (input?.agentId) {
        filtered = filtered.filter((t) => t.agentId === input.agentId);
      }
      if (input?.status) {
        filtered = filtered.filter((t) => t.status === input.status);
      }
      if (input?.type) {
        filtered = filtered.filter((t) => t.type === input.type);
      }

      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;
      const paged = filtered.slice(offset, offset + limit);

      return {
        items: paged,
        total: filtered.length,
        limit,
        offset,
      };
    }),

  /** Get a single transaction by ID. */
  get: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => {
      const tx = mockTransactions.find((t) => t.id === input.id);
      if (!tx) {
        throw new TRPCError({ code: "NOT_FOUND", message: `Transaction ${input.id} not found` });
      }
      return tx;
    }),

  /** Full text search across transaction descriptions and hashes. */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(256),
        limit: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(({ input }) => {
      const q = input.query.toLowerCase();
      const results = mockTransactions.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.hash.toLowerCase().includes(q) ||
          t.tokenIn.toLowerCase().includes(q) ||
          (t.tokenOut?.toLowerCase().includes(q) ?? false) ||
          t.protocol.toLowerCase().includes(q),
      );
      return {
        items: results.slice(0, input.limit),
        total: results.length,
        query: input.query,
      };
    }),
});
