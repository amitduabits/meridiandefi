// ---------------------------------------------------------------------------
// RAG pipeline — combines semantic search with episodic memory to build
// context for LLM prompts.
// ---------------------------------------------------------------------------

import type pino from "pino";
import { createLogger } from "../core/logger.js";
import type { ISemanticMemory, SemanticSearchResult } from "./semantic.js";
import type { IEpisodicMemory } from "./episodic.js";
import type { DecisionRecord } from "../types/memory.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RAGContext {
  /** Formatted context string ready for LLM injection. */
  text: string;
  /** Number of tokens (estimated). */
  estimatedTokens: number;
  /** Source references used to build the context. */
  sources: RAGSource[];
}

export interface RAGSource {
  type: "semantic" | "episodic";
  id: string;
  score?: number;
  summary: string;
}

export interface RAGPipelineOpts {
  semanticMemory: ISemanticMemory;
  episodicMemory: IEpisodicMemory;
  logger?: pino.Logger;
  /** Characters per token estimate (default 4). */
  charsPerToken?: number;
}

// ---------------------------------------------------------------------------
// RAGPipeline
// ---------------------------------------------------------------------------

export class RAGPipeline {
  private readonly semantic: ISemanticMemory;
  private readonly episodic: IEpisodicMemory;
  private readonly log: pino.Logger;
  private readonly charsPerToken: number;

  constructor(opts: RAGPipelineOpts) {
    this.semantic = opts.semanticMemory;
    this.episodic = opts.episodicMemory;
    this.log = opts.logger ?? createLogger({ module: "rag-pipeline" });
    this.charsPerToken = opts.charsPerToken ?? 4;
  }

  /**
   * Build a context string for an LLM prompt.
   *
   * 1. Search semantic memory for relevant past knowledge.
   * 2. Fetch recent episodic decisions for the agent.
   * 3. Combine and format, respecting the token budget.
   */
  async buildContext(
    query: string,
    opts?: {
      agentId?: string;
      maxTokens?: number;
      semanticTopK?: number;
      episodicLimit?: number;
    },
  ): Promise<RAGContext> {
    const maxTokens = opts?.maxTokens ?? 2000;
    const maxChars = maxTokens * this.charsPerToken;
    const semanticTopK = opts?.semanticTopK ?? 5;
    const episodicLimit = opts?.episodicLimit ?? 10;

    // 1. Semantic search (long-term knowledge).
    let semanticResults: SemanticSearchResult[] = [];
    try {
      semanticResults = await this.semantic.search(query, semanticTopK);
    } catch (err) {
      this.log.warn({ err }, "Semantic search failed, continuing with episodic only");
    }

    // 2. Recent episodic decisions.
    let recentDecisions: DecisionRecord[] = [];
    if (opts?.agentId) {
      try {
        recentDecisions = await this.episodic.getRecentDecisions(
          opts.agentId,
          episodicLimit,
        );
      } catch (err) {
        this.log.warn({ err }, "Episodic query failed, continuing with semantic only");
      }
    }

    // 3. Build formatted context.
    const sources: RAGSource[] = [];
    const sections: string[] = [];
    let currentChars = 0;

    // Semantic section.
    if (semanticResults.length > 0) {
      const semanticSection = this.formatSemanticResults(semanticResults);
      if (currentChars + semanticSection.length <= maxChars) {
        sections.push(semanticSection);
        currentChars += semanticSection.length;
        for (const r of semanticResults) {
          sources.push({
            type: "semantic",
            id: r.id,
            score: r.score,
            summary: r.content.slice(0, 100),
          });
        }
      }
    }

    // Episodic section.
    if (recentDecisions.length > 0) {
      const episodicSection = this.formatEpisodicResults(recentDecisions);
      if (currentChars + episodicSection.length <= maxChars) {
        sections.push(episodicSection);
        currentChars += episodicSection.length;
        for (const d of recentDecisions) {
          sources.push({
            type: "episodic",
            id: d.id,
            summary: `${d.action}: ${d.reasoning.slice(0, 80)}`,
          });
        }
      } else {
        // Trim to fit budget.
        const available = maxChars - currentChars;
        if (available > 100) {
          sections.push(episodicSection.slice(0, available));
          currentChars += available;
        }
      }
    }

    const text = sections.length > 0
      ? sections.join("\n\n")
      : "No relevant context found.";

    const estimatedTokens = Math.ceil(text.length / this.charsPerToken);

    this.log.debug(
      {
        query: query.slice(0, 50),
        semanticHits: semanticResults.length,
        episodicHits: recentDecisions.length,
        estimatedTokens,
      },
      "RAG context built",
    );

    return { text, estimatedTokens, sources };
  }

  // -----------------------------------------------------------------------
  // Formatting helpers
  // -----------------------------------------------------------------------

  private formatSemanticResults(results: SemanticSearchResult[]): string {
    const lines = ["## Relevant Knowledge"];
    for (const r of results) {
      lines.push(`- [score=${r.score.toFixed(3)}] ${r.content}`);
    }
    return lines.join("\n");
  }

  private formatEpisodicResults(decisions: DecisionRecord[]): string {
    const lines = ["## Recent Decisions"];
    for (const d of decisions) {
      const ts = new Date(d.timestamp).toISOString();
      lines.push(
        `- [${ts}] ${d.action} on chain ${d.chainId}: ${d.reasoning.slice(0, 120)}` +
          (d.outcome ? ` → ${d.outcome}` : "") +
          (d.reward !== undefined ? ` (reward: ${d.reward})` : ""),
      );
    }
    return lines.join("\n");
  }
}
