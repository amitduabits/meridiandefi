// ---------------------------------------------------------------------------
// Sign-In With Ethereum (SIWE) authentication helpers.
// ---------------------------------------------------------------------------

import { SiweMessage } from "siwe";
import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Session store  (in-memory for MVP; swap for Redis in production)
// ---------------------------------------------------------------------------

export interface SiweSession {
  address: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expiresAt: string | undefined;
}

/** Map from session-token to session data. */
const sessions = new Map<string, SiweSession>();

/** Map from nonce to creation timestamp (for replay-attack prevention). */
const pendingNonces = new Map<string, number>();

// ---------------------------------------------------------------------------
// Nonce management
// ---------------------------------------------------------------------------

export function generateNonce(): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  pendingNonces.set(nonce, Date.now());
  return nonce;
}

function consumeNonce(nonce: string): boolean {
  const created = pendingNonces.get(nonce);
  if (created === undefined) return false;
  pendingNonces.delete(nonce);
  // Nonces older than 5 minutes are invalid.
  return Date.now() - created < 5 * 60 * 1_000;
}

// ---------------------------------------------------------------------------
// Verify a SIWE message + signature, create a session.
// ---------------------------------------------------------------------------

export interface VerifyResult {
  ok: boolean;
  sessionToken?: string;
  session?: SiweSession;
  error?: string;
}

export async function verifySiweMessage(
  message: string,
  signature: string,
): Promise<VerifyResult> {
  try {
    const siweMessage = new SiweMessage(message);
    const result = await siweMessage.verify({ signature });

    if (!result.success) {
      return { ok: false, error: result.error?.type ?? "Verification failed" };
    }

    if (!consumeNonce(siweMessage.nonce)) {
      return { ok: false, error: "Invalid or expired nonce" };
    }

    const sessionToken = crypto.randomBytes(32).toString("hex");
    const session: SiweSession = {
      address: siweMessage.address,
      chainId: siweMessage.chainId,
      nonce: siweMessage.nonce,
      issuedAt: siweMessage.issuedAt ?? new Date().toISOString(),
      expiresAt: siweMessage.expirationTime,
    };

    sessions.set(sessionToken, session);
    return { ok: true, sessionToken, session };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Session lookup
// ---------------------------------------------------------------------------

export function getSession(token: string | undefined): SiweSession | null {
  if (!token) return null;
  const session = sessions.get(token) ?? null;
  if (!session) return null;

  // Check expiry
  if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function destroySession(token: string): boolean {
  return sessions.delete(token);
}
