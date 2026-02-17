// ---------------------------------------------------------------------------
// NonceManager — per-chain, per-address nonce tracking with gap handling.
// ---------------------------------------------------------------------------

import type pino from "pino";
import { ChainError } from "../../core/errors.js";
import { createLogger } from "../../core/logger.js";
import type { EVMProvider } from "./provider.js";

// ---------------------------------------------------------------------------
// Internal key helper
// ---------------------------------------------------------------------------

function nonceKey(address: string, chainId: number): string {
  return `${address.toLowerCase()}:${chainId}`;
}

// ---------------------------------------------------------------------------
// Nonce state
// ---------------------------------------------------------------------------

interface NonceState {
  /** The next nonce to assign. */
  nextNonce: number;
  /** Nonces that have been assigned but not yet confirmed. */
  pending: Set<number>;
  /** Whether the local state has been initialized from chain. */
  initialized: boolean;
}

// ---------------------------------------------------------------------------
// NonceManager
// ---------------------------------------------------------------------------

export class NonceManager {
  private state = new Map<string, NonceState>();
  private provider: EVMProvider;
  private log: pino.Logger;

  constructor(provider: EVMProvider) {
    this.provider = provider;
    this.log = createLogger({ module: "nonce-manager" });
  }

  /**
   * Get the next nonce for an address on a chain.
   *
   * On first call the nonce is fetched from the chain. Subsequent calls
   * return a locally incremented value (optimistic nonce management)
   * so multiple transactions can be queued without waiting for confirmation.
   */
  async getNextNonce(address: string, chainId: number): Promise<number> {
    const key = nonceKey(address, chainId);
    let entry = this.state.get(key);

    if (!entry || !entry.initialized) {
      // Fetch on-chain nonce (= number of confirmed transactions from this address).
      const onChainNonce = await this.fetchOnChainNonce(address, chainId);
      entry = {
        nextNonce: onChainNonce,
        pending: new Set<number>(),
        initialized: true,
      };
      this.state.set(key, entry);
      this.log.debug(
        { address, chainId, nonce: onChainNonce },
        "Nonce initialized from chain",
      );
    }

    const nonce = entry.nextNonce;
    entry.pending.add(nonce);
    entry.nextNonce = nonce + 1;

    this.log.debug({ address, chainId, nonce }, "Nonce assigned");
    return nonce;
  }

  /**
   * Confirm that a nonce has been successfully mined.
   * Removes it from the pending set.
   */
  confirmNonce(address: string, chainId: number, nonce: number): void {
    const key = nonceKey(address, chainId);
    const entry = this.state.get(key);
    if (!entry) return;

    entry.pending.delete(nonce);
    this.log.debug({ address, chainId, nonce }, "Nonce confirmed");

    // Detect and handle gaps: if confirmed nonce is ahead of what
    // we expected, some intermediate nonces may have been mined
    // externally. Reconcile.
    this.reconcileGaps(entry, address, chainId);
  }

  /**
   * Reset local nonce tracking for an address/chain pair.
   * The next call to `getNextNonce` will re-fetch from the chain.
   */
  resetNonce(address: string, chainId: number): void {
    const key = nonceKey(address, chainId);
    this.state.delete(key);
    this.log.info({ address, chainId }, "Nonce state reset");
  }

  /**
   * Force-sync the local nonce state with the chain.
   * Useful after detecting errors like "nonce too low".
   */
  async syncWithChain(address: string, chainId: number): Promise<number> {
    const onChainNonce = await this.fetchOnChainNonce(address, chainId);
    const key = nonceKey(address, chainId);

    const entry: NonceState = {
      nextNonce: onChainNonce,
      pending: new Set<number>(),
      initialized: true,
    };
    this.state.set(key, entry);

    this.log.info(
      { address, chainId, nonce: onChainNonce },
      "Nonce synced with chain",
    );
    return onChainNonce;
  }

  /** Get current pending nonces for inspection / debugging. */
  getPendingNonces(address: string, chainId: number): number[] {
    const key = nonceKey(address, chainId);
    const entry = this.state.get(key);
    if (!entry) return [];
    return [...entry.pending].sort((a, b) => a - b);
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private async fetchOnChainNonce(
    address: string,
    chainId: number,
  ): Promise<number> {
    try {
      const client = this.provider.getPublicClient(chainId);
      const count = await client.getTransactionCount({
        address: address as `0x${string}`,
      });
      return count;
    } catch (err) {
      throw new ChainError(
        `Failed to fetch nonce for ${address} on chain ${chainId}`,
        {
          code: "CHAIN_NONCE_FETCH_ERROR",
          recoverable: true,
          context: { address, chainId },
          cause: err,
        },
      );
    }
  }

  /**
   * If the lowest pending nonce is lower than a confirmed one,
   * clean up stale entries. This handles the case where external
   * tools submitted transactions for the same account.
   */
  private reconcileGaps(
    entry: NonceState,
    address: string,
    chainId: number,
  ): void {
    if (entry.pending.size === 0) return;

    const sorted = [...entry.pending].sort((a, b) => a - b);
    const lowest = sorted[0];

    // If there are no gaps, nothing to do.
    if (lowest === undefined) return;

    // Check for gaps: if we have pending nonces [3, 5] (missing 4),
    // the gap nonce (4) might have been submitted externally.
    // We log a warning — the caller may want to re-sync.
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (prev !== undefined && curr !== undefined && curr - prev > 1) {
        this.log.warn(
          {
            address,
            chainId,
            gap: { from: prev + 1, to: curr - 1 },
          },
          "Nonce gap detected in pending set",
        );
      }
    }
  }
}
