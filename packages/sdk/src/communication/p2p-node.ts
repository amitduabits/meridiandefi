// ---------------------------------------------------------------------------
// P2P Node — libp2p v2 wrapper with GossipSub pub/sub.
// Falls back gracefully to offline mode if libp2p cannot be initialised.
// ---------------------------------------------------------------------------

import { createLogger } from "../core/logger.js";
import { MeridianError } from "../core/errors.js";

const logger = createLogger({ module: "communication/p2p-node" });

export class CommunicationError extends MeridianError {
  constructor(message: string, opts?: { code?: string; recoverable?: boolean; context?: Record<string, unknown>; cause?: unknown }) {
    super(message, { code: opts?.code ?? "COMMUNICATION_ERROR", recoverable: opts?.recoverable ?? true, context: opts?.context, cause: opts?.cause });
    this.name = "CommunicationError";
  }
}

export interface P2PNodeConfig {
  agentId: string;
  listenAddresses?: string[];
  bootstrapPeers?: string[];
}

export interface IP2PNode {
  start(): Promise<void>;
  stop(): Promise<void>;
  publish(topic: string, message: Uint8Array): Promise<void>;
  subscribe(topic: string, handler: (msg: Uint8Array) => void): void;
  unsubscribe(topic: string): void;
  getPeerId(): string;
  getConnectedPeers(): string[];
}

// ---------------------------------------------------------------------------
// Offline stub — used when libp2p fails to initialise
// ---------------------------------------------------------------------------

class OfflineP2PNode implements IP2PNode {
  private readonly _peerId: string;
  private readonly _subscriptions = new Map<string, Array<(msg: Uint8Array) => void>>();

  constructor(agentId: string) {
    this._peerId = `offline-${agentId}`;
  }

  async start(): Promise<void> {
    logger.warn({ peerId: this._peerId }, "P2P node operating in offline mode — no network connectivity");
  }

  async stop(): Promise<void> {
    this._subscriptions.clear();
  }

  async publish(topic: string, message: Uint8Array): Promise<void> {
    // In offline mode, deliver to local subscribers only (loopback).
    const handlers = this._subscriptions.get(topic);
    if (handlers) {
      for (const h of handlers) {
        try {
          h(message);
        } catch (err) {
          logger.warn({ topic, err }, "Error in local subscription handler");
        }
      }
    }
  }

  subscribe(topic: string, handler: (msg: Uint8Array) => void): void {
    const existing = this._subscriptions.get(topic) ?? [];
    existing.push(handler);
    this._subscriptions.set(topic, existing);
  }

  unsubscribe(topic: string): void {
    this._subscriptions.delete(topic);
  }

  getPeerId(): string {
    return this._peerId;
  }

  getConnectedPeers(): string[] {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Live P2P node — wraps libp2p v2 with GossipSub
// ---------------------------------------------------------------------------

class LiveP2PNode implements IP2PNode {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _node: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _pubsub: any;
  private readonly _subscriptions = new Map<string, Array<(msg: Uint8Array) => void>>();
  private _peerId = "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(node: any) {
    this._node = node;
    // GossipSub is accessible via node.services.pubsub in libp2p v2
    this._pubsub = node.services?.pubsub ?? null;
  }

  async start(): Promise<void> {
    await this._node.start();
    this._peerId = this._node.peerId?.toString() ?? "unknown";
    logger.info({ peerId: this._peerId }, "P2P node started");
  }

  async stop(): Promise<void> {
    await this._node.stop();
    logger.info({ peerId: this._peerId }, "P2P node stopped");
  }

  async publish(topic: string, message: Uint8Array): Promise<void> {
    if (!this._pubsub) {
      throw new CommunicationError("GossipSub pubsub not available", { code: "PUBSUB_UNAVAILABLE" });
    }
    await this._pubsub.publish(topic, message);
  }

  subscribe(topic: string, handler: (msg: Uint8Array) => void): void {
    if (!this._pubsub) {
      logger.warn({ topic }, "Cannot subscribe — GossipSub not available");
      return;
    }

    const existing = this._subscriptions.get(topic) ?? [];
    existing.push(handler);
    this._subscriptions.set(topic, existing);

    // Subscribe at the libp2p level the first time we see this topic.
    if (existing.length === 1) {
      this._pubsub.subscribe(topic);
      this._pubsub.addEventListener("message", (event: unknown) => {
        const msg = event as { detail: { topic: string; data: Uint8Array } };
        if (msg.detail.topic !== topic) return;
        const handlers = this._subscriptions.get(topic) ?? [];
        for (const h of handlers) {
          try {
            h(msg.detail.data);
          } catch (err) {
            logger.warn({ topic, err }, "Error in subscription handler");
          }
        }
      });
    }
  }

  unsubscribe(topic: string): void {
    this._subscriptions.delete(topic);
    if (this._pubsub) {
      try {
        this._pubsub.unsubscribe(topic);
      } catch {
        // Ignore errors during unsubscribe
      }
    }
  }

  getPeerId(): string {
    return this._peerId;
  }

  getConnectedPeers(): string[] {
    try {
      const connections = this._node.getConnections?.() ?? [];
      return connections.map((c: unknown) => {
        const conn = c as { remotePeer: { toString(): string } };
        return conn.remotePeer.toString();
      });
    } catch {
      return [];
    }
  }
}

// ---------------------------------------------------------------------------
// P2PNode factory — tries to create a live node, falls back to offline
// ---------------------------------------------------------------------------

export class P2PNode implements IP2PNode {
  private _delegate: IP2PNode;
  private readonly _config: P2PNodeConfig;

  constructor(config: P2PNodeConfig) {
    this._config = config;
    // Initialise with offline node; replaced by start() if libp2p is available.
    this._delegate = new OfflineP2PNode(config.agentId);
  }

  async start(): Promise<void> {
    try {
      const { createLibp2p } = await import("libp2p");
      const { gossipsub } = await import("@chainsafe/libp2p-gossipsub");
      const { noise } = await import("@chainsafe/libp2p-noise");
      const { yamux } = await import("@chainsafe/libp2p-yamux");
      const { tcp } = await import("@libp2p/tcp");

      const listenAddresses = this._config.listenAddresses ?? ["/ip4/0.0.0.0/tcp/0"];

      const node = await createLibp2p({
        addresses: { listen: listenAddresses },
        transports: [tcp()],
        connectionEncrypters: [noise()],
        streamMuxers: [yamux()],
        services: {
          pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
        },
      });

      this._delegate = new LiveP2PNode(node);
      await this._delegate.start();
    } catch (err) {
      logger.warn({ err, agentId: this._config.agentId }, "libp2p not available — falling back to offline mode");
      this._delegate = new OfflineP2PNode(this._config.agentId);
      await this._delegate.start();
    }
  }

  async stop(): Promise<void> {
    await this._delegate.stop();
  }

  async publish(topic: string, message: Uint8Array): Promise<void> {
    await this._delegate.publish(topic, message);
  }

  subscribe(topic: string, handler: (msg: Uint8Array) => void): void {
    this._delegate.subscribe(topic, handler);
  }

  unsubscribe(topic: string): void {
    this._delegate.unsubscribe(topic);
  }

  getPeerId(): string {
    return this._delegate.getPeerId();
  }

  getConnectedPeers(): string[] {
    return this._delegate.getConnectedPeers();
  }
}
