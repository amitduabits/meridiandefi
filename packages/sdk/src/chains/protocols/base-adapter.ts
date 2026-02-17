// ---------------------------------------------------------------------------
// IProtocolAdapter — base interface for DeFi protocol integrations.
// ---------------------------------------------------------------------------

import type { DecodedEvent } from "../../types/chain.js";
import type { QuoteResult } from "../connector.js";

// ---------------------------------------------------------------------------
// Protocol action enumeration
// ---------------------------------------------------------------------------

export type ProtocolAction =
  | "swap"
  | "addLiquidity"
  | "removeLiquidity"
  | "supply"
  | "borrow"
  | "repay"
  | "withdraw"
  | "stake"
  | "unstake"
  | "bridge";

// ---------------------------------------------------------------------------
// Encoded call data returned by adapters
// ---------------------------------------------------------------------------

export interface EncodedTransaction {
  /** Target contract address. */
  to: string;
  /** ABI-encoded calldata. */
  data: string;
  /** ETH value to send (for payable calls). */
  value: bigint;
}

// ---------------------------------------------------------------------------
// IProtocolAdapter
// ---------------------------------------------------------------------------

export interface IProtocolAdapter {
  /** Unique identifier for this protocol (e.g. "uniswap-v3", "aave-v3"). */
  readonly protocolId: string;

  /** Chain IDs this adapter supports. */
  readonly supportedChains: readonly number[];

  /** Actions this adapter can perform. */
  readonly supportedActions: readonly ProtocolAction[];

  /**
   * Encode an action into raw calldata that can be submitted to the chain.
   *
   * @param action  - The DeFi action to encode.
   * @param params  - Protocol-specific parameters for the action.
   * @returns Encoded transaction data ready for submission.
   */
  encode(
    action: ProtocolAction,
    params: Record<string, unknown>,
  ): Promise<EncodedTransaction>;

  /**
   * Decode raw transaction logs into structured events.
   *
   * @param logs - Raw log entries from a transaction receipt.
   * @returns Decoded events with human-readable names and typed arguments.
   */
  decode(
    logs: Array<{ address: string; topics: string[]; data: string }>,
  ): DecodedEvent[];

  /**
   * Get a quote / preview for a DeFi action without executing it.
   *
   * @param params - Protocol-specific parameters for quoting.
   * @returns Quote with expected output, price impact, etc.
   */
  quote(params: Record<string, unknown>): Promise<QuoteResult>;
}
