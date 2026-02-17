import type pino from "pino";

import type { AgentConfig } from "../types/agent.js";
import { EventBus } from "./event-bus.js";
import { Agent, type AgentDeps } from "./agent.js";
import { createLogger } from "./logger.js";
import { PluginRegistry, type IPlugin, type PluginContext } from "./plugin.js";

// ---------------------------------------------------------------------------
// Runtime — the top-level orchestrator that manages multiple agents.
// ---------------------------------------------------------------------------

export interface RuntimeConfig {
  /** Maximum number of agents that can run concurrently. */
  maxConcurrentAgents: number;
}

/**
 * The Meridian Runtime manages the lifecycle of all agents.
 * It provides:
 *   - Agent registration / removal
 *   - Shared event bus
 *   - Plugin management
 *   - Start / stop for the entire system
 */
export class Runtime {
  private agents = new Map<string, Agent>();
  private eventBus: EventBus;
  private plugins: PluginRegistry;
  private log: pino.Logger;
  private config: RuntimeConfig;
  private running = false;

  constructor(config?: Partial<RuntimeConfig>) {
    this.config = {
      maxConcurrentAgents: config?.maxConcurrentAgents ?? 10,
    };
    this.eventBus = new EventBus();
    this.plugins = new PluginRegistry();
    this.log = createLogger({ module: "runtime" });
  }

  // -----------------------------------------------------------------------
  // Agent management
  // -----------------------------------------------------------------------

  /**
   * Register and create an agent. Returns the agent instance.
   * Call `agent.setStrategy()` and then `agent.start()` to begin.
   */
  registerAgent(rawConfig: unknown, deps: Omit<AgentDeps, "eventBus">): Agent {
    if (this.agents.size >= this.config.maxConcurrentAgents) {
      throw new Error(
        `Max concurrent agents (${this.config.maxConcurrentAgents}) reached`,
      );
    }

    const agent = new Agent(rawConfig, { ...deps, eventBus: this.eventBus });
    this.agents.set(agent.id, agent);
    this.eventBus.emit("runtime:agentRegistered", { agentId: agent.id });
    this.log.info({ agentId: agent.id }, "Agent registered");
    return agent;
  }

  /** Remove an agent and kill it. */
  async removeAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    await agent.kill();
    this.agents.delete(agentId);
    this.eventBus.emit("runtime:agentRemoved", { agentId });
    this.log.info({ agentId }, "Agent removed");
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  get agentIds(): string[] {
    return [...this.agents.keys()];
  }

  get agentCount(): number {
    return this.agents.size;
  }

  // -----------------------------------------------------------------------
  // Plugin management
  // -----------------------------------------------------------------------

  async installPlugin(plugin: IPlugin, agentConfig: AgentConfig): Promise<void> {
    const ctx: PluginContext = {
      eventBus: this.eventBus,
      config: agentConfig,
    };
    await this.plugins.register(plugin, ctx);
    this.log.info({ plugin: plugin.name, version: plugin.version }, "Plugin installed");
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  start(): void {
    if (this.running) return;
    this.running = true;
    this.eventBus.emit("runtime:started", {});
    this.log.info("Runtime started");
  }

  async stop(): Promise<void> {
    this.running = false;

    // Kill all agents.
    const killPromises = [...this.agents.values()].map((a) => a.kill());
    await Promise.allSettled(killPromises);
    this.agents.clear();

    // Destroy plugins.
    await this.plugins.destroyAll();

    this.eventBus.emit("runtime:stopped", {});
    this.eventBus.removeAll();
    this.log.info("Runtime stopped");
  }

  get isRunning(): boolean {
    return this.running;
  }

  // -----------------------------------------------------------------------
  // Event bus pass-through.
  // -----------------------------------------------------------------------

  get events(): EventBus {
    return this.eventBus;
  }
}
