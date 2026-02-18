// ---------------------------------------------------------------------------
// @meridian/server — Express + tRPC + WebSocket entry point.
// ---------------------------------------------------------------------------

import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./trpc/router.js";
import { createContext } from "./trpc/context.js";
import { generateNonce, verifySiweMessage, destroySession } from "./auth/siwe.js";
import { createWsHandler } from "./ws/handler.js";

// Re-export the router type so the dashboard can import it directly.
export type { AppRouter } from "./trpc/router.js";

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------

const app = express();

// Allow origins from CORS_ORIGINS env var (comma-separated) or permissive for local dev.
const corsOrigins = process.env["CORS_ORIGINS"]
  ? process.env["CORS_ORIGINS"].split(",").map((o) => o.trim())
  : true;
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());

// ---------------------------------------------------------------------------
// SIWE auth REST endpoints (not tRPC — standard REST for wallet flows).
// ---------------------------------------------------------------------------

app.get("/auth/nonce", (_req, res) => {
  const nonce = generateNonce();
  res.json({ nonce });
});

app.post("/auth/verify", async (req, res) => {
  const { message, signature } = req.body as {
    message?: string;
    signature?: string;
  };

  if (!message || !signature) {
    res.status(400).json({ ok: false, error: "message and signature are required" });
    return;
  }

  const result = await verifySiweMessage(message, signature);
  if (!result.ok) {
    res.status(401).json({ ok: false, error: result.error });
    return;
  }

  res.json({
    ok: true,
    sessionToken: result.sessionToken,
    address: result.session?.address,
  });
});

app.post("/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  if (token) {
    destroySession(token);
  }
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// tRPC adapter
// ---------------------------------------------------------------------------

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

// ---------------------------------------------------------------------------
// Health endpoint (outside tRPC for load-balancer probes).
// ---------------------------------------------------------------------------

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// Static file serving — serve the dashboard build in production.
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));

// Look for dashboard dist in common locations.
const dashboardPaths = [
  resolve(__dirname, "../../dashboard/dist"),        // from packages/server/dist/
  resolve(__dirname, "../../../packages/dashboard/dist"), // fallback
  resolve(process.cwd(), "packages/dashboard/dist"),     // from repo root
];

const dashboardDir = dashboardPaths.find((p) => existsSync(p));

if (dashboardDir) {
  console.log(`[meridian] Serving dashboard from ${dashboardDir}`);

  // Serve static assets with caching headers.
  app.use(
    "/assets",
    express.static(resolve(dashboardDir, "assets"), {
      maxAge: "1y",
      immutable: true,
    }),
  );

  // Serve other static files (favicon, etc.).
  app.use(express.static(dashboardDir, { index: false }));

  // SPA fallback — serve index.html for all non-API routes.
  app.get("*", (_req, res) => {
    res.sendFile(resolve(dashboardDir, "index.html"));
  });
} else {
  console.log("[meridian] Dashboard not found — API-only mode.");
  app.get("/", (_req, res) => {
    res.json({
      name: "Meridian API",
      version: "0.1.0",
      endpoints: {
        trpc: "/trpc",
        auth: "/auth",
        health: "/health",
        ws: "ws://[host]/ws",
      },
    });
  });
}

// ---------------------------------------------------------------------------
// HTTP + WebSocket server
// ---------------------------------------------------------------------------

const PORT = Number(process.env["PORT"] ?? 3001);

const httpServer = createServer(app);
const { startMockFeed } = createWsHandler(httpServer);

httpServer.listen(PORT, () => {
  console.log(`[meridian] API server listening on http://localhost:${PORT}`);
  console.log(`[meridian] tRPC endpoint:  http://localhost:${PORT}/trpc`);
  console.log(`[meridian] WebSocket feed: ws://localhost:${PORT}/ws`);

  // Start mock real-time feed for development.
  const stopFeed = startMockFeed();

  // Graceful shutdown.
  const shutdown = () => {
    console.log("\n[meridian] Shutting down...");
    stopFeed();
    httpServer.close(() => {
      console.log("[meridian] Server closed.");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
});
