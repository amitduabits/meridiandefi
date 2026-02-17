import type { AgentConfig } from "../types/agent.js";
import type { EventBus } from "./event-bus.js";

// ---------------------------------------------------------------------------
// Plugin interface
// ---------------------------------------------------------------------------

export interface IPlugin {
  readonly name: string;
  readonly version: string;

  /** Called when the plugin is installed into the runtime. */
  initialize(ctx: PluginContext): Promise<void>;

  /** Called when the runtime shuts down. */
  destroy(): Promise<void>;
}

export interface PluginContext {
  eventBus: EventBus;
  config: AgentConfig;
}

// ---------------------------------------------------------------------------
// Plugin registry — install, track, teardown.
// ---------------------------------------------------------------------------

export class PluginRegistry {
  private installed = new Map<string, IPlugin>();

  async register(plugin: IPlugin, ctx: PluginContext): Promise<void> {
    if (this.installed.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`);
    }
    await plugin.initialize(ctx);
    this.installed.set(plugin.name, plugin);
  }

  async destroyAll(): Promise<void> {
    const plugins = [...this.installed.values()].reverse();
    for (const plugin of plugins) {
      try {
        await plugin.destroy();
      } catch {
        // Swallow — teardown should not block shutdown.
      }
    }
    this.installed.clear();
  }

  has(name: string): boolean {
    return this.installed.has(name);
  }

  get size(): number {
    return this.installed.size;
  }

  get names(): string[] {
    return [...this.installed.keys()];
  }
}
