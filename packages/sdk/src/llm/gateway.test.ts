import { describe, it, expect, vi, beforeEach } from "vitest";
import { LLMGateway } from "./gateway.js";
import { BaseProvider } from "./providers/base-provider.js";
import type { LLMRequest, LLMResponse } from "../types/llm.js";

// ---------------------------------------------------------------------------
// Mock provider
// ---------------------------------------------------------------------------

function mockResponse(overrides?: Partial<LLMResponse>): LLMResponse {
  return {
    content: '{"action": "hold"}',
    model: "test-model",
    provider: "mock",
    usage: { promptTokens: 50, completionTokens: 20, totalTokens: 70 },
    latencyMs: 100,
    cached: false,
    ...overrides,
  };
}

class MockProvider extends BaseProvider {
  readonly providerId: string;
  private _doComplete: (request: LLMRequest) => Promise<LLMResponse>;

  constructor(id: string, impl?: (request: LLMRequest) => Promise<LLMResponse>) {
    super({ maxRetries: 0, timeoutMs: 5000 });
    this.providerId = id;
    this._doComplete = impl ?? (() => Promise.resolve(mockResponse({ provider: id })));
  }

  protected doComplete(request: LLMRequest): Promise<LLMResponse> {
    return this._doComplete(request);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LLMGateway", () => {
  let gateway: LLMGateway;

  beforeEach(() => {
    gateway = new LLMGateway({ cacheTtlMs: 60_000, maxRequestsPerMinute: 0 });
  });

  it("completes a request with a registered provider", async () => {
    gateway.registerProvider(new MockProvider("mock-a"));
    gateway.setFallbackChain(["mock-a"]);

    const response = await gateway.complete({ prompt: "test prompt" });
    expect(response.provider).toBe("mock-a");
    expect(response.content).toBe('{"action": "hold"}');
    expect(gateway.totalRequests).toBe(1);
  });

  it("falls back to second provider if first fails", async () => {
    const failingProvider = new MockProvider("primary", () => {
      throw new Error("primary down");
    });
    const backupProvider = new MockProvider("backup");

    gateway.registerProvider(failingProvider);
    gateway.registerProvider(backupProvider);
    gateway.setFallbackChain(["primary", "backup"]);

    const response = await gateway.complete({ prompt: "test" });
    expect(response.provider).toBe("backup");
  });

  it("throws when all providers fail", async () => {
    const p1 = new MockProvider("p1", () => { throw new Error("fail 1"); });
    const p2 = new MockProvider("p2", () => { throw new Error("fail 2"); });

    gateway.registerProvider(p1);
    gateway.registerProvider(p2);
    gateway.setFallbackChain(["p1", "p2"]);

    await expect(gateway.complete({ prompt: "test" })).rejects.toThrow("All providers");
  });

  it("caches identical requests", async () => {
    const provider = new MockProvider("cached");
    gateway.registerProvider(provider);
    gateway.setFallbackChain(["cached"]);

    await gateway.complete({ prompt: "same prompt" });
    const second = await gateway.complete({ prompt: "same prompt" });

    expect(second.cached).toBe(true);
    expect(gateway.cacheSize).toBe(1);
    // Only 1 actual request despite 2 calls.
    expect(gateway.totalRequests).toBe(1);
  });

  it("does not cache different requests", async () => {
    const provider = new MockProvider("nocache");
    gateway.registerProvider(provider);
    gateway.setFallbackChain(["nocache"]);

    await gateway.complete({ prompt: "prompt A" });
    await gateway.complete({ prompt: "prompt B" });

    expect(gateway.totalRequests).toBe(2);
    expect(gateway.cacheSize).toBe(2);
  });

  it("skips missing providers in fallback chain", async () => {
    const provider = new MockProvider("exists");
    gateway.registerProvider(provider);
    gateway.setFallbackChain(["missing", "exists"]);

    const response = await gateway.complete({ prompt: "test" });
    expect(response.provider).toBe("exists");
  });
});
