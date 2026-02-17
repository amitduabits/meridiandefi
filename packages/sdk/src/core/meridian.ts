import type { NLStrategyInput, IStrategy } from "../types/strategy.js";
import { Runtime } from "./runtime.js";
import { Agent, type AgentDeps } from "./agent.js";
import { createLogger } from "./logger.js";
import type pino from "pino";

// ---------------------------------------------------------------------------
// Meridian — the developer-facing framework entry point.
//
// Usage:
//   const meridian = new Meridian(config);
//   const agent = meridian.createAgent({ ... });
//   agent.setStrategy(await meridian.strategy.fromNaturalLanguage({ ... }));
//   await agent.start();
// ---------------------------------------------------------------------------

export interface MeridianConfig {
  /** Runtime config. */
  maxConcurrentAgents?: number;
}

/**
 * Meridian framework entry point.
 * Factory for agents, strategies, and runtime access.
 */
export class Meridian {
  private runtime: Runtime;
  private log: pino.Logger;

  /** Strategy factory namespace. */
  readonly strategy: StrategyFactory;

  constructor(config?: MeridianConfig) {
    this.runtime = new Runtime({
      maxConcurrentAgents: config?.maxConcurrentAgents,
    });
    this.log = createLogger({ module: "meridian" });
    this.strategy = new StrategyFactory();

    this.runtime.start();
    this.log.info("Meridian initialized");
  }

  /**
   * Create and register an agent.
   * The returned agent still needs a strategy before starting.
   */
  createAgent(rawConfig: unknown, deps: Omit<AgentDeps, "eventBus">): Agent {
    return this.runtime.registerAgent(rawConfig, deps);
  }

  /** Get the underlying runtime for advanced usage. */
  getRuntime(): Runtime {
    return this.runtime;
  }

  /** Graceful shutdown. */
  async shutdown(): Promise<void> {
    await this.runtime.stop();
    this.log.info("Meridian shut down");
  }
}

// ---------------------------------------------------------------------------
// Strategy factory — namespaced under `meridian.strategy.*`
// ---------------------------------------------------------------------------

class StrategyFactory {
  /**
   * Convert a natural-language description to an executable strategy.
   * In production this calls the LLM gateway. Stub for now — will be
   * implemented when the LLM layer is built.
   */
  async fromNaturalLanguage(_input: NLStrategyInput): Promise<IStrategy> {
    // TODO: Call LLM gateway with strategy-parser prompt.
    throw new Error("fromNaturalLanguage requires the LLM layer (build-llm-layer)");
  }

  /**
   * Parse a Meridian DSL string into a strategy.
   * Will be implemented when the strategy engine is built.
   */
  async fromDSL(_dsl: string): Promise<IStrategy> {
    throw new Error("fromDSL requires the strategy engine (build-strategy-engine)");
  }

  /**
   * Create a strategy from a programmatic definition.
   */
  fromCode(strategy: IStrategy): IStrategy {
    return strategy;
  }
}
