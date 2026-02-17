import { randomUUID } from "node:crypto";
import type pino from "pino";

import {
  AgentState,
  AgentConfigSchema,
  type AgentConfig,
  type IAgent,
} from "../types/agent.js";
import type { IStrategy } from "../types/strategy.js";
import type { MarketSnapshot, DecisionRecord } from "../types/memory.js";
import type { LLMRequest, LLMResponse } from "../types/llm.js";
import type { TxResult } from "../types/chain.js";
import { AgentError } from "./errors.js";
import { createLogger } from "./logger.js";
import { EventBus } from "./event-bus.js";
import {
  createAgentActor,
  snapshotToState,
  type AgentMachineSnapshot,
} from "./state-machine.js";

// ---------------------------------------------------------------------------
// Dependency interfaces — injected, not imported.
// ---------------------------------------------------------------------------

/** Reads chain data — balances, prices, positions. */
export interface ISenseProvider {
  gather(agentId: string, chainIds: number[]): Promise<MarketSnapshot>;
}

/** LLM reasoning — produces a decision based on context. */
export interface IThinkProvider {
  reason(request: LLMRequest): Promise<LLMResponse>;
}

/** Executes on-chain actions. */
export interface IActProvider {
  execute(
    action: string,
    params: Record<string, unknown>,
    chainId: number,
    dryRun: boolean,
  ): Promise<TxResult | null>;
}

/** Memory — stores and retrieves decision records. */
export interface IMemoryProvider {
  store(record: DecisionRecord): Promise<void>;
  getRecent(agentId: string, limit: number): Promise<DecisionRecord[]>;
}

export interface AgentDeps {
  eventBus: EventBus;
  sense: ISenseProvider;
  think: IThinkProvider;
  act: IActProvider;
  memory: IMemoryProvider;
}

// ---------------------------------------------------------------------------
// Agent
// ---------------------------------------------------------------------------

/**
 * Meridian Agent — the autonomous unit that executes the
 * Sense → Think → Act → Reflect decision cycle.
 *
 * Each agent wraps an xstate v5 actor for its lifecycle state machine.
 * External systems interact through the EventBus.
 */
export class Agent implements IAgent {
  readonly id: string;
  readonly config: AgentConfig;

  private actor;
  private log: pino.Logger;
  private bus: EventBus;
  private deps: AgentDeps;
  private strategy: IStrategy | null = null;
  private running = false;
  private cycleTimer: ReturnType<typeof setTimeout> | null = null;
  private _cycleCount = 0;

  // Per-cycle transient state.
  private currentSnapshot: MarketSnapshot | null = null;
  private currentDecision: { action: string; params: Record<string, unknown>; reasoning: string; chainId: number } | null = null;

  constructor(rawConfig: unknown, deps: AgentDeps) {
    this.config = AgentConfigSchema.parse(rawConfig);
    this.id = this.config.id ?? randomUUID();
    this.bus = deps.eventBus;
    this.deps = deps;
    this.log = createLogger({ agentId: this.id, module: "agent" });

    this.actor = createAgentActor(this.id);
    this.actor.start();

    this.log.info({ strategy: this.strategy?.name }, "Agent created");
  }

  // -----------------------------------------------------------------------
  // IAgent — state
  // -----------------------------------------------------------------------

  get state(): AgentState {
    return snapshotToState(this.actor.getSnapshot());
  }

  get cycles(): number {
    return this._cycleCount;
  }

  // -----------------------------------------------------------------------
  // Strategy
  // -----------------------------------------------------------------------

  /** Bind a strategy to this agent. Must be called before start(). */
  setStrategy(strategy: IStrategy): void {
    this.strategy = strategy;
    this.bus.emit("strategy:loaded", { agentId: this.id, strategy });
    this.log.info({ strategyId: strategy.id, name: strategy.name }, "Strategy loaded");
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /** Start the Sense-Think-Act-Reflect loop. */
  async start(): Promise<void> {
    if (this.running) return;
    if (!this.strategy) throw new AgentError("No strategy loaded", { code: "NO_STRATEGY" });

    this.running = true;
    this.actor.send({ type: "START" });
    this.log.info("Agent started");

    try {
      await this.loop();
    } catch (err) {
      this.handleFatalError(err);
    }
  }

  pause(): void {
    this.running = false;
    if (this.cycleTimer) {
      clearTimeout(this.cycleTimer);
      this.cycleTimer = null;
    }
    this.actor.send({ type: "PAUSE" });
    this.bus.emit("agent:paused", { agentId: this.id, reason: "manual" });
    this.log.info("Agent paused");
  }

  resume(): void {
    this.actor.send({ type: "RESUME" });
    this.running = true;
    this.bus.emit("agent:resumed", { agentId: this.id });
    this.log.info("Agent resumed");
    this.loop().catch((err) => this.handleFatalError(err));
  }

  async kill(): Promise<void> {
    this.running = false;
    if (this.cycleTimer) {
      clearTimeout(this.cycleTimer);
      this.cycleTimer = null;
    }
    this.actor.send({ type: "KILL" });
    this.bus.emit("agent:killed", { agentId: this.id });
    this.log.info("Agent killed");
  }

  // -----------------------------------------------------------------------
  // Core cycle phases
  // -----------------------------------------------------------------------

  /** Sense — read on-chain data. */
  async sense(): Promise<void> {
    this.log.debug("Sensing...");
    try {
      this.currentSnapshot = await this.deps.sense.gather(this.id, this.config.chains);
      this.actor.send({ type: "SENSE_COMPLETE" });
      this.bus.emit("market:snapshot", { snapshot: this.currentSnapshot });
    } catch (err) {
      this.transitionError(err, "sense");
      throw err;
    }
  }

  /** Think — call LLM to decide what to do. */
  async think(): Promise<void> {
    this.log.debug("Thinking...");
    try {
      const prompt = this.buildPrompt();
      const response = await this.deps.think.reason({
        prompt,
        systemPrompt: "You are a Meridian DeFi agent. Respond with valid JSON containing: action, params, reasoning, chainId.",
        maxTokens: 1024,
      });

      const parsed = JSON.parse(response.content) as {
        action: string;
        params: Record<string, unknown>;
        reasoning: string;
        chainId: number;
      };

      this.currentDecision = parsed;
      this.actor.send({ type: "THINK_COMPLETE" });
    } catch (err) {
      this.transitionError(err, "think");
      throw err;
    }
  }

  /** Act — execute the decided action on-chain. */
  async act(): Promise<void> {
    this.log.debug("Acting...");
    try {
      if (!this.currentDecision) {
        this.actor.send({ type: "ACT_COMPLETE" });
        return;
      }

      const { action, params, chainId } = this.currentDecision;
      const txResult = await this.deps.act.execute(action, params, chainId, this.config.dryRun);

      if (txResult) {
        this.bus.emit("agent:trade", { agentId: this.id, tx: txResult });
        this.log.info({ txHash: txResult.hash, action }, "Trade executed");
      }

      this.actor.send({ type: "ACT_COMPLETE" });
    } catch (err) {
      this.transitionError(err, "act");
      throw err;
    }
  }

  /** Reflect — evaluate the outcome, store the decision, learn. */
  async reflect(): Promise<void> {
    this.log.debug("Reflecting...");
    try {
      const record: DecisionRecord = {
        id: randomUUID(),
        agentId: this.id,
        timestamp: Date.now(),
        state: this.state,
        reasoning: this.currentDecision?.reasoning ?? "no decision",
        action: this.currentDecision?.action ?? "none",
        params: this.currentDecision?.params ?? {},
        chainId: this.currentDecision?.chainId ?? this.config.chains[0]!,
      };

      await this.deps.memory.store(record);
      this.bus.emit("agent:decision", { agentId: this.id, record });

      this._cycleCount++;
      this.actor.send({ type: "REFLECT_COMPLETE" });

      // Reset per-cycle state.
      this.currentSnapshot = null;
      this.currentDecision = null;
    } catch (err) {
      this.transitionError(err, "reflect");
      throw err;
    }
  }

  // -----------------------------------------------------------------------
  // Serialization — for crash recovery.
  // -----------------------------------------------------------------------

  /** Serialize the machine snapshot for checkpoint. */
  getSnapshot(): AgentMachineSnapshot {
    return this.actor.getSnapshot();
  }

  // -----------------------------------------------------------------------
  // Internals
  // -----------------------------------------------------------------------

  private async loop(): Promise<void> {
    while (this.running) {
      if (this.config.maxCycles > 0 && this._cycleCount >= this.config.maxCycles) {
        this.log.info({ maxCycles: this.config.maxCycles }, "Max cycles reached, pausing");
        this.pause();
        return;
      }

      const cycleStart = Date.now();

      try {
        await this.sense();
        await this.think();
        await this.act();
        await this.reflect();
      } catch {
        // Error already handled inside each phase — enter cooldown.
        await this.cooldown();
        continue;
      }

      const elapsed = Date.now() - cycleStart;
      this.bus.emit("agent:cycleComplete", {
        agentId: this.id,
        cycle: this._cycleCount,
        durationMs: elapsed,
      });

      this.log.info({ cycle: this._cycleCount, durationMs: elapsed }, "Cycle complete");

      // Wait for the next tick.
      if (this.running) {
        await this.sleep(this.config.tickIntervalMs);
      }
    }
  }

  private async cooldown(): Promise<void> {
    this.actor.send({ type: "COOLDOWN_COMPLETE" });
    this.log.info({ cooldownMs: this.config.cooldownMs }, "Entering cooldown");
    await this.sleep(this.config.cooldownMs);
    this.actor.send({ type: "START" });
    this.log.info("Cooldown complete, resuming");
  }

  private transitionError(err: unknown, phase: string): void {
    const error = err instanceof Error ? err : new Error(String(err));
    this.actor.send({ type: "ERROR", error: error.message });
    this.bus.emit("agent:error", {
      agentId: this.id,
      error,
      recoverable: true,
    });
    this.log.error({ err: error, phase }, "Phase error");
  }

  private handleFatalError(err: unknown): void {
    const error = err instanceof Error ? err : new Error(String(err));
    this.bus.emit("agent:error", {
      agentId: this.id,
      error,
      recoverable: false,
    });
    this.log.fatal({ err: error }, "Fatal agent error");
    this.running = false;
  }

  private buildPrompt(): string {
    const snapshot = this.currentSnapshot;
    const strategy = this.strategy;
    return [
      `Strategy: ${strategy?.name ?? "unknown"} — ${strategy?.description ?? ""}`,
      `Constraints: ${JSON.stringify(strategy?.constraints ?? {})}`,
      `Market snapshot: ${JSON.stringify(snapshot ?? {})}`,
      `Cycle: ${this._cycleCount}`,
      `Decide the next action. Return JSON: { action, params, reasoning, chainId }`,
    ].join("\n");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.cycleTimer = setTimeout(resolve, ms);
    });
  }
}
