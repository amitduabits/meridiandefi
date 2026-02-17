// ---------------------------------------------------------------------------
// WebSocket handler — real-time subscriptions for agent events, price feeds,
// and alerts.  Uses raw ws (not tRPC WS adapter) so we can push arbitrary
// event frames to connected dashboards.
// ---------------------------------------------------------------------------

import type { Server as HTTPServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";

// ---------------------------------------------------------------------------
// Event types pushed to clients
// ---------------------------------------------------------------------------

export interface WsEvent {
  type: "agent:stateChange" | "agent:cycle" | "price:update" | "alert" | "tx:status";
  payload: Record<string, unknown>;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Client tracking
// ---------------------------------------------------------------------------

const clients = new Set<WebSocket>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Attach a WebSocket server to an existing HTTP server.
 * Returns helpers for broadcasting events.
 */
export function createWsHandler(server: HTTPServer): {
  wss: WebSocketServer;
  broadcast: (event: WsEvent) => void;
  startMockFeed: () => () => void;
} {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, _req) => {
    clients.add(ws);

    // Send a welcome message so the client knows the connection is live.
    const welcome: WsEvent = {
      type: "agent:stateChange",
      payload: { message: "Connected to Meridian real-time feed" },
      timestamp: Date.now(),
    };
    ws.send(JSON.stringify(welcome));

    ws.on("close", () => {
      clients.delete(ws);
    });

    ws.on("error", () => {
      clients.delete(ws);
    });

    // Handle incoming messages (e.g. subscription filters — stub for now).
    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(String(data)) as { action?: string };
        if (msg.action === "ping") {
          ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        }
      } catch {
        // Ignore malformed messages.
      }
    });
  });

  /** Broadcast an event to every connected client. */
  function broadcast(event: WsEvent): void {
    const frame = JSON.stringify(event);
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(frame);
      }
    }
  }

  /**
   * Start a mock feed that pushes fake price updates and agent events.
   * Returns a cleanup function to stop the interval.
   */
  function startMockFeed(): () => void {
    const tokens = ["ETH", "BTC", "ARB", "OP", "MATIC"];
    const basePrices: Record<string, number> = {
      ETH: 3_400,
      BTC: 97_000,
      ARB: 0.85,
      OP: 1.60,
      MATIC: 0.42,
    };

    const priceInterval = setInterval(() => {
      for (const token of tokens) {
        const base = basePrices[token] ?? 1;
        const jitter = (Math.random() - 0.5) * base * 0.002;
        basePrices[token] = base + jitter;

        broadcast({
          type: "price:update",
          payload: {
            token,
            priceUsd: basePrices[token],
            chainId: 1,
            source: "mock",
          },
          timestamp: Date.now(),
        });
      }
    }, 2_000);

    const agentStates = ["IDLE", "SENSING", "THINKING", "ACTING", "REFLECTING"];
    const agentInterval = setInterval(() => {
      const state = agentStates[Math.floor(Math.random() * agentStates.length)];
      broadcast({
        type: "agent:stateChange",
        payload: {
          agentId: "agent-001",
          previousState: "IDLE",
          newState: state,
          cycleCount: Math.floor(Math.random() * 2_000),
        },
        timestamp: Date.now(),
      });
    }, 5_000);

    return () => {
      clearInterval(priceInterval);
      clearInterval(agentInterval);
    };
  }

  return { wss, broadcast, startMockFeed };
}
