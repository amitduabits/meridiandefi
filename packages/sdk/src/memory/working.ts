// ---------------------------------------------------------------------------
// Working memory — Redis 7+ backed hot cache for agent state.
// All operations target < 1ms latency.
// ---------------------------------------------------------------------------

import type { Redis } from "ioredis";
import type pino from "pino";
import { createLogger } from "../core/logger.js";
import type { MarketSnapshot } from "../types/memory.js";

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IWorkingMemory {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  setWithTTL<T>(key: string, value: T, ttlMs: number): Promise<void>;
  del(key: string): Promise<void>;
  getMarketSnapshot(agentId: string): Promise<MarketSnapshot | null>;
  setMarketSnapshot(agentId: string, snapshot: MarketSnapshot): Promise<void>;
  getActivePositions(agentId: string): Promise<Record<string, unknown>[]>;
  setActivePositions(agentId: string, positions: Record<string, unknown>[]): Promise<void>;
  keys(pattern: string): Promise<string[]>;
  flush(agentId: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Key helpers
// ---------------------------------------------------------------------------

function agentKey(agentId: string, suffix: string): string {
  return `meridian:agent:${agentId}:${suffix}`;
}

// ---------------------------------------------------------------------------
// RedisWorkingMemory
// ---------------------------------------------------------------------------

export class RedisWorkingMemory implements IWorkingMemory {
  private readonly redis: Redis;
  private readonly log: pino.Logger;
  private readonly defaultTtlMs: number;

  constructor(redis: Redis, opts?: { defaultTtlMs?: number; logger?: pino.Logger }) {
    this.redis = redis;
    this.defaultTtlMs = opts?.defaultTtlMs ?? 5 * 60_000; // 5 min default
    this.log = opts?.logger ?? createLogger({ module: "working-memory" });
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value);
    if (this.defaultTtlMs > 0) {
      await this.redis.set(key, serialized, "PX", this.defaultTtlMs);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  async setWithTTL<T>(key: string, value: T, ttlMs: number): Promise<void> {
    const serialized = JSON.stringify(value);
    await this.redis.set(key, serialized, "PX", ttlMs);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async getMarketSnapshot(agentId: string): Promise<MarketSnapshot | null> {
    return this.get<MarketSnapshot>(agentKey(agentId, "market-snapshot"));
  }

  async setMarketSnapshot(agentId: string, snapshot: MarketSnapshot): Promise<void> {
    await this.setWithTTL(agentKey(agentId, "market-snapshot"), snapshot, 60_000);
  }

  async getActivePositions(agentId: string): Promise<Record<string, unknown>[]> {
    const positions = await this.get<Record<string, unknown>[]>(agentKey(agentId, "positions"));
    return positions ?? [];
  }

  async setActivePositions(agentId: string, positions: Record<string, unknown>[]): Promise<void> {
    await this.set(agentKey(agentId, "positions"), positions);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.redis.keys(pattern);
  }

  async flush(agentId: string): Promise<void> {
    const prefix = `meridian:agent:${agentId}:*`;
    const keys = await this.redis.keys(prefix);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
    this.log.info({ agentId, keysDeleted: keys.length }, "Working memory flushed");
  }
}
