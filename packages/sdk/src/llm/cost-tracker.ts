import type { LLMResponse } from "../types/llm.js";

// ---------------------------------------------------------------------------
// Per-token pricing (approximate USD per 1K tokens).
// ---------------------------------------------------------------------------

const PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-20250514": { input: 0.003, output: 0.015 },
  "claude-haiku-4-5-20251001": { input: 0.001, output: 0.005 },
  "gpt-4o": { input: 0.005, output: 0.015 },
  "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
  "llama3.1:8b": { input: 0, output: 0 },
  "mistral:7b": { input: 0, output: 0 },
};

interface CostEntry {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  timestamp: number;
}

/**
 * Non-blocking cost tracker for LLM usage.
 * Tracks per-provider, per-model costs. Fire-and-forget from the gateway.
 */
export class CostTracker {
  private entries: CostEntry[] = [];

  /** Record a completed LLM response. */
  record(response: LLMResponse): void {
    const pricing = PRICING[response.model] ?? { input: 0.005, output: 0.015 };
    const costUsd =
      (response.usage.promptTokens / 1000) * pricing.input +
      (response.usage.completionTokens / 1000) * pricing.output;

    this.entries.push({
      provider: response.provider,
      model: response.model,
      inputTokens: response.usage.promptTokens,
      outputTokens: response.usage.completionTokens,
      costUsd,
      timestamp: Date.now(),
    });
  }

  /** Total cost across all providers. */
  get totalCostUsd(): number {
    return this.entries.reduce((sum, e) => sum + e.costUsd, 0);
  }

  /** Total tokens used. */
  get totalTokens(): number {
    return this.entries.reduce((sum, e) => sum + e.inputTokens + e.outputTokens, 0);
  }

  /** Cost breakdown by provider. */
  byProvider(): Record<string, { costUsd: number; totalTokens: number; requests: number }> {
    const result: Record<string, { costUsd: number; totalTokens: number; requests: number }> = {};
    for (const entry of this.entries) {
      const key = entry.provider;
      if (!result[key]) {
        result[key] = { costUsd: 0, totalTokens: 0, requests: 0 };
      }
      result[key].costUsd += entry.costUsd;
      result[key].totalTokens += entry.inputTokens + entry.outputTokens;
      result[key].requests += 1;
    }
    return result;
  }

  /** Get the raw entries. */
  get history(): ReadonlyArray<CostEntry> {
    return this.entries;
  }

  /** Reset all tracked data. */
  reset(): void {
    this.entries = [];
  }
}
