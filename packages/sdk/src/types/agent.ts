import { z } from "zod";

// ---------------------------------------------------------------------------
// Agent states — the xstate v5 machine uses these as state IDs.
// ---------------------------------------------------------------------------

export const AgentState = {
  IDLE: "IDLE",
  SENSING: "SENSING",
  THINKING: "THINKING",
  ACTING: "ACTING",
  REFLECTING: "REFLECTING",
  ERROR: "ERROR",
  COOLDOWN: "COOLDOWN",
  PAUSED: "PAUSED",
} as const;

export type AgentState = (typeof AgentState)[keyof typeof AgentState];

// ---------------------------------------------------------------------------
// Agent capabilities — what this agent can do, used for discovery.
// ---------------------------------------------------------------------------

export const AgentCapability = {
  SWAP: "SWAP",
  PROVIDE_LIQUIDITY: "PROVIDE_LIQUIDITY",
  LEND_BORROW: "LEND_BORROW",
  STAKE: "STAKE",
  BRIDGE: "BRIDGE",
  ARBITRAGE: "ARBITRAGE",
  MARKET_ANALYSIS: "MARKET_ANALYSIS",
  RISK_ASSESSMENT: "RISK_ASSESSMENT",
  PORTFOLIO_MANAGEMENT: "PORTFOLIO_MANAGEMENT",
} as const;

export type AgentCapability = (typeof AgentCapability)[keyof typeof AgentCapability];

// ---------------------------------------------------------------------------
// Agent configuration — validated at startup via zod.
// ---------------------------------------------------------------------------

export const AgentConfigSchema = z.object({
  /** Unique identifier for the agent. Auto-generated if omitted. */
  id: z.string().min(1).optional(),
  /** Human-readable agent name. */
  name: z.string().min(1),
  /** Agent capabilities — used for discovery by other agents. */
  capabilities: z.array(z.nativeEnum(AgentCapability)).min(1),
  /** Chains the agent operates on. */
  chains: z.array(z.number().int().positive()).min(1),
  /** Tick interval in ms for the main Sense-Think-Act-Reflect cycle. */
  tickIntervalMs: z.number().int().positive().default(5_000),
  /** Maximum cycles before auto-pause. 0 = unlimited. */
  maxCycles: z.number().int().nonnegative().default(0),
  /** Dry-run mode — no on-chain transactions. */
  dryRun: z.boolean().default(false),
  /** Cooldown duration in ms after an error before returning to IDLE. */
  cooldownMs: z.number().int().nonnegative().default(10_000),
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// ---------------------------------------------------------------------------
// Agent interface — the contract every agent must satisfy.
// ---------------------------------------------------------------------------

export interface IAgent {
  readonly id: string;
  readonly config: AgentConfig;
  readonly state: AgentState;

  /** Read chain data, prices, positions. */
  sense(): Promise<void>;

  /** Call LLM to reason about the current context and decide on actions. */
  think(): Promise<void>;

  /** Execute decided actions via chain connectors. */
  act(): Promise<void>;

  /** Evaluate outcomes, update memory, compute reward signal. */
  reflect(): Promise<void>;

  /** Pause the agent after the current step. */
  pause(): void;

  /** Resume from paused state. */
  resume(): void;

  /** Kill the agent — stop permanently and clean up. */
  kill(): Promise<void>;
}
