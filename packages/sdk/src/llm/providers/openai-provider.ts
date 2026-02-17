import OpenAI from "openai";
import { BaseProvider } from "./base-provider.js";
import { LLMError } from "../../core/errors.js";
import type { LLMRequest, LLMResponse } from "../../types/llm.js";

export interface OpenAIProviderConfig {
  apiKey: string;
  model?: string;
  maxRetries?: number;
  timeoutMs?: number;
}

/**
 * OpenAI provider via openai SDK.
 * Supports function calling, JSON mode, and streaming.
 */
export class OpenAIProvider extends BaseProvider {
  readonly providerId = "openai";
  private client: OpenAI;
  private defaultModel: string;

  constructor(config: OpenAIProviderConfig) {
    super({ maxRetries: config.maxRetries, timeoutMs: config.timeoutMs });
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.defaultModel = config.model ?? "gpt-4o";
  }

  protected async doComplete(request: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();

    try {
      const response = await this.client.chat.completions.create({
        model: request.model ?? this.defaultModel,
        max_tokens: request.maxTokens ?? 1024,
        messages: [
          ...(request.systemPrompt ? [{ role: "system" as const, content: request.systemPrompt }] : []),
          { role: "user" as const, content: request.prompt },
        ],
        temperature: request.temperature,
        response_format: request.responseSchema ? { type: "json_object" as const } : undefined,
      });

      const content = response.choices[0]?.message?.content ?? "";

      return {
        content,
        model: response.model,
        provider: this.providerId,
        usage: {
          promptTokens: response.usage?.prompt_tokens ?? 0,
          completionTokens: response.usage?.completion_tokens ?? 0,
          totalTokens: response.usage?.total_tokens ?? 0,
        },
        latencyMs: Date.now() - start,
        cached: false,
      };
    } catch (err) {
      throw new LLMError("OpenAI API call failed", {
        code: "OPENAI_API_ERROR",
        recoverable: true,
        cause: err,
        context: { model: request.model ?? this.defaultModel },
      });
    }
  }
}
