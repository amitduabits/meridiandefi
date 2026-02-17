// ---------------------------------------------------------------------------
// LLM request / response — normalized across providers.
// ---------------------------------------------------------------------------

export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** Structured output: if provided, the LLM response is parsed against this. */
  responseSchema?: unknown;
  /** Arbitrary metadata for cost tracking and logging. */
  metadata?: Record<string, unknown>;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  /** Parsed structured output (if a responseSchema was provided). */
  parsed?: unknown;
  /** Whether this was served from cache. */
  cached: boolean;
}

// ---------------------------------------------------------------------------
// Streaming
// ---------------------------------------------------------------------------

export interface LLMChunk {
  content: string;
  done: boolean;
}

// ---------------------------------------------------------------------------
// Gateway options — configure the unified LLM gateway.
// ---------------------------------------------------------------------------

export interface GatewayOpts {
  /** Primary provider ID. */
  primary: string;
  /** Fallback chain — tried in order if primary fails. */
  fallbackChain: string[];
  /** Timeout per request in ms. */
  timeoutMs: number;
  /** Cache TTL in ms. 0 = no cache. */
  cacheTtlMs: number;
  /** Max requests per minute (rate limit). */
  maxRequestsPerMinute: number;
}
