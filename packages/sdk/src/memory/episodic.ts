// ---------------------------------------------------------------------------
// Episodic memory — PostgreSQL + TimescaleDB backed persistent store.
// ---------------------------------------------------------------------------

import { eq, desc, and, gte, lte } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type pino from "pino";
import { createLogger } from "../core/logger.js";
import type { DecisionRecord } from "../types/memory.js";
import * as schema from "./episodic-schema.js";

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IEpisodicMemory {
  recordDecision(record: DecisionRecord): Promise<void>;
  recordTransaction(tx: TransactionRecord): Promise<void>;
  recordPerformance(snapshot: PerformanceRecord): Promise<void>;
  queryDecisions(opts: DecisionQuery): Promise<DecisionRecord[]>;
  getPerformance(agentId: string, from?: Date, to?: Date): Promise<PerformanceRecord[]>;
  getRecentDecisions(agentId: string, limit?: number): Promise<DecisionRecord[]>;
}

export interface TransactionRecord {
  agentId: string;
  chainId: number;
  txHash: string;
  action: string;
  params: Record<string, unknown>;
  gasUsed?: number;
  gasCostUsd?: number;
  success: boolean;
  error?: string;
}

export interface PerformanceRecord {
  agentId: string;
  timestamp?: Date;
  portfolioValueUsd: number;
  pnlUsd: number;
  pnlPct: number;
  drawdownPct: number;
  positionCount: number;
  metadata?: Record<string, unknown>;
}

export interface DecisionQuery {
  agentId?: string;
  chainId?: number;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// PostgresEpisodicMemory
// ---------------------------------------------------------------------------

export class PostgresEpisodicMemory implements IEpisodicMemory {
  private readonly db: PostgresJsDatabase;
  private readonly log: pino.Logger;

  constructor(db: PostgresJsDatabase, logger?: pino.Logger) {
    this.db = db;
    this.log = logger ?? createLogger({ module: "episodic-memory" });
  }

  async recordDecision(record: DecisionRecord): Promise<void> {
    await this.db.insert(schema.decisions).values({
      id: record.id,
      agentId: record.agentId,
      timestamp: new Date(record.timestamp),
      state: record.state,
      reasoning: record.reasoning,
      action: record.action,
      params: record.params,
      outcome: record.outcome ?? null,
      reward: record.reward ?? null,
      learnings: record.learnings ?? null,
      chainId: record.chainId,
      txHash: record.txHash ?? null,
    });

    this.log.debug({ decisionId: record.id, agentId: record.agentId }, "Decision recorded");
  }

  async recordTransaction(tx: TransactionRecord): Promise<void> {
    await this.db.insert(schema.transactions).values({
      agentId: tx.agentId,
      chainId: tx.chainId,
      txHash: tx.txHash,
      action: tx.action,
      params: tx.params,
      gasUsed: tx.gasUsed ?? null,
      gasCostUsd: tx.gasCostUsd ?? null,
      success: tx.success,
      error: tx.error ?? null,
    });

    this.log.debug({ txHash: tx.txHash, agentId: tx.agentId }, "Transaction recorded");
  }

  async recordPerformance(snapshot: PerformanceRecord): Promise<void> {
    await this.db.insert(schema.performanceSnapshots).values({
      agentId: snapshot.agentId,
      timestamp: snapshot.timestamp ?? new Date(),
      portfolioValueUsd: snapshot.portfolioValueUsd,
      pnlUsd: snapshot.pnlUsd,
      pnlPct: snapshot.pnlPct,
      drawdownPct: snapshot.drawdownPct,
      positionCount: snapshot.positionCount,
      metadata: snapshot.metadata ?? null,
    });

    this.log.debug({ agentId: snapshot.agentId }, "Performance snapshot recorded");
  }

  async queryDecisions(opts: DecisionQuery): Promise<DecisionRecord[]> {
    const conditions = [];

    if (opts.agentId) {
      conditions.push(eq(schema.decisions.agentId, opts.agentId));
    }
    if (opts.chainId !== undefined) {
      conditions.push(eq(schema.decisions.chainId, opts.chainId));
    }
    if (opts.from) {
      conditions.push(gte(schema.decisions.timestamp, opts.from));
    }
    if (opts.to) {
      conditions.push(lte(schema.decisions.timestamp, opts.to));
    }

    const query = this.db
      .select()
      .from(schema.decisions)
      .orderBy(desc(schema.decisions.timestamp))
      .limit(opts.limit ?? 50)
      .offset(opts.offset ?? 0);

    const rows = conditions.length > 0
      ? await query.where(and(...conditions))
      : await query;

    return rows.map((row) => this.rowToDecision(row));
  }

  async getPerformance(
    agentId: string,
    from?: Date,
    to?: Date,
  ): Promise<PerformanceRecord[]> {
    const conditions = [eq(schema.performanceSnapshots.agentId, agentId)];

    if (from) {
      conditions.push(gte(schema.performanceSnapshots.timestamp, from));
    }
    if (to) {
      conditions.push(lte(schema.performanceSnapshots.timestamp, to));
    }

    const rows = await this.db
      .select()
      .from(schema.performanceSnapshots)
      .where(and(...conditions))
      .orderBy(desc(schema.performanceSnapshots.timestamp));

    return rows.map((row) => ({
      agentId: row.agentId,
      timestamp: row.timestamp,
      portfolioValueUsd: row.portfolioValueUsd,
      pnlUsd: row.pnlUsd,
      pnlPct: row.pnlPct,
      drawdownPct: row.drawdownPct,
      positionCount: row.positionCount,
      metadata: row.metadata ?? undefined,
    }));
  }

  async getRecentDecisions(agentId: string, limit = 10): Promise<DecisionRecord[]> {
    return this.queryDecisions({ agentId, limit });
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private rowToDecision(row: typeof schema.decisions.$inferSelect): DecisionRecord {
    return {
      id: row.id,
      agentId: row.agentId,
      timestamp: row.timestamp.getTime(),
      state: row.state,
      reasoning: row.reasoning,
      action: row.action,
      params: row.params,
      outcome: row.outcome ?? undefined,
      reward: row.reward ?? undefined,
      learnings: row.learnings ?? undefined,
      chainId: row.chainId,
      txHash: row.txHash ?? undefined,
    };
  }
}
