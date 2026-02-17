import { EventEmitter } from "node:events";
import type { AgentState } from "../types/agent.js";
import type { IStrategy } from "../types/strategy.js";
import type { TxResult, PriceData } from "../types/chain.js";
import type { DecisionRecord, MarketSnapshot } from "../types/memory.js";
import type { RiskDecision, CircuitBreakerState } from "../types/risk.js";

// ---------------------------------------------------------------------------
// Event map — every event in the Meridian runtime is typed here.
// ---------------------------------------------------------------------------

export interface MeridianEventMap {
  "agent:stateChange": { agentId: string; from: AgentState; to: AgentState; timestamp: number };
  "agent:decision": { agentId: string; record: DecisionRecord };
  "agent:trade": { agentId: string; tx: TxResult };
  "agent:error": { agentId: string; error: Error; recoverable: boolean };
  "agent:paused": { agentId: string; reason: string };
  "agent:resumed": { agentId: string };
  "agent:killed": { agentId: string };
  "agent:cycleComplete": { agentId: string; cycle: number; durationMs: number };
  "risk:alert": { agentId: string; decision: RiskDecision };
  "risk:breakerTripped": { breaker: CircuitBreakerState };
  "risk:breakerReset": { breaker: CircuitBreakerState };
  "market:snapshot": { snapshot: MarketSnapshot };
  "market:priceUpdate": { price: PriceData };
  "strategy:loaded": { agentId: string; strategy: IStrategy };
  "runtime:started": Record<string, never>;
  "runtime:stopped": Record<string, never>;
  "runtime:agentRegistered": { agentId: string };
  "runtime:agentRemoved": { agentId: string };
}

export type MeridianEventName = keyof MeridianEventMap;

// ---------------------------------------------------------------------------
// Typed event bus — wraps Node's EventEmitter with type-safe emit/on.
// ---------------------------------------------------------------------------

/**
 * Typed event bus for the Meridian runtime.
 * All agent events, risk alerts, and runtime lifecycle events flow through here.
 */
export class EventBus {
  private emitter = new EventEmitter();

  constructor() {
    // Raise the default limit — an active system may have many listeners.
    this.emitter.setMaxListeners(100);
  }

  /** Subscribe to an event. Returns an unsubscribe function. */
  on<E extends MeridianEventName>(
    event: E,
    handler: (payload: MeridianEventMap[E]) => void | Promise<void>,
  ): () => void {
    this.emitter.on(event, handler as (...args: unknown[]) => void);
    return () => {
      this.emitter.off(event, handler as (...args: unknown[]) => void);
    };
  }

  /** Subscribe once. */
  once<E extends MeridianEventName>(
    event: E,
    handler: (payload: MeridianEventMap[E]) => void | Promise<void>,
  ): () => void {
    this.emitter.once(event, handler as (...args: unknown[]) => void);
    return () => {
      this.emitter.off(event, handler as (...args: unknown[]) => void);
    };
  }

  /** Emit an event. Handlers are invoked synchronously. */
  emit<E extends MeridianEventName>(event: E, payload: MeridianEventMap[E]): void {
    this.emitter.emit(event, payload);
  }

  /** Remove all listeners for a specific event, or all events. */
  removeAll(event?: MeridianEventName): void {
    if (event) {
      this.emitter.removeAllListeners(event);
    } else {
      this.emitter.removeAllListeners();
    }
  }

  listenerCount(event: MeridianEventName): number {
    return this.emitter.listenerCount(event);
  }
}
