// ---------------------------------------------------------------------------
// Checkpoint — serialize/restore agent state for crash recovery.
// ---------------------------------------------------------------------------

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, desc } from "drizzle-orm";
import type pino from "pino";
import { createLogger } from "../core/logger.js";
import type { AgentStateSnapshot } from "../types/memory.js";
import * as schema from "./episodic-schema.js";
import type { IWorkingMemory } from "./working.js";

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface ICheckpointManager {
  save(snapshot: AgentStateSnapshot): Promise<void>;
  restore(agentId: string): Promise<AgentStateSnapshot | null>;
  list(agentId: string, limit?: number): Promise<AgentStateSnapshot[]>;
}

// ---------------------------------------------------------------------------
// PostgresCheckpointManager
// ---------------------------------------------------------------------------

export class PostgresCheckpointManager implements ICheckpointManager {
  private readonly db: PostgresJsDatabase;
  private readonly log: pino.Logger;

  constructor(db: PostgresJsDatabase, logger?: pino.Logger) {
    this.db = db;
    this.log = logger ?? createLogger({ module: "checkpoint-manager" });
  }

  /**
   * Save a checkpoint to PostgreSQL.
   */
  async save(snapshot: AgentStateSnapshot): Promise<void> {
    await this.db.insert(schema.agentCheckpoints).values({
      agentId: snapshot.agentId,
      timestamp: new Date(snapshot.timestamp),
      machineSnapshot: snapshot.machineSnapshot,
      workingMemory: snapshot.workingMemory,
      strategyId: snapshot.strategyId ?? null,
      cycleCount: snapshot.cycleCount,
    });

    this.log.info(
      { agentId: snapshot.agentId, cycleCount: snapshot.cycleCount },
      "Checkpoint saved",
    );
  }

  /**
   * Restore the latest checkpoint for an agent.
   */
  async restore(agentId: string): Promise<AgentStateSnapshot | null> {
    const rows = await this.db
      .select()
      .from(schema.agentCheckpoints)
      .where(eq(schema.agentCheckpoints.agentId, agentId))
      .orderBy(desc(schema.agentCheckpoints.timestamp))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    this.log.info(
      { agentId, cycleCount: row.cycleCount },
      "Checkpoint restored",
    );

    return {
      agentId: row.agentId,
      timestamp: row.timestamp.getTime(),
      machineSnapshot: row.machineSnapshot,
      workingMemory: row.workingMemory,
      strategyId: row.strategyId ?? undefined,
      cycleCount: row.cycleCount,
    };
  }

  /**
   * List recent checkpoints for an agent.
   */
  async list(agentId: string, limit = 10): Promise<AgentStateSnapshot[]> {
    const rows = await this.db
      .select()
      .from(schema.agentCheckpoints)
      .where(eq(schema.agentCheckpoints.agentId, agentId))
      .orderBy(desc(schema.agentCheckpoints.timestamp))
      .limit(limit);

    return rows.map((row) => ({
      agentId: row.agentId,
      timestamp: row.timestamp.getTime(),
      machineSnapshot: row.machineSnapshot,
      workingMemory: row.workingMemory,
      strategyId: row.strategyId ?? undefined,
      cycleCount: row.cycleCount,
    }));
  }
}

// ---------------------------------------------------------------------------
// Full checkpoint + restore with working memory rehydration.
// ---------------------------------------------------------------------------

/**
 * Create a full checkpoint: capture xstate snapshot + working memory keys.
 */
export async function createCheckpoint(
  agentId: string,
  machineSnapshot: unknown,
  workingMemory: IWorkingMemory,
  opts?: { strategyId?: string; cycleCount?: number },
): Promise<AgentStateSnapshot> {
  // Gather all working memory keys for this agent.
  const keys = await workingMemory.keys(`meridian:agent:${agentId}:*`);
  const memoryState: Record<string, unknown> = {};

  for (const key of keys) {
    const value = await workingMemory.get<unknown>(key);
    if (value !== null) {
      // Store with short key (strip the prefix).
      const shortKey = key.replace(`meridian:agent:${agentId}:`, "");
      memoryState[shortKey] = value;
    }
  }

  return {
    agentId,
    timestamp: Date.now(),
    machineSnapshot,
    workingMemory: memoryState,
    strategyId: opts?.strategyId,
    cycleCount: opts?.cycleCount ?? 0,
  };
}

/**
 * Restore working memory from a checkpoint snapshot.
 */
export async function restoreWorkingMemory(
  snapshot: AgentStateSnapshot,
  workingMemory: IWorkingMemory,
): Promise<void> {
  for (const [shortKey, value] of Object.entries(snapshot.workingMemory)) {
    const fullKey = `meridian:agent:${snapshot.agentId}:${shortKey}`;
    await workingMemory.set(fullKey, value);
  }
}
