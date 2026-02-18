// ---------------------------------------------------------------------------
// Negotiation Protocol — agent-to-agent task negotiation.
// Implements a simple offer/counter-offer pattern over the Messenger layer.
// ---------------------------------------------------------------------------

import { createLogger } from "../core/logger.js";
import { MeridianError } from "../core/errors.js";
import type { Messenger, AgentMessage } from "./messenger.js";

const logger = createLogger({ module: "communication/negotiation" });

export class NegotiationError extends MeridianError {
  constructor(message: string, opts?: { code?: string; recoverable?: boolean; context?: Record<string, unknown>; cause?: unknown }) {
    super(message, { code: opts?.code ?? "NEGOTIATION_ERROR", recoverable: opts?.recoverable ?? true, context: opts?.context, cause: opts?.cause });
    this.name = "NegotiationError";
  }
}

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export type NegotiationState = "PROPOSED" | "NEGOTIATING" | "AGREED" | "REJECTED" | "COMPLETED" | "FAILED";

export interface TaskProposal {
  taskId: string;
  requiredCapability: string;
  description: string;
  offeredPayment: bigint; // in wei
  deadline: number; // Unix timestamp ms
  metadata?: Record<string, unknown>;
}

export interface NegotiationResult {
  taskId: string;
  state: NegotiationState;
  agreedPayment: bigint;
  executorId: string;
}

// ---------------------------------------------------------------------------
// Wire serialisation helpers — BigInt is not JSON-serialisable by default.
// ---------------------------------------------------------------------------

interface SerializedProposal {
  taskId: string;
  requiredCapability: string;
  description: string;
  offeredPayment: string; // BigInt as decimal string
  deadline: number;
  metadata?: Record<string, unknown>;
}

interface NegotiationPayload {
  kind: "PROPOSAL" | "ACCEPT" | "REJECT" | "COUNTER";
  proposal?: SerializedProposal;
  counterOffer?: string; // BigInt as decimal string
  taskId?: string;
}

function serializeProposal(p: TaskProposal): SerializedProposal {
  return {
    taskId: p.taskId,
    requiredCapability: p.requiredCapability,
    description: p.description,
    offeredPayment: p.offeredPayment.toString(),
    deadline: p.deadline,
    ...(p.metadata !== undefined ? { metadata: p.metadata } : {}),
  };
}

function deserializeProposal(s: SerializedProposal): TaskProposal {
  return {
    taskId: s.taskId,
    requiredCapability: s.requiredCapability,
    description: s.description,
    offeredPayment: BigInt(s.offeredPayment),
    deadline: s.deadline,
    ...(s.metadata !== undefined ? { metadata: s.metadata } : {}),
  };
}

function isNegotiationPayload(obj: unknown): obj is NegotiationPayload {
  if (typeof obj !== "object" || obj === null) return false;
  const p = obj as Record<string, unknown>;
  return (
    typeof p["kind"] === "string" &&
    ["PROPOSAL", "ACCEPT", "REJECT", "COUNTER"].includes(p["kind"] as string)
  );
}

// ---------------------------------------------------------------------------
// Pending negotiation tracker
// ---------------------------------------------------------------------------

interface PendingNegotiation {
  resolve: (result: NegotiationResult) => void;
  reject: (err: Error) => void;
  proposal: TaskProposal;
  state: NegotiationState;
  timeoutHandle: ReturnType<typeof setTimeout>;
}

// ---------------------------------------------------------------------------
// NegotiationProtocol
// ---------------------------------------------------------------------------

/** Default timeout for a negotiation round (30 seconds). */
const DEFAULT_TIMEOUT_MS = 30_000;

export class NegotiationProtocol {
  private readonly _messenger: Messenger;
  private readonly _agentId: string;
  private readonly _pending = new Map<string, PendingNegotiation>();
  private _taskRequestHandler: ((proposal: TaskProposal, from: string) => Promise<{ accept: boolean; counterOffer?: bigint }>) | null = null;

  constructor(messenger: Messenger, agentId: string) {
    this._messenger = messenger;
    this._agentId = agentId;

    // Listen for inbound negotiation messages on this agent's direct topic.
    const myTopic = `meridian/agent/${this._agentId}`;
    this._messenger.subscribeToTopic(myTopic);
    this._messenger.onMessage((msg) => {
      this.handleIncoming(msg).catch((err) => {
        logger.warn({ err, messageId: msg.id }, "Error handling negotiation message");
      });
    });
  }

  /**
   * Propose a task to a remote agent.
   * Resolves with the negotiation outcome once the remote agent responds.
   */
  async propose(toAgentId: string, proposal: TaskProposal, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<NegotiationResult> {
    // Fail immediately if the deadline has already passed.
    if (proposal.deadline < Date.now()) {
      return {
        taskId: proposal.taskId,
        state: "FAILED",
        agreedPayment: BigInt(0),
        executorId: "",
      };
    }

    return new Promise<NegotiationResult>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this._pending.delete(proposal.taskId);
        resolve({
          taskId: proposal.taskId,
          state: "FAILED",
          agreedPayment: BigInt(0),
          executorId: "",
        });
      }, timeoutMs);

      this._pending.set(proposal.taskId, {
        resolve,
        reject,
        proposal,
        state: "PROPOSED",
        timeoutHandle,
      });

      const payload: NegotiationPayload = {
        kind: "PROPOSAL",
        proposal: serializeProposal(proposal),
      };

      this._messenger
        .send(toAgentId, payload, "TASK_REQUEST")
        .catch((err) => {
          clearTimeout(timeoutHandle);
          this._pending.delete(proposal.taskId);
          reject(new NegotiationError("Failed to send proposal", { cause: err }));
        });

      logger.debug({ taskId: proposal.taskId, to: toAgentId }, "Proposal sent");
    });
  }

  /** Handle an inbound negotiation message. */
  async handleIncoming(msg: AgentMessage): Promise<void> {
    if (msg.type !== "TASK_REQUEST" && msg.type !== "TASK_RESPONSE") return;
    if (!isNegotiationPayload(msg.payload)) return;

    const payload = msg.payload;

    switch (payload.kind) {
      case "PROPOSAL": {
        if (!payload.proposal) return;
        const proposal = deserializeProposal(payload.proposal);
        await this._handleProposal(msg.from, proposal);
        break;
      }

      case "ACCEPT":
      case "REJECT":
      case "COUNTER": {
        const taskId = payload.taskId;
        if (!taskId) return;
        await this._handleResponse(payload, msg.from);
        break;
      }
    }
  }

  /** Register a handler that decides whether to accept incoming task proposals. */
  onTaskRequest(
    handler: (proposal: TaskProposal, from: string) => Promise<{ accept: boolean; counterOffer?: bigint }>,
  ): void {
    this._taskRequestHandler = handler;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async _handleProposal(from: string, proposal: TaskProposal): Promise<void> {
    logger.debug({ taskId: proposal.taskId, from }, "Received task proposal");

    if (!this._taskRequestHandler) {
      // Auto-reject if no handler is registered.
      await this._sendReject(from, proposal.taskId);
      return;
    }

    let decision: { accept: boolean; counterOffer?: bigint };
    try {
      decision = await this._taskRequestHandler(proposal, from);
    } catch (err) {
      logger.warn({ err, taskId: proposal.taskId }, "Task request handler threw");
      await this._sendReject(from, proposal.taskId);
      return;
    }

    if (decision.accept) {
      await this._sendAccept(from, proposal.taskId, proposal.offeredPayment);
    } else if (decision.counterOffer !== undefined) {
      await this._sendCounter(from, proposal.taskId, decision.counterOffer);
    } else {
      await this._sendReject(from, proposal.taskId);
    }
  }

  private async _handleResponse(payload: NegotiationPayload, from: string): Promise<void> {
    const taskId = payload.taskId;
    if (!taskId) return;

    const pending = this._pending.get(taskId);
    if (!pending) {
      logger.debug({ taskId }, "Received response for unknown negotiation (may have timed out)");
      return;
    }

    clearTimeout(pending.timeoutHandle);
    this._pending.delete(taskId);

    switch (payload.kind) {
      case "ACCEPT": {
        const agreedPayment = payload.counterOffer !== undefined
          ? BigInt(payload.counterOffer)
          : pending.proposal.offeredPayment;
        pending.resolve({
          taskId,
          state: "AGREED",
          agreedPayment,
          executorId: from,
        });
        logger.debug({ taskId, from }, "Negotiation agreed");
        break;
      }

      case "REJECT": {
        pending.resolve({
          taskId,
          state: "REJECTED",
          agreedPayment: BigInt(0),
          executorId: from,
        });
        logger.debug({ taskId, from }, "Negotiation rejected");
        break;
      }

      case "COUNTER": {
        // Simple strategy: accept any counter-offer.
        const counterOffer = payload.counterOffer !== undefined ? BigInt(payload.counterOffer) : pending.proposal.offeredPayment;
        pending.resolve({
          taskId,
          state: "AGREED",
          agreedPayment: counterOffer,
          executorId: from,
        });
        logger.debug({ taskId, from, counterOffer: counterOffer.toString() }, "Counter-offer accepted");
        break;
      }
    }
  }

  private async _sendAccept(to: string, taskId: string, agreedPayment: bigint): Promise<void> {
    const payload: NegotiationPayload = {
      kind: "ACCEPT",
      taskId,
      counterOffer: agreedPayment.toString(),
    };
    await this._messenger.send(to, payload, "TASK_RESPONSE");
  }

  private async _sendReject(to: string, taskId: string): Promise<void> {
    const payload: NegotiationPayload = {
      kind: "REJECT",
      taskId,
    };
    await this._messenger.send(to, payload, "TASK_RESPONSE");
  }

  private async _sendCounter(to: string, taskId: string, counterOffer: bigint): Promise<void> {
    const payload: NegotiationPayload = {
      kind: "COUNTER",
      taskId,
      counterOffer: counterOffer.toString(),
    };
    await this._messenger.send(to, payload, "TASK_RESPONSE");
  }
}
