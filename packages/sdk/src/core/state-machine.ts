import { setup, createActor, type SnapshotFrom } from "xstate";
import { AgentState } from "../types/agent.js";

// ---------------------------------------------------------------------------
// Agent lifecycle state machine — xstate v5
//
//   IDLE → SENSING → THINKING → ACTING → REFLECTING → IDLE
//   ERROR → COOLDOWN → IDLE
//   PAUSED (reachable from any active state, resumes to IDLE)
// ---------------------------------------------------------------------------

/** Events the machine accepts. */
export type AgentMachineEvent =
  | { type: "START" }
  | { type: "SENSE_COMPLETE" }
  | { type: "THINK_COMPLETE" }
  | { type: "ACT_COMPLETE" }
  | { type: "REFLECT_COMPLETE" }
  | { type: "ERROR"; error: string }
  | { type: "COOLDOWN_COMPLETE" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "KILL" };

/** Context carried through the machine. */
export interface AgentMachineContext {
  agentId: string;
  cycleCount: number;
  lastError: string | null;
  startedAt: number | null;
}

/**
 * Create the agent lifecycle xstate machine definition.
 */
export const agentMachine = setup({
  types: {
    context: {} as AgentMachineContext,
    events: {} as AgentMachineEvent,
    input: {} as { agentId?: string },
  },
  actions: {
    incrementCycle: ({ context }) => {
      context.cycleCount += 1;
    },
    recordError: ({ context, event }) => {
      if (event.type === "ERROR") {
        context.lastError = event.error;
      }
    },
    clearError: ({ context }) => {
      context.lastError = null;
    },
    recordStart: ({ context }) => {
      context.startedAt = Date.now();
    },
  },
}).createMachine({
  id: "agentLifecycle",
  initial: AgentState.IDLE,
  context: ({ input }) => ({
    agentId: input?.agentId ?? "unknown",
    cycleCount: 0,
    lastError: null,
    startedAt: null,
  }),
  states: {
    [AgentState.IDLE]: {
      on: {
        START: {
          target: AgentState.SENSING,
          actions: ["recordStart"],
        },
        PAUSE: { target: AgentState.PAUSED },
        KILL: { target: "#agentLifecycle.final" },
      },
    },
    [AgentState.SENSING]: {
      on: {
        SENSE_COMPLETE: { target: AgentState.THINKING },
        ERROR: {
          target: AgentState.ERROR,
          actions: ["recordError"],
        },
        PAUSE: { target: AgentState.PAUSED },
        KILL: { target: "#agentLifecycle.final" },
      },
    },
    [AgentState.THINKING]: {
      on: {
        THINK_COMPLETE: { target: AgentState.ACTING },
        ERROR: {
          target: AgentState.ERROR,
          actions: ["recordError"],
        },
        PAUSE: { target: AgentState.PAUSED },
        KILL: { target: "#agentLifecycle.final" },
      },
    },
    [AgentState.ACTING]: {
      on: {
        ACT_COMPLETE: { target: AgentState.REFLECTING },
        ERROR: {
          target: AgentState.ERROR,
          actions: ["recordError"],
        },
        PAUSE: { target: AgentState.PAUSED },
        KILL: { target: "#agentLifecycle.final" },
      },
    },
    [AgentState.REFLECTING]: {
      on: {
        REFLECT_COMPLETE: {
          target: AgentState.IDLE,
          actions: ["incrementCycle"],
        },
        ERROR: {
          target: AgentState.ERROR,
          actions: ["recordError"],
        },
        PAUSE: { target: AgentState.PAUSED },
        KILL: { target: "#agentLifecycle.final" },
      },
    },
    [AgentState.ERROR]: {
      on: {
        COOLDOWN_COMPLETE: {
          target: AgentState.COOLDOWN,
        },
        KILL: { target: "#agentLifecycle.final" },
      },
    },
    [AgentState.COOLDOWN]: {
      on: {
        START: {
          target: AgentState.IDLE,
          actions: ["clearError"],
        },
        KILL: { target: "#agentLifecycle.final" },
      },
    },
    [AgentState.PAUSED]: {
      on: {
        RESUME: { target: AgentState.IDLE },
        KILL: { target: "#agentLifecycle.final" },
      },
    },
    final: {
      type: "final",
    },
  },
});

export type AgentMachine = typeof agentMachine;
export type AgentMachineSnapshot = SnapshotFrom<typeof agentMachine>;

/**
 * Create a running actor for the agent machine.
 * The actor can be inspected, sent events, and its snapshot serialized
 * for crash recovery.
 */
export function createAgentActor(agentId: string) {
  return createActor(agentMachine, {
    input: { agentId },
  });
}

/**
 * Extract the current AgentState string from a machine snapshot.
 */
export function snapshotToState(snapshot: AgentMachineSnapshot): AgentState {
  const value = snapshot.value as string;
  // Map the final state to IDLE for external consumers.
  if (value === "final") return AgentState.IDLE;
  return value as AgentState;
}
