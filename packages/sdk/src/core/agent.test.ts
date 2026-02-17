import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Agent, type ISenseProvider, type IThinkProvider, type IActProvider, type IMemoryProvider } from "./agent.js";
import { EventBus } from "./event-bus.js";
import { AgentState, AgentCapability } from "../types/agent.js";
import type { IStrategy } from "../types/strategy.js";

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

function testStrategy(): IStrategy {
  return {
    id: "strat-1",
    name: "Test Strategy",
    version: "1.0.0",
    description: "Buy ETH when undervalued",
    triggers: [],
    actions: [],
    constraints: {
      maxPositionPct: 25,
      stopLossPct: -5,
      maxDailyTrades: 10,
      maxSlippageBps: 50,
    },
    params: {},
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

function createTestAgent(overrides?: Record<string, unknown>) {
  const bus = new EventBus();
  const deps = {
    eventBus: bus,
    sense: mockSense(),
    think: mockThink(),
    act: mockAct(),
    memory: mockMemory(),
  };
  const agent = new Agent(agentConfig(overrides), deps);
  agent.setStrategy(testStrategy());
  return { agent, bus, deps };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Agent", () => {
  it("creates with valid config", () => {
    const { agent } = createTestAgent();
    expect(agent.id).toBeDefined();
    expect(agent.config.name).toBe("test-agent");
    expect(agent.state).toBe(AgentState.IDLE);
  });

  it("rejects invalid config", () => {
    const bus = new EventBus();
    expect(() => {
      new Agent({ name: "" }, {
        eventBus: bus,
        sense: mockSense(),
        think: mockThink(),
        act: mockAct(),
        memory: mockMemory(),
      });
    }).toThrow();
  });

  it("throws when starting without a strategy", async () => {
    const bus = new EventBus();
    const agent = new Agent(agentConfig(), {
      eventBus: bus,
      sense: mockSense(),
      think: mockThink(),
      act: mockAct(),
      memory: mockMemory(),
    });

    await expect(agent.start()).rejects.toThrow("No strategy loaded");
  });

  it("runs a full Sense-Think-Act-Reflect cycle", async () => {
    const { agent, deps } = createTestAgent();

    await agent.start();

    // After maxCycles=1, agent should be paused.
    expect(deps.sense.gather).toHaveBeenCalled();
    expect(deps.think.reason).toHaveBeenCalled();
    expect(deps.act.execute).toHaveBeenCalled();
    expect(deps.memory.store).toHaveBeenCalled();
    expect(agent.cycles).toBe(1);
  });

  it("emits agent:trade event", async () => {
    const { agent, bus } = createTestAgent();

    const handler = vi.fn();
    bus.on("agent:trade", handler);

    await agent.start();

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].tx.hash).toBe("0xabc");
  });

  it("emits agent:decision event", async () => {
    const { agent, bus } = createTestAgent();

    const handler = vi.fn();
    bus.on("agent:decision", handler);

    await agent.start();

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].record.action).toBe("SWAP");
  });

  it("emits agent:cycleComplete event", async () => {
    const { agent, bus } = createTestAgent();

    const handler = vi.fn();
    bus.on("agent:cycleComplete", handler);

    await agent.start();

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].cycle).toBe(1);
    expect(handler.mock.calls[0][0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it("emits strategy:loaded event on setStrategy", () => {
    const bus = new EventBus();
    const agent = new Agent(agentConfig(), {
      eventBus: bus,
      sense: mockSense(),
      think: mockThink(),
      act: mockAct(),
      memory: mockMemory(),
    });

    const handler = vi.fn();
    bus.on("strategy:loaded", handler);

    agent.setStrategy(testStrategy());
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].strategy.name).toBe("Test Strategy");
  });

  it("can be paused", async () => {
    const { agent, bus } = createTestAgent({ maxCycles: 100, tickIntervalMs: 200 });

    const pauseHandler = vi.fn();
    bus.on("agent:paused", pauseHandler);

    // Pause the agent after the first cycle completes (during the tick sleep).
    bus.on("agent:cycleComplete", () => {
      agent.pause();
    });

    await agent.start();
    expect(pauseHandler).toHaveBeenCalled();
  });

  it("can be killed", async () => {
    const { agent, bus } = createTestAgent();

    const killHandler = vi.fn();
    bus.on("agent:killed", killHandler);

    await agent.kill();
    expect(killHandler).toHaveBeenCalledOnce();
  });

  it("handles sense errors gracefully", async () => {
    const bus = new EventBus();
    const sense = mockSense();
    (sense.gather as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("rpc down"));

    const agent = new Agent(agentConfig({ maxCycles: 2, cooldownMs: 10 }), {
      eventBus: bus,
      sense,
      think: mockThink(),
      act: mockAct(),
      memory: mockMemory(),
    });
    agent.setStrategy(testStrategy());

    const errorHandler = vi.fn();
    bus.on("agent:error", errorHandler);

    // Pause agent after first error to prevent infinite retry loop.
    bus.on("agent:error", () => {
      agent.pause();
    });

    await agent.start();

    expect(errorHandler).toHaveBeenCalled();
    expect(errorHandler.mock.calls[0][0].error.message).toBe("rpc down");
  });

  it("handles think errors gracefully", async () => {
    const bus = new EventBus();
    const think = mockThink();
    (think.reason as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("llm timeout"));

    const agent = new Agent(agentConfig({ maxCycles: 2, cooldownMs: 10 }), {
      eventBus: bus,
      sense: mockSense(),
      think,
      act: mockAct(),
      memory: mockMemory(),
    });
    agent.setStrategy(testStrategy());

    const errorHandler = vi.fn();
    bus.on("agent:error", errorHandler);

    // Pause agent after first error.
    bus.on("agent:error", () => {
      agent.pause();
    });

    await agent.start();

    expect(errorHandler).toHaveBeenCalled();
    expect(errorHandler.mock.calls[0][0].error.message).toBe("llm timeout");
  });

  it("respects dryRun config", async () => {
    const { agent, deps } = createTestAgent({ dryRun: true });

    await agent.start();

    // Act provider should receive dryRun=true.
    expect(deps.act.execute).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.any(Number),
      true,
    );
  });
});
