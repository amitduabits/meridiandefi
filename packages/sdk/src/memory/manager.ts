// ---------------------------------------------------------------------------
// MemoryManager — orchestrates all 3 memory tiers.
//
// Hot (Redis)  → Working memory, recent market data, active positions.
// Warm (PG)    → Episodic decisions, transactions, performance history.
// Cold (Qdrant)→ Semantic embeddings for long-term knowledge retrieval.
//
// Automatic promotion: hot→warm after decision cycles.
// Automatic embedding: warm→cold on schedule.
// ---------------------------------------------------------------------------

import type pino from "pino";
import { createLogger } from "../core/logger.js";
import type { IWorkingMemory } from "./working.js";
import type { IEpisodicMemory } from "./episodic.js";
import type { ISemanticMemory } from "./semantic.js";
import type { DecisionRecord, MarketSnapshot } from "../types/memory.js";
import { RAGPipeline } from "./rag.js";
import type { RAGContext } from "./rag.js";

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IMemoryManager {
  // Working memory (hot).
  getMarketSnapshot(agentId: string): Promise<MarketSnapshot | null>;
  setMarketSnapshot(agentId: string, snapshot: MarketSnapshot): Promise<void>;
  getWorkingValue<T>(key: string): Promise<T | null>;
  setWorkingValue<T>(key: string, value: T, ttlMs?: number): Promise<void>;

  // Episodic (warm).
  recordDecision(record: DecisionRecord): Promise<void>;
  getRecentDecisions(agentId: string, limit?: number): Promise<DecisionRecord[]>;

  // Semantic (cold) + RAG.
  storeKnowledge(content: string, metadata: Record<string, unknown>): Promise<string>;
  buildContext(query: string, opts?: { agentId?: string; maxTokens?: number }): Promise<RAGContext>;

  // Tier promotion.
  promoteDecision(record: DecisionRecord): Promise<void>;
}

// ---------------------------------------------------------------------------
// MemoryManagerConfig
// ---------------------------------------------------------------------------

export interface MemoryManagerConfig {
  working: IWorkingMemory;
  episodic: IEpisodicMemory;
  semantic: ISemanticMemory;
  logger?: pino.Logger;
  /** Whether to auto-embed decisions into semantic memory (default true). */
  autoEmbed?: boolean;
}

// ---------------------------------------------------------------------------
// MemoryManager
// ---------------------------------------------------------------------------

export class MemoryManager implements IMemoryManager {
  private readonly working: IWorkingMemory;
  private readonly episodic: IEpisodicMemory;
  private readonly semantic: ISemanticMemory;
  private readonly rag: RAGPipeline;
  private readonly log: pino.Logger;
  private readonly autoEmbed: boolean;

  constructor(config: MemoryManagerConfig) {
    this.working = config.working;
    this.episodic = config.episodic;
    this.semantic = config.semantic;
    this.autoEmbed = config.autoEmbed ?? true;
    this.log = config.logger ?? createLogger({ module: "memory-manager" });

    this.rag = new RAGPipeline({
      semanticMemory: this.semantic,
      episodicMemory: this.episodic,
      logger: this.log,
    });
  }

  // -----------------------------------------------------------------------
  // Working memory (hot tier)
  // -----------------------------------------------------------------------

  async getMarketSnapshot(agentId: string): Promise<MarketSnapshot | null> {
    return this.working.getMarketSnapshot(agentId);
  }

  async setMarketSnapshot(agentId: string, snapshot: MarketSnapshot): Promise<void> {
    await this.working.setMarketSnapshot(agentId, snapshot);
  }

  async getWorkingValue<T>(key: string): Promise<T | null> {
    return this.working.get<T>(key);
  }

  async setWorkingValue<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    if (ttlMs) {
      await this.working.setWithTTL(key, value, ttlMs);
    } else {
      await this.working.set(key, value);
    }
  }

  // -----------------------------------------------------------------------
  // Episodic memory (warm tier)
  // -----------------------------------------------------------------------

  async recordDecision(record: DecisionRecord): Promise<void> {
    await this.episodic.recordDecision(record);
    this.log.debug({ decisionId: record.id }, "Decision recorded to episodic memory");
  }

  async getRecentDecisions(agentId: string, limit = 10): Promise<DecisionRecord[]> {
    return this.episodic.getRecentDecisions(agentId, limit);
  }

  // -----------------------------------------------------------------------
  // Semantic memory (cold tier)
  // -----------------------------------------------------------------------

  async storeKnowledge(content: string, metadata: Record<string, unknown>): Promise<string> {
    return this.semantic.store(content, metadata);
  }

  // -----------------------------------------------------------------------
  // RAG context building
  // -----------------------------------------------------------------------

  async buildContext(
    query: string,
    opts?: { agentId?: string; maxTokens?: number },
  ): Promise<RAGContext> {
    return this.rag.buildContext(query, opts);
  }

  // -----------------------------------------------------------------------
  // Tier promotion
  // -----------------------------------------------------------------------

  /**
   * Promote a decision through all tiers:
   * 1. Record to episodic (warm).
   * 2. Embed into semantic (cold) if autoEmbed is enabled.
   */
  async promoteDecision(record: DecisionRecord): Promise<void> {
    // Hot → Warm: persist to episodic store.
    await this.episodic.recordDecision(record);

    // Warm → Cold: embed into semantic memory.
    if (this.autoEmbed) {
      try {
        const content = this.decisionToEmbeddingText(record);
        await this.semantic.store(content, {
          type: "decision",
          agentId: record.agentId,
          action: record.action,
          chainId: record.chainId,
          timestamp: record.timestamp,
          reward: record.reward,
        });
        this.log.debug(
          { decisionId: record.id },
          "Decision promoted: episodic → semantic",
        );
      } catch (err) {
        this.log.warn(
          { err, decisionId: record.id },
          "Failed to embed decision into semantic memory",
        );
      }
    }
  }

  // -----------------------------------------------------------------------
  // Accessors for sub-systems (testing, advanced usage).
  // -----------------------------------------------------------------------

  get workingMemory(): IWorkingMemory {
    return this.working;
  }

  get episodicMemory(): IEpisodicMemory {
    return this.episodic;
  }

  get semanticMemory(): ISemanticMemory {
    return this.semantic;
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private decisionToEmbeddingText(record: DecisionRecord): string {
    const parts = [
      `Action: ${record.action}`,
      `Reasoning: ${record.reasoning}`,
    ];
    if (record.outcome) parts.push(`Outcome: ${record.outcome}`);
    if (record.learnings && record.learnings.length > 0) {
      parts.push(`Learnings: ${record.learnings.join("; ")}`);
    }
    return parts.join(". ");
  }
}
