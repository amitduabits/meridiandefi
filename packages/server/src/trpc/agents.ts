// ---------------------------------------------------------------------------
// Agent management router
// ---------------------------------------------------------------------------

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, authedProcedure } from "./init.js";

// ---------------------------------------------------------------------------
// Live DeFi agent health — fetched from the deployed agent service.
// ---------------------------------------------------------------------------

const AGENT_HEALTH_URL =
  process.env["AGENT_HEALTH_URL"] ??
  "https://meridiandefi-production-a045.up.railway.app/health";

interface AgentHealth {
  status: string;
  uptime: number;
  agentAddress: string;
  dryRun: boolean;
  cycles: number;
  trades: number;
  lastCycleAt: string | null;
  lastAction: string;
}

async function fetchAgentHealth(): Promise<AgentHealth | null> {
  try {
    const res = await fetch(AGENT_HEALTH_URL, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as AgentHealth;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Mock data — replaced by real service layer in production.
// ---------------------------------------------------------------------------

export interface MockAgent {
  id: string;
  name: string;
  state: "IDLE" | "SENSING" | "THINKING" | "ACTING" | "REFLECTING" | "PAUSED" | "ERROR" | "COOLDOWN";
  capabilities: string[];
  chains: number[];
  createdAt: string;
  cycleCount: number;
  pnlUsd: number;
  dryRun: boolean;
}

const mockAgents: MockAgent[] = [
  {
    id: "agent-001",
    name: "ETH/USDC Momentum",
    state: "SENSING",
    capabilities: ["SWAP", "MARKET_ANALYSIS"],
    chains: [1, 42161],
    createdAt: "2025-12-01T00:00:00Z",
    cycleCount: 1_842,
    pnlUsd: 2_340.50,
    dryRun: false,
  },
  {
    id: "agent-002",
    name: "Cross-chain Arb",
    state: "IDLE",
    capabilities: ["ARBITRAGE", "BRIDGE", "SWAP"],
    chains: [1, 42161, 8453, 10],
    createdAt: "2025-12-15T00:00:00Z",
    cycleCount: 567,
    pnlUsd: -120.30,
    dryRun: false,
  },
  {
    id: "agent-003",
    name: "LP Manager",
    state: "PAUSED",
    capabilities: ["PROVIDE_LIQUIDITY", "PORTFOLIO_MANAGEMENT"],
    chains: [42161],
    createdAt: "2026-01-03T00:00:00Z",
    cycleCount: 312,
    pnlUsd: 890.00,
    dryRun: true,
  },
];

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const agentsRouter = router({
  /**
   * Get the live DeFi agent status by proxying its health endpoint.
   * Falls back to null when the agent service is unreachable.
   */
  getActive: publicProcedure.query(async () => {
    const health = await fetchAgentHealth();
    if (!health) return null;

    return {
      id: "rebalancer-demo-001",
      name: "DeFi Portfolio Rebalancer",
      state: health.status === "ok" ? ("SENSING" as const) : ("ERROR" as const),
      capabilities: ["SWAP", "PORTFOLIO_MANAGEMENT"],
      chains: [421614],
      createdAt: new Date(Date.now() - health.uptime * 1_000).toISOString(),
      cycleCount: health.cycles,
      pnlUsd: 0,
      dryRun: health.dryRun,
      // Extra fields for the dashboard AgentStatus shape:
      wallet: health.agentAddress,
      totalTrades: health.trades,
      uptime: health.uptime,
      currentAllocation: {} as Record<string, number>,
      targetAllocation: {} as Record<string, number>,
      lastDecision:
        health.lastAction && health.lastAction !== "NONE"
          ? {
              action: health.lastAction,
              reasoning: "",
              timestamp: health.lastCycleAt
                ? new Date(health.lastCycleAt).getTime()
                : Date.now(),
            }
          : null,
    };
  }),

  /** List all agents. */
  list: publicProcedure.query(() => {
    return mockAgents;
  }),

  /** Get a single agent by ID. */
  get: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => {
      const agent = mockAgents.find((a) => a.id === input.id);
      if (!agent) {
        throw new TRPCError({ code: "NOT_FOUND", message: `Agent ${input.id} not found` });
      }
      return agent;
    }),

  /** Create a new agent. */
  create: authedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(128),
        capabilities: z.array(z.string()).min(1),
        chains: z.array(z.number().int().positive()).min(1),
        tickIntervalMs: z.number().int().positive().default(5_000),
        dryRun: z.boolean().default(false),
      }),
    )
    .mutation(({ input }) => {
      const id = `agent-${String(mockAgents.length + 1).padStart(3, "0")}`;
      const created: MockAgent = {
        id,
        name: input.name,
        state: "IDLE",
        capabilities: input.capabilities,
        chains: input.chains,
        createdAt: new Date().toISOString(),
        cycleCount: 0,
        pnlUsd: 0,
        dryRun: input.dryRun,
      };
      mockAgents.push(created);
      return created;
    }),

  /** Pause an agent. */
  pause: authedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(({ input }) => {
      const agent = mockAgents.find((a) => a.id === input.id);
      if (!agent) {
        throw new TRPCError({ code: "NOT_FOUND", message: `Agent ${input.id} not found` });
      }
      agent.state = "PAUSED";
      return { ok: true, id: agent.id, state: agent.state };
    }),

  /** Resume an agent from paused state. */
  resume: authedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(({ input }) => {
      const agent = mockAgents.find((a) => a.id === input.id);
      if (!agent) {
        throw new TRPCError({ code: "NOT_FOUND", message: `Agent ${input.id} not found` });
      }
      if (agent.state !== "PAUSED") {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Agent is not paused (state=${agent.state})` });
      }
      agent.state = "IDLE";
      return { ok: true, id: agent.id, state: agent.state };
    }),

  /** Kill an agent permanently. */
  kill: authedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(({ input }) => {
      const idx = mockAgents.findIndex((a) => a.id === input.id);
      if (idx === -1) {
        throw new TRPCError({ code: "NOT_FOUND", message: `Agent ${input.id} not found` });
      }
      mockAgents.splice(idx, 1);
      return { ok: true, id: input.id };
    }),
});
