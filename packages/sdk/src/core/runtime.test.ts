import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Runtime } from "./runtime.js";
import { EventBus } from "./event-bus.js";
import { AgentState, AgentCapability } from "../types/agent.js";
import type { ISenseProvider, IThinkProvider, IActProvider, IMemoryProvider } from "./agent.js";

// ---------------------------------------------------------------------------
// Mock providers
// ---------------------------------------------------------------------------

function mockSense(): ISenseProvider {
  return {
    gather: vi.fn().mockResolvedValue({
      timestamp: Date.now(),
      prices: { ETH: 3000 },
      balances: { ETH: "1.5" },
      positions: [],
      gasPerChain: { 1: 30 },
      blockNumbers: { 1: 12345678 },
    }),
  };
}

function mockThink(): IThinkProvider {
  return {
    reason: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        action: "SWAP",
        params: { tokenIn: "USDC", tokenOut: "ETH", amount: 100 },
        reasoning: "ETH undervalued",
        chainId: 1,
      }),
      model: "test",
      provider: "mock",
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      latencyMs: 200,
      cached: false,
    }),
  };
}

function mockAct(): IActProvider {
  return {
    execute: vi.fn().mockResolvedValue({
      hash: "0xabc",
      chainId: 1,
      status: "confirmed" as const,
    }),
  };
}

function mockMemory(): IMemoryProvider {
  return {
    store: vi.fn().mockResolvedValue(undefined),
    getRecent: vi.fn().mockResolvedValue([]),
  };
}

function agentConfig(overrides?: Record<string, unknown>) {
  return {
    name: "test-agent",
    capabilities: [AgentCapability.SWAP],
    chains: [1],
    tickIntervalMs: 10,
    maxCycles: 1,
    dryRun: true,
    cooldownMs: 10,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Runtime", () => {
  let runtime: Runtime;

  beforeEach(() => {
    runtime = new Runtime({ maxConcurrentAgents: 5 });
    runtime.start();
  });

  afterEach(async () => {
    await runtime.stop();
  });

  it("starts and stops cleanly", () => {
    expect(runtime.isRunning).toBe(true);
  });

  it("registers an agent", () => {
    const agent = runtime.registerAgent(agentConfig(), {
      sense: mockSense(),
      think: mockThink(),
      act: mockAct(),
      memory: mockMemory(),
    });

    expect(agent).toBeDefined();
    expect(agent.state).toBe(AgentState.IDLE);
    expect(runtime.agentCount).toBe(1);
    expect(runtime.agentIds).toContain(agent.id);
  });

  it("retrieves agent by id", () => {
    const agent = runtime.registerAgent(agentConfig(), {
      sense: mockSense(),
      think: mockThink(),
      act: mockAct(),
      memory: mockMemory(),
    });

    expect(runtime.getAgent(agent.id)).toBe(agent);
  });

  it("removes an agent", async () => {
    const agent = runtime.registerAgent(agentConfig(), {
      sense: mockSense(),
      think: mockThink(),
      act: mockAct(),
      memory: mockMemory(),
    });

    await runtime.removeAgent(agent.id);
    expect(runtime.agentCount).toBe(0);
    expect(runtime.getAgent(agent.id)).toBeUndefined();
  });

  it("enforces max concurrent agents", () => {
    const deps = {
      sense: mockSense(),
      think: mockThink(),
      act: mockAct(),
      memory: mockMemory(),
    };

    const smallRuntime = new Runtime({ maxConcurrentAgents: 2 });
    smallRuntime.start();

    smallRuntime.registerAgent(agentConfig({ name: "a1" }), deps);
    smallRuntime.registerAgent(agentConfig({ name: "a2" }), deps);

    expect(() => {
      smallRuntime.registerAgent(agentConfig({ name: "a3" }), deps);
    }).toThrow("Max concurrent agents");
  });

  it("emits runtime:agentRegistered event", () => {
    const handler = vi.fn();
    runtime.events.on("runtime:agentRegistered", handler);

    runtime.registerAgent(agentConfig(), {
      sense: mockSense(),
      think: mockThink(),
      act: mockAct(),
      memory: mockMemory(),
    });

    expect(handler).toHaveBeenCalledOnce();
  });

  it("emits runtime:started and runtime:stopped events", async () => {
    const r = new Runtime();
    const startHandler = vi.fn();
    const stopHandler = vi.fn();

    r.events.on("runtime:started", startHandler);
    r.events.on("runtime:stopped", stopHandler);

    r.start();
    expect(startHandler).toHaveBeenCalledOnce();

    await r.stop();
    expect(stopHandler).toHaveBeenCalledOnce();
  });

  it("kills all agents on stop", async () => {
    const deps = {
      sense: mockSense(),
      think: mockThink(),
      act: mockAct(),
      memory: mockMemory(),
    };

    runtime.registerAgent(agentConfig({ name: "a1" }), deps);
    runtime.registerAgent(agentConfig({ name: "a2" }), deps);

    expect(runtime.agentCount).toBe(2);
    await runtime.stop();
    expect(runtime.agentCount).toBe(0);
  });
});
