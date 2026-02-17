import { LLMError } from "../../core/errors.js";
import type { LLMRequest, LLMResponse } from "../../types/llm.js";

/**
 * Abstract LLM provider with built-in retry logic, timeout handling,
 * and error normalization.
 */
export abstract class BaseProvider {
  abstract readonly providerId: string;

  protected maxRetries: number;
  protected timeoutMs: number;
  private baseDelayMs: number;

  constructor(opts?: { maxRetries?: number; timeoutMs?: number; baseDelayMs?: number }) {
    this.maxRetries = opts?.maxRetries ?? 2;
    this.timeoutMs = opts?.timeoutMs ?? 30_000;
    this.baseDelayMs = opts?.baseDelayMs ?? 1_000;
  }

  /** Subclasses implement the actual API call here. */
  protected abstract doComplete(request: LLMRequest): Promise<LLMResponse>;

  /** Public entry point — retries, timeout, error normalization. */
  async complete(request: LLMRequest): Promise<LLMResponse> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.withTimeout(this.doComplete(request), this.timeoutMs);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (attempt < this.maxRetries) {
          const delay = this.baseDelayMs * 2 ** attempt;
          await this.sleep(delay);
        }
      }
    }

    throw new LLMError(`${this.providerId}: all retries exhausted`, {
      code: "LLM_RETRIES_EXHAUSTED",
      recoverable: false,
      cause: lastError,
      context: { provider: this.providerId, model: request.model },
    });
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new LLMError(`${this.providerId}: request timed out after ${ms}ms`, {
          code: "LLM_TIMEOUT",
          recoverable: true,
          context: { provider: this.providerId, timeoutMs: ms },
        }));
      }, ms);

      promise
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
