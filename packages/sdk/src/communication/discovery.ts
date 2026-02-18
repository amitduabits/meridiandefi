// ---------------------------------------------------------------------------
// Agent Discovery Service — announces and discovers agents by capability.
// Uses an in-memory registry backed by P2P pub/sub for distribution.
// ---------------------------------------------------------------------------

import { createLogger } from "../core/logger.js";
import { MeridianError } from "../core/errors.js";
import type { IP2PNode } from "./p2p-node.js";

const logger = createLogger({ module: "communication/discovery" });

const DISCOVERY_TOPIC = "meridian/discovery/v1";

export class DiscoveryError extends MeridianError {
  constructor(message: string, opts?: { code?: string; recoverable?: boolean; context?: Record<string, unknown>; cause?: unknown }) {
    super(message, { code: opts?.code ?? "DISCOVERY_ERROR", recoverable: opts?.recoverable ?? true, context: opts?.context, cause: opts?.cause });
    this.name = "DiscoveryError";
  }
}

export interface AgentProfile {
  agentId: string;
  capabilities: string[];
  endpoint?: string;
  reputation: number;
  lastSeen: number;
}

// ---------------------------------------------------------------------------
// Wire format for discovery announcements
// ---------------------------------------------------------------------------

interface DiscoveryAnnouncement {
  type: "ANNOUNCE";
  profile: AgentProfile;
}

function isDiscoveryAnnouncement(obj: unknown): obj is DiscoveryAnnouncement {
  if (typeof obj !== "object" || obj === null) return false;
  const candidate = obj as Record<string, unknown>;
  if (candidate["type"] !== "ANNOUNCE") return false;
  const profile = candidate["profile"];
  if (typeof profile !== "object" || profile === null) return false;
  const p = profile as Record<string, unknown>;
  return (
    typeof p["agentId"] === "string" &&
    Array.isArray(p["capabilities"]) &&
    typeof p["reputation"] === "number" &&
    typeof p["lastSeen"] === "number"
  );
}

// ---------------------------------------------------------------------------
// DiscoveryService
// ---------------------------------------------------------------------------

export class DiscoveryService {
  private readonly _p2pNode: IP2PNode;
  private readonly _registry = new Map<string, AgentProfile>();

  constructor(p2pNode: IP2PNode) {
    this._p2pNode = p2pNode;

    // Listen for announcements from remote peers.
    this._p2pNode.subscribe(DISCOVERY_TOPIC, (raw) => {
      try {
        const text = new TextDecoder().decode(raw);
        const parsed: unknown = JSON.parse(text);
        if (!isDiscoveryAnnouncement(parsed)) return;
        const profile = parsed.profile;
        this._registry.set(profile.agentId, profile);
        logger.debug({ agentId: profile.agentId }, "Discovered agent via p2p");
      } catch (err) {
        logger.warn({ err }, "Failed to parse discovery announcement");
      }
    });
  }

  /** Announce this agent's profile to the network. */
  async announce(profile: AgentProfile): Promise<void> {
    // Always update local registry first.
    this._registry.set(profile.agentId, { ...profile, lastSeen: Date.now() });

    const announcement: DiscoveryAnnouncement = {
      type: "ANNOUNCE",
      profile: { ...profile, lastSeen: Date.now() },
    };

    try {
      const encoded = new TextEncoder().encode(JSON.stringify(announcement));
      await this._p2pNode.publish(DISCOVERY_TOPIC, encoded);
      logger.debug({ agentId: profile.agentId }, "Announced agent profile");
    } catch (err) {
      // Non-fatal — local registry is still updated.
      logger.warn({ err, agentId: profile.agentId }, "Failed to broadcast announcement; profile stored locally");
    }
  }

  /** Find agents with a specific capability. */
  async findAgents(capability: string): Promise<AgentProfile[]> {
    const results: AgentProfile[] = [];
    for (const profile of this._registry.values()) {
      if (profile.capabilities.includes(capability)) {
        results.push(profile);
      }
    }
    return results;
  }

  /** Get the profile for a specific agent ID. */
  async getAgentProfile(agentId: string): Promise<AgentProfile | null> {
    return this._registry.get(agentId) ?? null;
  }

  /** List all known agents. */
  async listAll(): Promise<AgentProfile[]> {
    return Array.from(this._registry.values());
  }
}
