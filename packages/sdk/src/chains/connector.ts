// ---------------------------------------------------------------------------
// IDeFiConnector — unified interface for all DeFi chain interactions.
// ---------------------------------------------------------------------------

import type {
  TokenId,
  PriceData,
  Position,
  SwapParams,
  TxResult,
  SimulationResult,
} from "../types/chain.js";

// ---------------------------------------------------------------------------
// Additional param types for DeFi operations
// ---------------------------------------------------------------------------

export interface QuoteResult {
  amountOut: bigint;
  priceImpactBps: number;
  route: string[];
  estimatedGas: bigint;
  protocol: string;
}

export interface LiquidityParams {
  tokenA: TokenId;
  tokenB: TokenId;
  amountA: bigint;
  amountB: bigint;
  /** Fee tier in basis points (e.g. 500, 3000, 10000 for Uniswap V3). */
  feeBps?: number;
  chainId: number;
  protocol?: string;
  /** Lower tick for concentrated liquidity (Uniswap V3). */
  tickLower?: number;
  /** Upper tick for concentrated liquidity (Uniswap V3). */
  tickUpper?: number;
}

export interface BorrowParams {
  token: TokenId;
  amount: bigint;
  chainId: number;
  /** Collateral token to deposit alongside borrow. */
  collateralToken?: TokenId;
  collateralAmount?: bigint;
  /** Interest rate mode: 1 = stable, 2 = variable (Aave convention). */
  interestRateMode?: number;
  protocol?: string;
}

export interface StakeParams {
  token: TokenId;
  amount: bigint;
  chainId: number;
  protocol?: string;
  /** Validator address for proof-of-stake chains. */
  validator?: string;
}

export interface BridgeParams {
  token: TokenId;
  amount: bigint;
  sourceChainId: number;
  destinationChainId: number;
  recipient?: string;
  protocol?: string;
}

export interface RepayParams {
  token: TokenId;
  amount: bigint;
  chainId: number;
  /** Interest rate mode: 1 = stable, 2 = variable (Aave convention). */
  interestRateMode?: number;
  protocol?: string;
}

// ---------------------------------------------------------------------------
// IDeFiConnector
// ---------------------------------------------------------------------------

export interface IDeFiConnector {
  /** Execute a token swap. */
  swap(params: SwapParams): Promise<TxResult>;

  /** Add liquidity to a pool. */
  addLiquidity(params: LiquidityParams): Promise<TxResult>;

  /** Remove liquidity from a pool. */
  removeLiquidity(params: LiquidityParams): Promise<TxResult>;

  /** Borrow tokens from a lending protocol. */
  borrow(params: BorrowParams): Promise<TxResult>;

  /** Repay a borrow position. */
  repay(params: RepayParams): Promise<TxResult>;

  /** Stake tokens. */
  stake(params: StakeParams): Promise<TxResult>;

  /** Bridge tokens cross-chain. */
  bridge(params: BridgeParams): Promise<TxResult>;

  /** Get price data for a token on a given chain. */
  getPrice(token: TokenId, chainId: number): Promise<PriceData>;

  /** Get balance of a token for an address on a given chain. */
  getBalance(address: string, token: TokenId, chainId: number): Promise<bigint>;

  /** Get all positions for an address on a given chain. */
  getPositions(address: string, chainId: number): Promise<Position[]>;

  /** Simulate a transaction without broadcasting. */
  simulate(txData: unknown): Promise<SimulationResult>;

  /** Submit a signed transaction to the network. */
  submit(txData: unknown): Promise<TxResult>;
}
