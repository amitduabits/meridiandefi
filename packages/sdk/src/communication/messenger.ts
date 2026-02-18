// ---------------------------------------------------------------------------
// Messenger — typed JSON message passing over P2P pub/sub.
// Provides broadcast (topic-level) and directed (agent-to-agent) messaging.
// ---------------------------------------------------------------------------

import { createLogger } from "../core/logger.js";
import { MeridianError } from "../core/errors.js";
import type { IP2PNode } from "./p2p-node.js";

const logger = createLogger({ module: "communication/messenger" });

export class MessengerError extends MeridianError {
  constructor(message: string, opts?: { code?: string; recoverable?: boolean; context?: Record<string, unknown>; cause?: unknown }) {
    super(message, { code: opts?.code ?? "MESSENGER_ERROR", recoverable: opts?.recoverable ?? true, context: opts?.context, cause: opts?.cause });
    this.name = "MessengerError";
  }
}

// ---------------------------------------------------------------------------
// Message types
// ---------------------------------------------------------------------------

export type MessageType = "SIGNAL" | "TASK_REQUEST" | "TASK_RESPONSE" | "RESULT" | "HEARTBEAT";

export interface AgentMessage {
  /** Unique message ID (UUID-like). */
  id: string;
  /** The message type discriminator. */
  type: MessageType;
  /** Sender agent ID. */
  from: string;
  /** Target agent ID — undefined means broadcast to all subscribers of the topic. */
  to?: string;
  /** Pub/sub topic this message was published on. */
  topic: string;
  /** Application payload. */
  payload: unknown;
  /** Unix timestamp (ms). */
  timestamp: number;
  /** Optional Ed25519 signature (hex-encoded). */
  signature?: string;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const VALID_MESSAGE_TYPES = new Set<string>(["SIGNAL", "TASK_REQUEST", "TASK_RESPONSE", "RESULT", "HEARTBEAT"]);

function isAgentMessage(obj: unknown): obj is AgentMessage {
  if (typeof obj !== "object" || obj === null) return false;
  const m = obj as Record<string, unknown>;
  return (
    typeof m["id"] === "string" &&
    m["id"].length > 0 &&
    typeof m["type"] === "string" &&
    VALID_MESSAGE_TYPES.has(m["type"] as string) &&
    typeof m["from"] === "string" &&
    m["from"].length > 0 &&
    typeof m["topic"] === "string" &&
    m["topic"].length > 0 &&
    typeof m["timestamp"] === "number"
  );
}

// ---------------------------------------------------------------------------
// Simple ID generator (no external dependency)
// ---------------------------------------------------------------------------

let _counter = 0;
function generateId(): string {
  return `${Date.now().toString(36)}-${(++_counter).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Messenger
// ---------------------------------------------------------------------------

export class Messenger {
  private readonly _p2pNode: IP2PNode;
  private readonly _agentId: string;
  private readonly _handlers: Array<(msg: AgentMessage) => void> = [];

  constructor(p2pNode: IP2PNode, agentId: string) {
    this._p2pNode = p2pNode;
    this._agentId = agentId;
  }

  /** Broadcast a message to all subscribers of a topic. */
  async broadcast(topic: string, payload: unknown, type: MessageType = "SIGNAL"): Promise<void> {
    const msg: AgentMessage = {
      id: generateId(),
      type,
      from: this._agentId,
      topic,
      payload,
      timestamp: Date.now(),
    };

    const encoded = this.encodeMessage(msg);
    await this._p2pNode.publish(topic, encoded);
    logger.debug({ messageId: msg.id, topic, from: this._agentId }, "Message broadcast");
  }

  /** Send a directed message to a specific agent. */
  async send(toAgentId: string, payload: unknown, type: MessageType = "SIGNAL"): Promise<void> {
    const topic = `meridian/agent/${toAgentId}`;
    const msg: AgentMessage = {
      id: generateId(),
      type,
      from: this._agentId,
      to: toAgentId,
      topic,
      payload,
      timestamp: Date.now(),
    };

    const encoded = this.encodeMessage(msg);
    await this._p2pNode.publish(topic, encoded);
    logger.debug({ messageId: msg.id, to: toAgentId, from: this._agentId }, "Message sent");
  }

  /**
   * Register a handler that receives all inbound messages.
   * The caller must call subscribeToTopic() separately to hook up a P2P topic.
   */
  onMessage(handler: (msg: AgentMessage) => void): void {
    this._handlers.push(handler);
  }

  /**
   * Subscribe to a P2P topic and route decoded messages to registered handlers.
   * Call this after registering at least one onMessage handler.
   */
  subscribeToTopic(topic: string): void {
    this._p2pNode.subscribe(topic, (raw) => {
      try {
        const msg = this.decodeMessage(raw);
        for (const h of this._handlers) {
          try {
            h(msg);
          } catch (err) {
            logger.warn({ err, messageId: msg.id }, "Error in message handler");
          }
        }
      } catch (err) {
        logger.warn({ err, topic }, "Failed to decode incoming message");
      }
    });
  }

  /** Encode an AgentMessage to bytes. */
  encodeMessage(msg: AgentMessage): Uint8Array {
    const json = JSON.stringify(msg);
    return new TextEncoder().encode(json);
  }

  /** Decode bytes to an AgentMessage. Throws MessengerError on invalid data. */
  decodeMessage(data: Uint8Array): AgentMessage {
    let parsed: unknown;
    try {
      const text = new TextDecoder().decode(data);
      parsed = JSON.parse(text) as unknown;
    } catch (err) {
      throw new MessengerError("Failed to parse message JSON", { code: "DECODE_ERROR", cause: err });
    }

    if (!isAgentMessage(parsed)) {
      throw new MessengerError("Invalid AgentMessage — missing required fields", {
        code: "VALIDATION_ERROR",
        context: { parsed },
      });
    }

    return parsed;
  }
}
