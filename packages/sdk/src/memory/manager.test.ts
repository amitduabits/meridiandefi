import { describe, it, expect, beforeEach, vi } from "vitest";
import RedisMock from "ioredis-mock";
import { RedisWorkingMemory } from "./working.js";
import { MemoryManager } from "./manager.js";
import type { IEpisodicMemory, TransactionRecord, PerformanceRecord, DecisionQuery } from "./episodic.js";
import type { ISemanticMemory, SemanticSearchResult } from "./semantic.js";
import type { DecisionRecord, MarketSnapshot } from "../types/memory.js";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

function createMockEpisodic(): IEpisodicMemory {
  const decisions: DecisionRecord[] = [];

  return {
    recordDecision: vi.fn(async (record: DecisionRecord) => {
      decisions.push(record);
    }),
    recordTransaction: vi.fn(async () => {}),
    recordPerformance: vi.fn(async () => {}),
    queryDecisions: vi.fn(async (opts: DecisionQuery) => {
      let result = [...decisions];
      if (opts.agentId) result = result.filter((d) => d.agentId === opts.agentId);
      return result.slice(0, opts.limit ?? 50);
    }),
    getPerformance: vi.fn(async () => []),
    getRecentDecisions: vi.fn(async (agentId: string, limit = 10) => {
      return decisions
        .filter((d) => d.agentId === agentId)
        .slice(0, limit);
    }),
  };
}

function createMockSemantic(): ISemanticMemory {
  const entries: Array<{ id: string; content: string; metadata: Record<string, unknown> }> = [];

  return {
    store: vi.fn(async (content: string, metadata: Record<string, unknown>) => {
      const id = `sem-${entries.length}`;
      entries.push({ id, content, metadata });
      return id;
    }),
    search: vi.fn(async (_query: string, topK = 5): Promise<SemanticSearchResult[]> => {
      return entries.slice(0, topK).map((e) => ({
        id: e.id,
        content: e.content,
        metadata: e.metadata,
        score: 0.9,
      }));
    }),
    searchSimilarDecisions: vi.fn(async (_context: string, topK = 5): Promise<SemanticSearchResult[]> => {
      return entries.slice(0, topK).map((e) => ({
        id: e.id,
        content: e.content,
        metadata: e.metadata,
        score: 0.85,
      }));
    }),
    delete: vi.fn(async () => {}),
    count: vi.fn(async () => entries.length),
  };
}

function makeDecision(overrides?: Partial<DecisionRecord>): DecisionRecord {
  return {
    id: crypto.randomUUID(),
    agentId: "agent-1",
    timestamp: Date.now(),
    state: "ACTING",
    reasoning: "Price trend is bullish, entering long position",
    action: "SWAP",
    params: { token: "ETH", amount: "1.0" },
    chainId: 42161,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MemoryManager", () => {
  let manager: MemoryManager;
  let mockEpisodic: IEpisodicMemory;
  let mockSemantic: ISemanticMemory;
  let redis: InstanceType<typeof RedisMock>;

  beforeEach(() => {
    redis = new RedisMock();
    const working = new RedisWorkingMemory(redis as any, { defaultTtlMs: 0 });
    mockEpisodic = createMockEpisodic();
    mockSemantic = createMockSemantic();

    manager = new MemoryManager({
      working,
      episodic: mockEpisodic,
      semantic: mockSemantic,
    });
  });

  // -----------------------------------------------------------------------
  // Working memory (hot tier)
  // -----------------------------------------------------------------------

  describe("working memory", () => {
    it("stores and retrieves market snapshot", async () => {
      const snapshot: MarketSnapshot = {
        timestamp: Date.now(),
        prices: { ETH: 3000 },
        balances: { ETH: "1.0" },
        positions: [],
        gasPerChain: { 42161: 0.1 },
        blockNumbers: { 42161: 180000000 },
      };

      await manager.setMarketSnapshot("agent-1", snapshot);
      const result = await manager.getMarketSnapshot("agent-1");
      expect(result).toEqual(snapshot);
    });

    it("stores and retrieves arbitrary working values", async () => {
      await manager.setWorkingValue("custom:key", { data: 42 });
      const result = await manager.getWorkingValue<{ data: number }>("custom:key");
      expect(result).toEqual({ data: 42 });
    });

    it("returns null for missing working value", async () => {
      const result = await manager.getWorkingValue("missing");
      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // Episodic memory (warm tier)
  // -----------------------------------------------------------------------

  describe("episodic memory", () => {
    it("records a decision", async () => {
      const decision = makeDecision();
      await manager.recordDecision(decision);
      expect(mockEpisodic.recordDecision).toHaveBeenCalledWith(decision);
    });

    it("retrieves recent decisions", async () => {
      const d1 = makeDecision({ id: "d1" });
      const d2 = makeDecision({ id: "d2" });
      await manager.recordDecision(d1);
      await manager.recordDecision(d2);

      const results = await manager.getRecentDecisions("agent-1", 10);
      expect(results.length).toBe(2);
    });
  });

  // -----------------------------------------------------------------------
  // Semantic memory (cold tier)
  // -----------------------------------------------------------------------

  describe("semantic memory", () => {
    it("stores knowledge", async () => {
      const id = await manager.storeKnowledge("ETH is bullish in Q1", {
        topic: "market",
      });
      expect(id).toBe("sem-0");
      expect(mockSemantic.store).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Tier promotion
  // -----------------------------------------------------------------------

  describe("tier promotion", () => {
    it("promotes decision to episodic + semantic", async () => {
      const decision = makeDecision({
        reasoning: "Bullish divergence detected",
        learnings: ["EMA crossover reliable"],
      });

      await manager.promoteDecision(decision);

      // Episodic recorded.
      expect(mockEpisodic.recordDecision).toHaveBeenCalledWith(decision);
      // Semantic stored.
      expect(mockSemantic.store).toHaveBeenCalled();
      const storeCall = (mockSemantic.store as any).mock.calls[0];
      expect(storeCall[0]).toContain("Bullish divergence detected");
      expect(storeCall[1].type).toBe("decision");
    });

    it("handles semantic failure gracefully", async () => {
      (mockSemantic.store as any).mockRejectedValueOnce(new Error("Qdrant down"));

      const decision = makeDecision();
      // Should not throw.
      await manager.promoteDecision(decision);

      // Episodic should still be recorded.
      expect(mockEpisodic.recordDecision).toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // RAG context building
  // -----------------------------------------------------------------------

  describe("RAG pipeline", () => {
    it("builds context combining semantic and episodic data", async () => {
      // Seed some data.
      await manager.storeKnowledge("Historical: ETH tends to rally in February", {
        topic: "seasonality",
      });
      const decision = makeDecision({
        reasoning: "February rally expected based on historical data",
      });
      await manager.recordDecision(decision);

      const context = await manager.buildContext("Should I buy ETH?", {
        agentId: "agent-1",
        maxTokens: 1000,
      });

      expect(context.text.length).toBeGreaterThan(0);
      expect(context.estimatedTokens).toBeGreaterThan(0);
      expect(context.sources.length).toBeGreaterThan(0);
    });

    it("returns fallback text when no data available", async () => {
      const context = await manager.buildContext("Random query", {
        agentId: "no-agent",
        maxTokens: 1000,
      });

      expect(context.text).toBeDefined();
      expect(context.estimatedTokens).toBeGreaterThan(0);
    });
  });

  // -----------------------------------------------------------------------
  // Sub-system access
  // -----------------------------------------------------------------------

  describe("sub-system access", () => {
    it("exposes working memory", () => {
      expect(manager.workingMemory).toBeDefined();
    });

    it("exposes episodic memory", () => {
      expect(manager.episodicMemory).toBeDefined();
    });

    it("exposes semantic memory", () => {
      expect(manager.semanticMemory).toBeDefined();
    });
  });
});
