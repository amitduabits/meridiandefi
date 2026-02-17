// ---------------------------------------------------------------------------
// Meridian error hierarchy.
// Every error in the framework extends MeridianError so callers can catch
// at the granularity they need.
// ---------------------------------------------------------------------------

export class MeridianError extends Error {
  readonly code: string;
  readonly recoverable: boolean;
  readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    opts: { code: string; recoverable?: boolean; context?: Record<string, unknown>; cause?: unknown },
  ) {
    super(message, { cause: opts.cause });
    this.name = "MeridianError";
    this.code = opts.code;
    this.recoverable = opts.recoverable ?? false;
    this.context = opts.context;
  }
}

export class AgentError extends MeridianError {
  constructor(message: string, opts?: { code?: string; recoverable?: boolean; context?: Record<string, unknown>; cause?: unknown }) {
    super(message, { code: opts?.code ?? "AGENT_ERROR", recoverable: opts?.recoverable, context: opts?.context, cause: opts?.cause });
    this.name = "AgentError";
  }
}

export class ChainError extends MeridianError {
  constructor(message: string, opts?: { code?: string; recoverable?: boolean; context?: Record<string, unknown>; cause?: unknown }) {
    super(message, { code: opts?.code ?? "CHAIN_ERROR", recoverable: opts?.recoverable ?? true, context: opts?.context, cause: opts?.cause });
    this.name = "ChainError";
  }
}

export class LLMError extends MeridianError {
  constructor(message: string, opts?: { code?: string; recoverable?: boolean; context?: Record<string, unknown>; cause?: unknown }) {
    super(message, { code: opts?.code ?? "LLM_ERROR", recoverable: opts?.recoverable ?? true, context: opts?.context, cause: opts?.cause });
    this.name = "LLMError";
  }
}

export class RiskError extends MeridianError {
  constructor(message: string, opts?: { code?: string; recoverable?: boolean; context?: Record<string, unknown>; cause?: unknown }) {
    super(message, { code: opts?.code ?? "RISK_ERROR", recoverable: opts?.recoverable, context: opts?.context, cause: opts?.cause });
    this.name = "RiskError";
  }
}

export class StrategyError extends MeridianError {
  constructor(message: string, opts?: { code?: string; recoverable?: boolean; context?: Record<string, unknown>; cause?: unknown }) {
    super(message, { code: opts?.code ?? "STRATEGY_ERROR", recoverable: opts?.recoverable, context: opts?.context, cause: opts?.cause });
    this.name = "StrategyError";
  }
}
