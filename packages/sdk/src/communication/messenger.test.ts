// ---------------------------------------------------------------------------
// messenger.test.ts — unit tests for the Messenger class
// ---------------------------------------------------------------------------

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Messenger, MessengerError } from "./messenger.js";
import type { AgentMessage } from "./messenger.js";
import type { IP2PNode } from "./p2p-node.js";

// ---------------------------------------------------------------------------
// Mock P2PNode factory
// ---------------------------------------------------------------------------

function createMockP2PNode(): IP2PNode & {
  _publishedMessages: Array<{ topic: string; message: Uint8Array }>;
  _subscriptions: Map<string, Array<(msg: Uint8Array) => void>>;
  _simulateInbound(topic: string, data: Uint8Array): void;
} {
  const _publishedMessages: Array<{ topic: string; message: Uint8Array }> = [];
  const _subscriptions = new Map<string, Array<(msg: Uint8Array) => void>>();

  function _simulateInbound(topic: string, data: Uint8Array): void {
    const handlers = _subscriptions.get(topic) ?? [];
    for (const h of handlers) h(data);
  }

  return {
    _publishedMessages,
    _subscriptions,
    _simulateInbound,

    start: vi.fn(async () => { /* noop */ }),
    stop: vi.fn(async () => { /* noop */ }),
    getPeerId: vi.fn(() => "mock-peer-id"),
    getConnectedPeers: vi.fn(() => []),

    publish: vi.fn(async (topic: string, message: Uint8Array) => {
      _publishedMessages.push({ topic, message });
    }),

    subscribe: vi.fn((topic: string, handler: (msg: Uint8Array) => void) => {
      const existing = _subscriptions.get(topic) ?? [];
      existing.push(handler);
      _subscriptions.set(topic, existing);
    }),

    unsubscribe: vi.fn((topic: string) => {
      _subscriptions.delete(topic);
    }),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Messenger", () => {
  let mockNode: ReturnType<typeof createMockP2PNode>;
  let messenger: Messenger;

  beforeEach(() => {
    mockNode = createMockP2PNode();
    messenger = new Messenger(mockNode, "agent-alice");
  });

  // -------------------------------------------------------------------------
  // encodeMessage / decodeMessage
  // -------------------------------------------------------------------------

  describe("encodeMessage → decodeMessage roundtrip", () => {
    it("preserves all fields through encode/decode", () => {
      const original: AgentMessage = {
        id: "msg-001",
        type: "SIGNAL",
        from: "agent-alice",
        to: "agent-bob",
        topic: "test/topic",
        payload: { value: 42, nested: { a: true } },
        timestamp: 1_700_000_000_000,
        signature: "0xdeadbeef",
      };

      const encoded = messenger.encodeMessage(original);
      const decoded = messenger.decodeMessage(encoded);

      expect(decoded.id).toBe(original.id);
      expect(decoded.type).toBe(original.type);
      expect(decoded.from).toBe(original.from);
      expect(decoded.to).toBe(original.to);
      expect(decoded.topic).toBe(original.topic);
      expect(decoded.payload).toEqual(original.payload);
      expect(decoded.timestamp).toBe(original.timestamp);
      expect(decoded.signature).toBe(original.signature);
    });

    it("preserves messages without optional fields", () => {
      const msg: AgentMessage = {
        id: "msg-002",
        type: "HEARTBEAT",
        from: "agent-alice",
        topic: "heartbeat",
        payload: null,
        timestamp: Date.now(),
      };

      const decoded = messenger.decodeMessage(messenger.encodeMessage(msg));
      expect(decoded.to).toBeUndefined();
      expect(decoded.signature).toBeUndefined();
      expect(decoded.type).toBe("HEARTBEAT");
    });

    it("roundtrip preserves array payload", () => {
      const msg: AgentMessage = {
        id: "msg-003",
        type: "RESULT",
        from: "agent-alice",
        topic: "results",
        payload: [1, 2, 3, { nested: "ok" }],
        timestamp: Date.now(),
      };

      const decoded = messenger.decodeMessage(messenger.encodeMessage(msg));
      expect(decoded.payload).toEqual([1, 2, 3, { nested: "ok" }]);
    });

    it("roundtrip preserves string payload", () => {
      const msg: AgentMessage = {
        id: "msg-004",
        type: "SIGNAL",
        from: "agent-alice",
        topic: "signals",
        payload: "hello world",
        timestamp: Date.now(),
      };

      const decoded = messenger.decodeMessage(messenger.encodeMessage(msg));
      expect(decoded.payload).toBe("hello world");
    });
  });

  // -------------------------------------------------------------------------
  // decodeMessage validation
  // -------------------------------------------------------------------------

  describe("decodeMessage validation", () => {
    it("throws MessengerError for non-JSON bytes", () => {
      const badData = new Uint8Array([0xff, 0xfe, 0x00, 0x01]);
      expect(() => messenger.decodeMessage(badData)).toThrow(MessengerError);
    });

    it("throws MessengerError for JSON missing required id field", () => {
      const bad = JSON.stringify({
        type: "SIGNAL",
        from: "agent-alice",
        topic: "test",
        payload: {},
        timestamp: Date.now(),
      });
      const encoded = new TextEncoder().encode(bad);
      expect(() => messenger.decodeMessage(encoded)).toThrow(MessengerError);
    });

    it("throws MessengerError for unknown message type", () => {
      const bad = JSON.stringify({
        id: "msg-bad",
        type: "UNKNOWN_TYPE",
        from: "agent-alice",
        topic: "test",
        payload: {},
        timestamp: Date.now(),
      });
      const encoded = new TextEncoder().encode(bad);
      expect(() => messenger.decodeMessage(encoded)).toThrow(MessengerError);
    });

    it("throws MessengerError for empty from field", () => {
      const bad = JSON.stringify({
        id: "msg-bad",
        type: "SIGNAL",
        from: "",
        topic: "test",
        payload: {},
        timestamp: Date.now(),
      });
      const encoded = new TextEncoder().encode(bad);
      expect(() => messenger.decodeMessage(encoded)).toThrow(MessengerError);
    });

    it("throws MessengerError for empty id field", () => {
      const bad = JSON.stringify({
        id: "",
        type: "SIGNAL",
        from: "agent-alice",
        topic: "test",
        payload: {},
        timestamp: Date.now(),
      });
      const encoded = new TextEncoder().encode(bad);
      expect(() => messenger.decodeMessage(encoded)).toThrow(MessengerError);
    });
  });

  // -------------------------------------------------------------------------
  // broadcast
  // -------------------------------------------------------------------------

  describe("broadcast", () => {
    it("publishes to the correct topic", async () => {
      await messenger.broadcast("market/prices", { eth: 3000 });

      expect(mockNode._publishedMessages).toHaveLength(1);
      expect(mockNode._publishedMessages[0]!.topic).toBe("market/prices");
    });

    it("published message can be decoded and contains correct from/payload", async () => {
      await messenger.broadcast("market/prices", { eth: 3000 });

      const raw = mockNode._publishedMessages[0]!.message;
      const decoded = messenger.decodeMessage(raw);

      expect(decoded.from).toBe("agent-alice");
      expect(decoded.payload).toEqual({ eth: 3000 });
      expect(decoded.type).toBe("SIGNAL");
    });

    it("uses provided message type", async () => {
      await messenger.broadcast("tasks", { id: "t1" }, "TASK_REQUEST");

      const raw = mockNode._publishedMessages[0]!.message;
      const decoded = messenger.decodeMessage(raw);
      expect(decoded.type).toBe("TASK_REQUEST");
    });

    it("auto-generates a unique id for each broadcast", async () => {
      await messenger.broadcast("topic", {});
      await messenger.broadcast("topic", {});

      const msg1 = messenger.decodeMessage(mockNode._publishedMessages[0]!.message);
      const msg2 = messenger.decodeMessage(mockNode._publishedMessages[1]!.message);

      expect(msg1.id).not.toBe(msg2.id);
    });
  });

  // -------------------------------------------------------------------------
  // send (directed)
  // -------------------------------------------------------------------------

  describe("send", () => {
    it("publishes to the recipient's agent topic", async () => {
      await messenger.send("agent-bob", { hello: true });

      expect(mockNode._publishedMessages[0]!.topic).toBe("meridian/agent/agent-bob");
    });

    it("sets the to field on the message", async () => {
      await messenger.send("agent-bob", { data: 42 });

      const raw = mockNode._publishedMessages[0]!.message;
      const decoded = messenger.decodeMessage(raw);
      expect(decoded.to).toBe("agent-bob");
      expect(decoded.from).toBe("agent-alice");
    });
  });

  // -------------------------------------------------------------------------
  // onMessage handler
  // -------------------------------------------------------------------------

  describe("onMessage", () => {
    it("invokes registered handler when a subscribed topic receives a message", () => {
      const received: AgentMessage[] = [];
      messenger.onMessage((msg) => received.push(msg));

      // Subscribe to a topic to wire up the P2P handler.
      messenger.subscribeToTopic("market/prices");

      const outbound: AgentMessage = {
        id: "inbound-1",
        type: "SIGNAL",
        from: "agent-bob",
        topic: "market/prices",
        payload: { eth: 2800 },
        timestamp: Date.now(),
      };

      mockNode._simulateInbound("market/prices", messenger.encodeMessage(outbound));

      expect(received).toHaveLength(1);
      expect(received[0]!.id).toBe("inbound-1");
      expect(received[0]!.payload).toEqual({ eth: 2800 });
    });

    it("multiple handlers all receive the message", () => {
      const counts = [0, 0];
      messenger.onMessage(() => { counts[0]++; });
      messenger.onMessage(() => { counts[1]++; });

      messenger.subscribeToTopic("topic");

      const msg: AgentMessage = {
        id: "m1",
        type: "HEARTBEAT",
        from: "agent-charlie",
        topic: "topic",
        payload: null,
        timestamp: Date.now(),
      };

      mockNode._simulateInbound("topic", messenger.encodeMessage(msg));

      expect(counts[0]).toBe(1);
      expect(counts[1]).toBe(1);
    });

    it("does not invoke handlers for malformed inbound messages", () => {
      const received: AgentMessage[] = [];
      messenger.onMessage((msg) => received.push(msg));
      messenger.subscribeToTopic("topic");

      // Send garbage bytes.
      mockNode._simulateInbound("topic", new Uint8Array([0x00, 0x01]));

      expect(received).toHaveLength(0);
    });
  });
});
