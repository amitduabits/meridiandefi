import { Ollama } from "ollama";
import { BaseProvider } from "./base-provider.js";
import { LLMError } from "../../core/errors.js";
import type { LLMRequest, LLMResponse } from "../../types/llm.js";

export interface OllamaProviderConfig {
  baseUrl?: string;
  model?: string;
  maxRetries?: number;
  timeoutMs?: number;
}

/**
 * Local model provider via Ollama.
 * Supports Llama 3.1, Mistral, Code Llama, etc.
 */
export class OllamaProvider extends BaseProvider {
  readonly providerId = "ollama";
  private client: Ollama;
  private defaultModel: string;

  constructor(config?: OllamaProviderConfig) {
    super({ maxRetries: config?.maxRetries ?? 1, timeoutMs: config?.timeoutMs ?? 60_000 });
    this.client = new Ollama({ host: config?.baseUrl ?? "http://localhost:11434" });
    this.defaultModel = config?.model ?? "llama3.1:8b";
  }

  protected async doComplete(request: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();

    try {
      const response = await this.client.chat({
        model: request.model ?? this.defaultModel,
        messages: [
          ...(request.systemPrompt ? [{ role: "system" as const, content: request.systemPrompt }] : []),
          { role: "user" as const, content: request.prompt },
        ],
        options: {
          temperature: request.temperature,
          num_predict: request.maxTokens,
        },
      });

      return {
        content: response.message.content,
        model: response.model,
        provider: this.providerId,
        usage: {
          promptTokens: response.prompt_eval_count ?? 0,
          completionTokens: response.eval_count ?? 0,
          totalTokens: (response.prompt_eval_count ?? 0) + (response.eval_count ?? 0),
        },
        latencyMs: Date.now() - start,
        cached: false,
      };
    } catch (err) {
      throw new LLMError("Ollama call failed — is the server running?", {
        code: "OLLAMA_ERROR",
        recoverable: true,
        cause: err,
        context: { model: request.model ?? this.defaultModel },
      });
    }
  }
}
