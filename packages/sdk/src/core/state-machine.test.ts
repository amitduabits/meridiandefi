import { describe, it, expect, beforeEach } from "vitest";
import { createAgentActor, snapshotToState } from "./state-machine.js";
import { AgentState } from "../types/agent.js";

describe("AgentStateMachine", () => {
  let actor: ReturnType<typeof createAgentActor>;

  beforeEach(() => {
    actor = createAgentActor("test-agent");
    actor.start();
  });

  it("starts in IDLE state", () => {
    expect(snapshotToState(actor.getSnapshot())).toBe(AgentState.IDLE);
  });

  it("follows the happy-path lifecycle: IDLE → SENSING → THINKING → ACTING → REFLECTING → IDLE", () => {
    actor.send({ type: "START" });
    expect(snapshotToState(actor.getSnapshot())).toBe(AgentState.SENSING);

    actor.send({ type: "SENSE_COMPLETE" });
    expect(snapshotToState(actor.getSnapshot())).toBe(AgentState.THINKING);

    actor.send({ type: "THINK_COMPLETE" });
    expect(snapshotToState(actor.getSnapshot())).toBe(AgentState.ACTING);

    actor.send({ type: "ACT_COMPLETE" });
    expect(snapshotToState(actor.getSnapshot())).toBe(AgentState.REFLECTING);

    actor.send({ type: "REFLECT_COMPLETE" });
    expect(snapshotToState(actor.getSnapshot())).toBe(AgentState.IDLE);
  });

  it("increments cycleCount after REFLECT_COMPLETE", () => {
    actor.send({ type: "START" });
    actor.send({ type: "SENSE_COMPLETE" });
    actor.send({ type: "THINK_COMPLETE" });
    actor.send({ type: "ACT_COMPLETE" });
    actor.send({ type: "REFLECT_COMPLETE" });

    expect(actor.getSnapshot().context.cycleCount).toBe(1);
  });

  it("transitions to ERROR on error during SENSING", () => {
    actor.send({ type: "START" });
    actor.send({ type: "ERROR", error: "rpc timeout" });

    expect(snapshotToState(actor.getSnapshot())).toBe(AgentState.ERROR);
    expect(actor.getSnapshot().context.lastError).toBe("rpc timeout");
  });

  it("transitions to ERROR on error during THINKING", () => {
    actor.send({ type: "START" });
    actor.send({ type: "SENSE_COMPLETE" });
    actor.send({ type: "ERROR", error: "llm timeout" });

    expect(snapshotToState(actor.getSnapshot())).toBe(AgentState.ERROR);
  });

  it("transitions to ERROR on error during ACTING", () => {
    actor.send({ type: "START" });
    actor.send({ type: "SENSE_COMPLETE" });
    actor.send({ type: "THINK_COMPLETE" });
    actor.send({ type: "ERROR", error: "tx reverted" });

    expect(snapshotToState(actor.getSnapshot())).toBe(AgentState.ERROR);
  });

  it("transitions to ERROR on error during REFLECTING", () => {
    actor.send({ type: "START" });
    actor.send({ type: "SENSE_COMPLETE" });
    actor.send({ type: "THINK_COMPLETE" });
    actor.send({ type: "ACT_COMPLETE" });
    actor.send({ type: "ERROR", error: "memory write failed" });

    expect(snapshotToState(actor.getSnapshot())).toBe(AgentState.ERROR);
  });

  it("recovers from ERROR via COOLDOWN → IDLE", () => {
    actor.send({ type: "START" });
    actor.send({ type: "ERROR", error: "test error" });
    expect(snapshotToState(actor.getSnapshot())).toBe(AgentState.ERROR);

    actor.send({ type: "COOLDOWN_COMPLETE" });
    expect(snapshotToState(actor.getSnapshot())).toBe(AgentState.COOLDOWN);

    actor.send({ type: "START" });
    expect(snapshotToState(actor.getSnapshot())).toBe(AgentState.IDLE);
    expect(actor.getSnapshot().context.lastError).toBeNull();
  });

  it("can be paused from IDLE", () => {
    actor.send({ type: "PAUSE" });
    expect(snapshotToState(actor.getSnapshot())).toBe(AgentState.PAUSED);
  });

  it("can be paused from SENSING", () => {
    actor.send({ type: "START" });
    actor.send({ type: "PAUSE" });
    expect(snapshotToState(actor.getSnapshot())).toBe(AgentState.PAUSED);
  });

  it("can be paused from THINKING", () => {
    actor.send({ type: "START" });
    actor.send({ type: "SENSE_COMPLETE" });
    actor.send({ type: "PAUSE" });
    expect(snapshotToState(actor.getSnapshot())).toBe(AgentState.PAUSED);
  });

  it("resumes from PAUSED to IDLE", () => {
    actor.send({ type: "PAUSE" });
    actor.send({ type: "RESUME" });
    expect(snapshotToState(actor.getSnapshot())).toBe(AgentState.IDLE);
  });

  it("can be killed from any state", () => {
    actor.send({ type: "KILL" });
    expect(actor.getSnapshot().status).toBe("done");
  });

  it("can be killed from SENSING", () => {
    actor.send({ type: "START" });
    actor.send({ type: "KILL" });
    expect(actor.getSnapshot().status).toBe("done");
  });

  it("can be killed from ERROR", () => {
    actor.send({ type: "START" });
    actor.send({ type: "ERROR", error: "fatal" });
    actor.send({ type: "KILL" });
    expect(actor.getSnapshot().status).toBe("done");
  });

  it("can be killed from PAUSED", () => {
    actor.send({ type: "PAUSE" });
    actor.send({ type: "KILL" });
    expect(actor.getSnapshot().status).toBe("done");
  });

  it("records startedAt on START", () => {
    const before = Date.now();
    actor.send({ type: "START" });
    const after = Date.now();

    const startedAt = actor.getSnapshot().context.startedAt!;
    expect(startedAt).toBeGreaterThanOrEqual(before);
    expect(startedAt).toBeLessThanOrEqual(after);
  });

  it("sets agentId from input", () => {
    expect(actor.getSnapshot().context.agentId).toBe("test-agent");
  });

  it("supports multiple full cycles", () => {
    for (let i = 0; i < 3; i++) {
      actor.send({ type: "START" });
      actor.send({ type: "SENSE_COMPLETE" });
      actor.send({ type: "THINK_COMPLETE" });
      actor.send({ type: "ACT_COMPLETE" });
      actor.send({ type: "REFLECT_COMPLETE" });
    }

    expect(snapshotToState(actor.getSnapshot())).toBe(AgentState.IDLE);
    expect(actor.getSnapshot().context.cycleCount).toBe(3);
  });
});
