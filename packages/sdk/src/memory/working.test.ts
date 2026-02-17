import { describe, it, expect, beforeEach } from "vitest";
import RedisMock from "ioredis-mock";
import { RedisWorkingMemory } from "./working.js";
import type { MarketSnapshot } from "../types/memory.js";

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

describe("RedisWorkingMemory", () => {
  let redis: InstanceType<typeof RedisMock>;
  let memory: RedisWorkingMemory;

  beforeEach(() => {
    redis = new RedisMock();
    memory = new RedisWorkingMemory(redis as any, { defaultTtlMs: 0 });
  });

  // -----------------------------------------------------------------------
  // Basic get/set
  // -----------------------------------------------------------------------

  it("stores and retrieves a value", async () => {
    await memory.set("key1", { foo: "bar" });
    const result = await memory.get<{ foo: string }>("key1");
    expect(result).toEqual({ foo: "bar" });
  });

  it("returns null for missing key", async () => {
    const result = await memory.get("nonexistent");
    expect(result).toBeNull();
  });

  it("overwrites existing value", async () => {
    await memory.set("key1", "first");
    await memory.set("key1", "second");
    const result = await memory.get<string>("key1");
    expect(result).toBe("second");
  });

  it("deletes a key", async () => {
    await memory.set("key1", "value");
    await memory.del("key1");
    const result = await memory.get("key1");
    expect(result).toBeNull();
  });

  // -----------------------------------------------------------------------
  // TTL
  // -----------------------------------------------------------------------

  it("supports TTL via setWithTTL", async () => {
    await memory.setWithTTL("ttl-key", "value", 10_000);
    const result = await memory.get<string>("ttl-key");
    expect(result).toBe("value");
  });

  // -----------------------------------------------------------------------
  // Complex types
  // -----------------------------------------------------------------------

  it("stores and retrieves numbers", async () => {
    await memory.set("count", 42);
    const result = await memory.get<number>("count");
    expect(result).toBe(42);
  });

  it("stores and retrieves arrays", async () => {
    await memory.set("items", [1, 2, 3]);
    const result = await memory.get<number[]>("items");
    expect(result).toEqual([1, 2, 3]);
  });

  it("stores and retrieves nested objects", async () => {
    const obj = { a: { b: { c: "deep" } } };
    await memory.set("nested", obj);
    const result = await memory.get<typeof obj>("nested");
    expect(result).toEqual(obj);
  });

  // -----------------------------------------------------------------------
  // Market snapshot helpers
  // -----------------------------------------------------------------------

  it("stores and retrieves market snapshot", async () => {
    const snapshot: MarketSnapshot = {
      timestamp: Date.now(),
      prices: { ETH: 3000, BTC: 60000 },
      balances: { ETH: "1.5", USDC: "5000" },
      positions: [{ protocol: "aave", value: 1000 }],
      gasPerChain: { 1: 30, 42161: 0.1 },
      blockNumbers: { 1: 19000000, 42161: 180000000 },
    };

    await memory.setMarketSnapshot("agent-1", snapshot);
    const result = await memory.getMarketSnapshot("agent-1");
    expect(result).toEqual(snapshot);
  });

  it("returns null for missing market snapshot", async () => {
    const result = await memory.getMarketSnapshot("no-agent");
    expect(result).toBeNull();
  });

  // -----------------------------------------------------------------------
  // Positions helpers
  // -----------------------------------------------------------------------

  it("stores and retrieves active positions", async () => {
    const positions = [
      { token: "ETH", amount: "1.0", protocol: "uniswap" },
      { token: "USDC", amount: "5000", protocol: "aave" },
    ];

    await memory.setActivePositions("agent-1", positions);
    const result = await memory.getActivePositions("agent-1");
    expect(result).toEqual(positions);
  });

  it("returns empty array for missing positions", async () => {
    const result = await memory.getActivePositions("no-agent");
    expect(result).toEqual([]);
  });

  // -----------------------------------------------------------------------
  // Keys
  // -----------------------------------------------------------------------

  it("lists keys matching pattern", async () => {
    await memory.set("meridian:agent:a1:state", "idle");
    await memory.set("meridian:agent:a1:data", "test");
    await memory.set("meridian:agent:a2:state", "running");

    const keys = await memory.keys("meridian:agent:a1:*");
    expect(keys.sort()).toEqual([
      "meridian:agent:a1:data",
      "meridian:agent:a1:state",
    ]);
  });

  // -----------------------------------------------------------------------
  // Flush
  // -----------------------------------------------------------------------

  it("flushes all keys for an agent", async () => {
    await memory.set("meridian:agent:a1:state", "idle");
    await memory.set("meridian:agent:a1:data", "test");
    await memory.set("meridian:agent:a2:state", "running");

    await memory.flush("a1");

    expect(await memory.get("meridian:agent:a1:state")).toBeNull();
    expect(await memory.get("meridian:agent:a1:data")).toBeNull();
    // Other agent's data should be untouched.
    expect(await memory.get<string>("meridian:agent:a2:state")).toBe("running");
  });
});
