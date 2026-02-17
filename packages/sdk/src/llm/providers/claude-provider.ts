import Anthropic from "@anthropic-ai/sdk";
import { BaseProvider } from "./base-provider.js";
import { LLMError } from "../../core/errors.js";
import type { LLMRequest, LLMResponse } from "../../types/llm.js";

export interface ClaudeProviderConfig {
  apiKey: string;
  model?: string;
  maxRetries?: number;
  timeoutMs?: number;
}

/**
 * Claude provider via @anthropic-ai/sdk.
 * Supports tool use, structured outputs via Zod, and streaming.
 */
export class ClaudeProvider extends BaseProvider {
  readonly providerId = "claude";
  private client: Anthropic;
  private defaultModel: string;

  constructor(config: ClaudeProviderConfig) {
    super({ maxRetries: config.maxRetries, timeoutMs: config.timeoutMs });
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.defaultModel = config.model ?? "claude-sonnet-4-20250514";
  }

  protected async doComplete(request: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();

    try {
      const response = await this.client.messages.create({
        model: request.model ?? this.defaultModel,
        max_tokens: request.maxTokens ?? 1024,
        system: request.systemPrompt ?? "",
        messages: [{ role: "user", content: request.prompt }],
        temperature: request.temperature,
      });

      const content = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("");

      return {
        content,
        model: response.model,
        provider: this.providerId,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        latencyMs: Date.now() - start,
        cached: false,
      };
    } catch (err) {
      throw new LLMError("Claude API call failed", {
        code: "CLAUDE_API_ERROR",
        recoverable: true,
        cause: err,
        context: { model: request.model ?? this.defaultModel },
      });
    }
  }
}
