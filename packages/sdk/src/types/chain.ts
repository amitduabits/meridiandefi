// ---------------------------------------------------------------------------
// Chain identifiers — the canonical set of chains Meridian supports.
// ---------------------------------------------------------------------------

export const ChainId = {
  ETHEREUM: 1,
  ETHEREUM_SEPOLIA: 11155111,
  ARBITRUM_ONE: 42161,
  ARBITRUM_SEPOLIA: 421614,
  BASE: 8453,
  OPTIMISM: 10,
  POLYGON: 137,
  AVALANCHE: 43114,
  // Solana uses a string-based identifier — represented here as a sentinel.
  SOLANA_MAINNET: -1,
  SOLANA_DEVNET: -2,
} as const;

export type ChainId = (typeof ChainId)[keyof typeof ChainId];

// ---------------------------------------------------------------------------
// Token
// ---------------------------------------------------------------------------

export interface TokenId {
  symbol: string;
  address: string;
  chainId: number;
  decimals: number;
}

// ---------------------------------------------------------------------------
// Price data
// ---------------------------------------------------------------------------

export interface PriceData {
  token: string;
  priceUsd: number;
  chainId: number;
  timestamp: number;
  source: string;
}

// ---------------------------------------------------------------------------
// Position
// ---------------------------------------------------------------------------

export interface Position {
  token: TokenId;
  balance: bigint;
  valueUsd: number;
  chainId: number;
  protocol?: string;
  /** Position type: spot, lp, lent, borrowed, staked. */
  positionType: "spot" | "lp" | "lent" | "borrowed" | "staked";
}

// ---------------------------------------------------------------------------
// Swap parameters
// ---------------------------------------------------------------------------

export interface SwapParams {
  tokenIn: TokenId;
  tokenOut: TokenId;
  amountIn: bigint;
  /** Maximum acceptable slippage in basis points. */
  maxSlippageBps: number;
  chainId: number;
  protocol?: string;
  /** Optional deadline timestamp for the swap. */
  deadline?: number;
}

// ---------------------------------------------------------------------------
// Transaction result
// ---------------------------------------------------------------------------

export interface TxResult {
  hash: string;
  chainId: number;
  status: "pending" | "confirmed" | "failed";
  blockNumber?: number;
  gasUsed?: bigint;
  effectiveGasPrice?: bigint;
  timestamp?: number;
  events?: DecodedEvent[];
}

export interface DecodedEvent {
  name: string;
  args: Record<string, unknown>;
  address: string;
}

// ---------------------------------------------------------------------------
// Simulation result
// ---------------------------------------------------------------------------

export interface SimulationResult {
  success: boolean;
  gasEstimate: bigint;
  returnData?: unknown;
  error?: string;
}
