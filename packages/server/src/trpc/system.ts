// ---------------------------------------------------------------------------
// System router — health, RPC status, LLM usage.
// ---------------------------------------------------------------------------

import { router, publicProcedure } from "./init.js";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

export interface RpcEndpointStatus {
  chainId: number;
  chainName: string;
  url: string;
  status: "healthy" | "degraded" | "down";
  latencyMs: number;
  blockNumber: number;
  lastChecked: string;
}

const mockRpcStatus: RpcEndpointStatus[] = [
  {
    chainId: 1,
    chainName: "Ethereum",
    url: "https://eth-mainnet.g.alchemy.com/v2/***",
    status: "healthy",
    latencyMs: 45,
    blockNumber: 19_500_100,
    lastChecked: new Date().toISOString(),
  },
  {
    chainId: 42161,
    chainName: "Arbitrum One",
    url: "https://arb-mainnet.g.alchemy.com/v2/***",
    status: "healthy",
    latencyMs: 32,
    blockNumber: 180_000_200,
    lastChecked: new Date().toISOString(),
  },
  {
    chainId: 8453,
    chainName: "Base",
    url: "https://base-mainnet.g.alchemy.com/v2/***",
    status: "degraded",
    latencyMs: 420,
    blockNumber: 10_200_300,
    lastChecked: new Date().toISOString(),
  },
  {
    chainId: 10,
    chainName: "Optimism",
    url: "https://opt-mainnet.g.alchemy.com/v2/***",
    status: "healthy",
    latencyMs: 38,
    blockNumber: 115_000_400,
    lastChecked: new Date().toISOString(),
  },
];

export interface LlmUsageData {
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requestCount: number;
  totalCostUsd: number;
  avgLatencyMs: number;
  period: string;
}

const mockLlmUsage: LlmUsageData[] = [
  {
    provider: "anthropic",
    model: "claude-sonnet-4-20250514",
    promptTokens: 1_245_000,
    completionTokens: 312_000,
    totalTokens: 1_557_000,
    requestCount: 842,
    totalCostUsd: 23.40,
    avgLatencyMs: 1_200,
    period: "24h",
  },
  {
    provider: "openai",
    model: "gpt-4o",
    promptTokens: 520_000,
    completionTokens: 98_000,
    totalTokens: 618_000,
    requestCount: 215,
    totalCostUsd: 9.80,
    avgLatencyMs: 800,
    period: "24h",
  },
  {
    provider: "ollama",
    model: "llama3.1:8b",
    promptTokens: 2_100_000,
    completionTokens: 420_000,
    totalTokens: 2_520_000,
    requestCount: 1_520,
    totalCostUsd: 0,
    avgLatencyMs: 350,
    period: "24h",
  },
];

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const systemRouter = router({
  /** Overall system health check. */
  health: publicProcedure.query(() => {
    const rpcHealthy = mockRpcStatus.filter((r) => r.status === "healthy").length;
    const rpcTotal = mockRpcStatus.length;

    return {
      status: rpcHealthy === rpcTotal ? "healthy" as const : "degraded" as const,
      version: "0.1.0",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      components: {
        rpc: { healthy: rpcHealthy, total: rpcTotal },
        agents: { active: 2, paused: 1, total: 3 },
        llm: { available: true, providers: 3 },
        memory: { redis: true, postgres: true, qdrant: true },
      },
    };
  }),

  /** Per-chain RPC endpoint status. */
  rpcStatus: publicProcedure.query(() => {
    return mockRpcStatus;
  }),

  /** LLM token usage and cost tracking. */
  llmUsage: publicProcedure.query(() => {
    const totalCost = mockLlmUsage.reduce((s, u) => s + u.totalCostUsd, 0);
    const totalTokens = mockLlmUsage.reduce((s, u) => s + u.totalTokens, 0);
    const totalRequests = mockLlmUsage.reduce((s, u) => s + u.requestCount, 0);

    return {
      providers: mockLlmUsage,
      totals: {
        costUsd: totalCost,
        tokens: totalTokens,
        requests: totalRequests,
      },
    };
  }),
});
