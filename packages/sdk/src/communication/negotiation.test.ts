// ---------------------------------------------------------------------------
// negotiation.test.ts — unit tests for NegotiationProtocol
// ---------------------------------------------------------------------------

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NegotiationProtocol } from "./negotiation.js";
import type { TaskProposal } from "./negotiation.js";
import type { AgentMessage } from "./messenger.js";

// ---------------------------------------------------------------------------
// Mock Messenger factory
// ---------------------------------------------------------------------------

interface MockMessenger {
  broadcast: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
  onMessage: ReturnType<typeof vi.fn>;
  subscribeToTopic: ReturnType<typeof vi.fn>;
  encodeMessage: ReturnType<typeof vi.fn>;
  decodeMessage: ReturnType<typeof vi.fn>;
  /** Internal: registered onMessage handlers */
  _handlers: Array<(msg: AgentMessage) => void>;
  /** Simulate delivering a message to all registered handlers. */
  _deliver(msg: AgentMessage): void;
  /** Capture all calls to send() and return the last call args. */
  _lastSentTo(): string;
  _lastSentPayload(): unknown;
}

function createMockMessenger(agentId: string): MockMessenger {
  const _handlers: Array<(msg: AgentMessage) => void> = [];
  const _sentMessages: Array<{ to: string; payload: unknown; type: string }> = [];

  function _deliver(msg: AgentMessage): void {
    for (const h of _handlers) h(msg);
  }

  function _lastSentTo(): string {
    const last = _sentMessages[_sentMessages.length - 1];
    return last?.to ?? "";
  }

  function _lastSentPayload(): unknown {
    const last = _sentMessages[_sentMessages.length - 1];
    return last?.payload ?? null;
  }

  const mock: MockMessenger = {
    _handlers,
    _deliver,
    _lastSentTo,
    _lastSentPayload,

    broadcast: vi.fn(async () => { /* noop */ }),

    send: vi.fn(async (to: string, payload: unknown, type: string) => {
      _sentMessages.push({ to, payload, type });
      // Simulate immediate loopback: if we find a negotiation protocol for `to`,
      // deliver the response. This is handled by the test itself.
    }),

    onMessage: vi.fn((handler: (msg: AgentMessage) => void) => {
      _handlers.push(handler);
    }),

    subscribeToTopic: vi.fn(),
    encodeMessage: vi.fn(),
    decodeMessage: vi.fn(),
  };

  void agentId;
  return mock;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProposal(overrides?: Partial<TaskProposal>): TaskProposal {
  return {
    taskId: "task-001",
    requiredCapability: "SWAP",
    description: "Swap 1 ETH for USDC",
    offeredPayment: BigInt("1000000000000000000"), // 1 ETH in wei
    deadline: Date.now() + 60_000, // 1 minute from now
    ...overrides,
  };
}

function buildResponseMsg(
  from: string,
  to: string,
  kind: "ACCEPT" | "REJECT" | "COUNTER",
  taskId: string,
  counterOffer?: bigint,
): AgentMessage {
  const payload: Record<string, unknown> = { kind, taskId };
  if (counterOffer !== undefined) {
    payload["counterOffer"] = counterOffer.toString();
  }
  return {
    id: `resp-${Date.now()}`,
    type: "TASK_RESPONSE",
    from,
    to,
    topic: `meridian/agent/${to}`,
    payload,
    timestamp: Date.now(),
  };
}

function buildProposalMsg(
  from: string,
  to: string,
  proposal: TaskProposal,
): AgentMessage {
  return {
    id: `prop-${Date.now()}`,
    type: "TASK_REQUEST",
    from,
    to,
    topic: `meridian/agent/${to}`,
    payload: {
      kind: "PROPOSAL",
      proposal: {
        taskId: proposal.taskId,
        requiredCapability: proposal.requiredCapability,
        description: proposal.description,
        offeredPayment: proposal.offeredPayment.toString(),
        deadline: proposal.deadline,
      },
    },
    timestamp: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("NegotiationProtocol", () => {
  let aliceMock: MockMessenger;
  let alice: NegotiationProtocol;

  beforeEach(() => {
    aliceMock = createMockMessenger("agent-alice");
    alice = new NegotiationProtocol(
      aliceMock as unknown as import("./messenger.js").Messenger,
      "agent-alice",
    );
  });

  // -------------------------------------------------------------------------
  // propose → AGREED
  // -------------------------------------------------------------------------

  describe("propose", () => {
    it("resolves AGREED when the counterpart accepts", async () => {
      const proposal = makeProposal();

      const resultPromise = alice.propose("agent-bob", proposal, 5_000);

      // Simulate Bob accepting immediately.
      const acceptMsg = buildResponseMsg("agent-bob", "agent-alice", "ACCEPT", proposal.taskId);
      aliceMock._deliver(acceptMsg);

      const result = await resultPromise;

      expect(result.state).toBe("AGREED");
      expect(result.taskId).toBe("task-001");
      expect(result.executorId).toBe("agent-bob");
      expect(result.agreedPayment).toBe(proposal.offeredPayment);
    });

    it("resolves REJECTED when the counterpart rejects", async () => {
      const proposal = makeProposal({ taskId: "task-002" });

      const resultPromise = alice.propose("agent-bob", proposal, 5_000);

      const rejectMsg = buildResponseMsg("agent-bob", "agent-alice", "REJECT", "task-002");
      aliceMock._deliver(rejectMsg);

      const result = await resultPromise;

      expect(result.state).toBe("REJECTED");
      expect(result.taskId).toBe("task-002");
      expect(result.agreedPayment).toBe(BigInt(0));
    });

    it("resolves AGREED with counter-offer amount when counterpart sends COUNTER", async () => {
      const proposal = makeProposal({ taskId: "task-003", offeredPayment: BigInt("1000000000000000000") });

      const resultPromise = alice.propose("agent-bob", proposal, 5_000);

      const counterOffer = BigInt("1500000000000000000"); // Bob wants 1.5 ETH
      const counterMsg = buildResponseMsg("agent-bob", "agent-alice", "COUNTER", "task-003", counterOffer);
      aliceMock._deliver(counterMsg);

      const result = await resultPromise;

      expect(result.state).toBe("AGREED");
      expect(result.agreedPayment).toBe(counterOffer);
    });

    it("resolves FAILED when task deadline has already passed", async () => {
      const expiredProposal = makeProposal({
        taskId: "task-expired",
        deadline: Date.now() - 1_000, // 1 second in the past
      });

      const result = await alice.propose("agent-bob", expiredProposal, 5_000);

      expect(result.state).toBe("FAILED");
      expect(result.agreedPayment).toBe(BigInt(0));
    });

    it("resolves FAILED when negotiation times out", async () => {
      const proposal = makeProposal({ taskId: "task-timeout" });

      // Use a very short timeout and never deliver a response.
      const result = await alice.propose("agent-bob", proposal, 50);

      expect(result.state).toBe("FAILED");
    });

    it("ignores responses for unknown task IDs (timed-out negotiations)", async () => {
      // Deliver a response for a task that was never proposed.
      const staleMsg = buildResponseMsg("agent-bob", "agent-alice", "ACCEPT", "task-never-proposed");

      // Should not throw.
      await expect(alice.handleIncoming(staleMsg)).resolves.toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // handleIncoming — acting as the executor (Bob)
  // -------------------------------------------------------------------------

  describe("handleIncoming", () => {
    it("calls the task request handler when a proposal arrives", async () => {
      const handler = vi.fn(async () => ({ accept: true }));
      alice.onTaskRequest(handler);

      const proposal = makeProposal({ taskId: "task-inbound" });
      const msg = buildProposalMsg("agent-charlie", "agent-alice", proposal);

      await alice.handleIncoming(msg);

      expect(handler).toHaveBeenCalledOnce();
      const [receivedProposal, fromId] = handler.mock.calls[0] as [TaskProposal, string];
      expect(receivedProposal.taskId).toBe("task-inbound");
      expect(fromId).toBe("agent-charlie");
    });

    it("sends ACCEPT when the handler accepts", async () => {
      alice.onTaskRequest(async () => ({ accept: true }));

      const proposal = makeProposal({ taskId: "task-accept" });
      const msg = buildProposalMsg("agent-charlie", "agent-alice", proposal);

      await alice.handleIncoming(msg);

      expect(aliceMock.send).toHaveBeenCalled();
      const lastPayload = aliceMock._lastSentPayload() as { kind: string; taskId: string };
      expect(lastPayload.kind).toBe("ACCEPT");
      expect(lastPayload.taskId).toBe("task-accept");
    });

    it("sends REJECT when the handler rejects", async () => {
      alice.onTaskRequest(async () => ({ accept: false }));

      const proposal = makeProposal({ taskId: "task-reject" });
      const msg = buildProposalMsg("agent-charlie", "agent-alice", proposal);

      await alice.handleIncoming(msg);

      const lastPayload = aliceMock._lastSentPayload() as { kind: string };
      expect(lastPayload.kind).toBe("REJECT");
    });

    it("sends COUNTER when the handler provides a counter-offer", async () => {
      const counterAmount = BigInt("2000000000000000000");
      alice.onTaskRequest(async () => ({ accept: false, counterOffer: counterAmount }));

      const proposal = makeProposal({ taskId: "task-counter" });
      const msg = buildProposalMsg("agent-charlie", "agent-alice", proposal);

      await alice.handleIncoming(msg);

      const lastPayload = aliceMock._lastSentPayload() as { kind: string; counterOffer: string };
      expect(lastPayload.kind).toBe("COUNTER");
      expect(BigInt(lastPayload.counterOffer)).toBe(counterAmount);
    });

    it("auto-rejects when no handler is registered", async () => {
      // No handler registered for alice.

      const proposal = makeProposal({ taskId: "task-no-handler" });
      const msg = buildProposalMsg("agent-charlie", "agent-alice", proposal);

      await alice.handleIncoming(msg);

      const lastPayload = aliceMock._lastSentPayload() as { kind: string };
      expect(lastPayload.kind).toBe("REJECT");
    });

    it("ignores non-negotiation message types", async () => {
      const handler = vi.fn(async () => ({ accept: true }));
      alice.onTaskRequest(handler);

      const irrelevantMsg: AgentMessage = {
        id: "m-irrelevant",
        type: "HEARTBEAT",
        from: "agent-charlie",
        topic: "meridian/agent/agent-alice",
        payload: { ping: true },
        timestamp: Date.now(),
      };

      await alice.handleIncoming(irrelevantMsg);

      // Handler should NOT have been called.
      expect(handler).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Multiple concurrent negotiations
  // -------------------------------------------------------------------------

  describe("concurrent negotiations", () => {
    it("resolves each negotiation independently", async () => {
      const proposal1 = makeProposal({ taskId: "task-A" });
      const proposal2 = makeProposal({ taskId: "task-B" });

      const result1Promise = alice.propose("agent-bob", proposal1, 5_000);
      const result2Promise = alice.propose("agent-charlie", proposal2, 5_000);

      // Bob accepts task-A, Charlie rejects task-B.
      aliceMock._deliver(buildResponseMsg("agent-bob", "agent-alice", "ACCEPT", "task-A"));
      aliceMock._deliver(buildResponseMsg("agent-charlie", "agent-alice", "REJECT", "task-B"));

      const [r1, r2] = await Promise.all([result1Promise, result2Promise]);

      expect(r1.state).toBe("AGREED");
      expect(r1.taskId).toBe("task-A");
      expect(r2.state).toBe("REJECTED");
      expect(r2.taskId).toBe("task-B");
    });
  });
});
