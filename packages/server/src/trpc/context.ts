// ---------------------------------------------------------------------------
// tRPC context — created per-request, carries auth + service references.
// ---------------------------------------------------------------------------

import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { getSession } from "../auth/siwe.js";
import type { SiweSession } from "../auth/siwe.js";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export interface Context {
  /** Authenticated SIWE session, or null if unauthenticated. */
  session: SiweSession | null;
  /** Convenience: the connected wallet address, or null. */
  address: string | null;
}

// ---------------------------------------------------------------------------
// Context factory — called by the tRPC adapter on every request.
// ---------------------------------------------------------------------------

export function createContext(
  opts: CreateExpressContextOptions,
): Context {
  const authHeader = opts.req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;

  const session = getSession(token);

  return {
    session,
    address: session?.address ?? null,
  };
}
