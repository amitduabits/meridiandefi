import { LRUCache } from "lru-cache";
import { LLMError } from "../core/errors.js";
import { createLogger } from "../core/logger.js";
import type { LLMRequest, LLMResponse, GatewayOpts } from "../types/llm.js";
import type { BaseProvider } from "./providers/base-provider.js";
import type pino from "pino";

/**
 * Unified LLM Gateway.
 *
 * - Provider priority chain with automatic fallback
 * - Request caching (LRU)
 * - Rate limiting (token bucket)
 * - Cost tracking
 */
export class LLMGateway {
  private providers = new Map<string, BaseProvider>();
  private fallbackChain: string[];
  private cache: LRUCache<string, LLMResponse>;
  private log: pino.Logger;
  private requestCount = 0;
  private lastRequestTime = 0;
  private minRequestIntervalMs: number;

  constructor(opts?: Partial<GatewayOpts>) {
    this.fallbackChain = opts?.fallbackChain ?? [];
    this.cache = new LRUCache<string, LLMResponse>({
      max: 200,
      ttl: opts?.cacheTtlMs ?? 5 * 60 * 1_000, // 5 minutes default
    });
    this.log = createLogger({ module: "llm-gateway" });

    const maxRpm = opts?.maxRequestsPerMinute ?? 60;
    this.minRequestIntervalMs = maxRpm > 0 ? 60_000 / maxRpm : 0;
  }

  /** Register a provider by its ID. */
  registerProvider(provider: BaseProvider): void {
    this.providers.set(provider.providerId, provider);
    this.log.info({ provider: provider.providerId }, "Provider registered");
  }

  /** Set the fallback chain (provider IDs in priority order). */
  setFallbackChain(chain: string[]): void {
    this.fallbackChain = chain;
  }

  /**
   * Complete a request. Tries providers in the fallback chain order.
   * Caches identical requests by prompt hash.
   */
  async complete(request: LLMRequest): Promise<LLMResponse> {
    // Check cache.
    const cacheKey = this.buildCacheKey(request);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.log.debug({ cacheKey }, "Cache hit");
      return { ...cached, cached: true };
    }

    // Rate limit.
    await this.rateLimit();

    // Try each provider in the fallback chain.
    const chain = this.fallbackChain.length > 0
      ? this.fallbackChain
      : [...this.providers.keys()];

    const errors: Error[] = [];

    for (const providerId of chain) {
      const provider = this.providers.get(providerId);
      if (!provider) {
        this.log.warn({ provider: providerId }, "Provider not found in registry, skipping");
        continue;
      }

      try {
        const response = await provider.complete(request);

        // Cache the response.
        this.cache.set(cacheKey, response);
        this.requestCount++;

        this.log.info({
          provider: providerId,
          model: response.model,
          latencyMs: response.latencyMs,
          tokens: response.usage.totalTokens,
        }, "LLM request completed");

        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        errors.push(error);
        this.log.warn({ provider: providerId, error: error.message }, "Provider failed, trying next");
      }
    }

    throw new LLMError("All providers in the fallback chain failed", {
      code: "LLM_ALL_PROVIDERS_FAILED",
      recoverable: false,
      context: { errors: errors.map((e) => e.message), chain },
    });
  }

  /** Get total requests made. */
  get totalRequests(): number {
    return this.requestCount;
  }

  /** Get cache stats. */
  get cacheSize(): number {
    return this.cache.size;
  }

  private buildCacheKey(request: LLMRequest): string {
    // Simple hash based on prompt + model + system prompt.
    const raw = `${request.prompt}|${request.model ?? ""}|${request.systemPrompt ?? ""}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return `llm:${hash}`;
  }

  private async rateLimit(): Promise<void> {
    if (this.minRequestIntervalMs <= 0) return;

    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minRequestIntervalMs) {
      await new Promise((r) => setTimeout(r, this.minRequestIntervalMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }
}
