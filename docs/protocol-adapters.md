# Protocol Adapters

Protocol adapters are the bridge between Meridian agents and DeFi protocols. This document covers the adapter architecture, the built-in adapters, the unified `IDeFiConnector` interface, and how to write custom adapters for new protocols.

## Architecture

Meridian uses a two-layer abstraction for chain interactions:

```
Agent
  └── IDeFiConnector (unified interface)
        ├── EVMProvider (viem-based client management)
        │     ├── PublicClient (read operations)
        │     └── WalletClient (write operations)
        └── IProtocolAdapter (per-protocol encoding)
              ├── UniswapV3Adapter
              ├── AaveV3Adapter
              ├── CurveAdapter
              ├── LidoAdapter
              └── JupiterAdapter (Solana)
```

**EVMProvider** manages viem client instances per chain. It lazily creates `PublicClient` (for reads) and `WalletClient` (for writes) and provides low-level operations like `getBalance`, `getBlock`, `estimateGas`, `sendTransaction`, and `waitForReceipt`.

**IProtocolAdapter** handles protocol-specific encoding and decoding. Each adapter converts high-level DeFi actions into ABI-encoded calldata that can be submitted on-chain.

## The IDeFiConnector Interface

This is the top-level interface that agents interact with. It provides a protocol-agnostic API for all DeFi operations:

```typescript
interface IDeFiConnector {
  swap(params: SwapParams): Promise<TxResult>;
  addLiquidity(params: LiquidityParams): Promise<TxResult>;
  removeLiquidity(params: LiquidityParams): Promise<TxResult>;
  borrow(params: BorrowParams): Promise<TxResult>;
  repay(params: RepayParams): Promise<TxResult>;
  stake(params: StakeParams): Promise<TxResult>;
  bridge(params: BridgeParams): Promise<TxResult>;
  getPrice(token: TokenId, chainId: number): Promise<PriceData>;
  getBalance(address: string, token: TokenId, chainId: number): Promise<bigint>;
  getPositions(address: string, chainId: number): Promise<Position[]>;
  simulate(txData: unknown): Promise<SimulationResult>;
  submit(txData: unknown): Promise<TxResult>;
}
```

### Parameter Types

**SwapParams:**

```typescript
interface SwapParams {
  tokenIn: TokenId;
  tokenOut: TokenId;
  amountIn: bigint;
  maxSlippageBps: number;   // Maximum slippage in basis points
  chainId: number;
  protocol?: string;        // e.g. "uniswap-v3"
  deadline?: number;        // Unix timestamp
}
```

**LiquidityParams:**

```typescript
interface LiquidityParams {
  tokenA: TokenId;
  tokenB: TokenId;
  amountA: bigint;
  amountB: bigint;
  feeBps?: number;          // Pool fee tier (500, 3000, 10000)
  chainId: number;
  protocol?: string;
  tickLower?: number;       // Concentrated liquidity (Uniswap V3)
  tickUpper?: number;
}
```

**BorrowParams:**

```typescript
interface BorrowParams {
  token: TokenId;
  amount: bigint;
  chainId: number;
  collateralToken?: TokenId;
  collateralAmount?: bigint;
  interestRateMode?: number;  // 1 = stable, 2 = variable (Aave)
  protocol?: string;
}
```

## EVMProvider

The `EVMProvider` class manages multi-chain EVM connections using viem:

```typescript
import { EVMProvider } from "@meridian/sdk";

// Use default configurations
const provider = new EVMProvider();

// Or override RPC URLs per chain
const provider = new EVMProvider({
  1: { rpcUrl: "https://my-eth-rpc.com" },
  42161: { rpcUrl: "https://my-arb-rpc.com" },
});
```

### Supported Chains

| Chain | Chain ID | Default RPC |
|-------|----------|-------------|
| Ethereum | 1 | `https://eth.llamarpc.com` |
| Ethereum Sepolia | 11155111 | `https://rpc.sepolia.org` |
| Arbitrum One | 42161 | `https://arb1.arbitrum.io/rpc` |
| Arbitrum Sepolia | 421614 | `https://sepolia-rollup.arbitrum.io/rpc` |
| Base | 8453 | `https://mainnet.base.org` |
| Optimism | 10 | `https://mainnet.optimism.io` |
| Polygon | 137 | `https://polygon-rpc.com` |
| Avalanche | 43114 | `https://api.avax.network/ext/bc/C/rpc` |

### Common Operations

```typescript
// Get native balance
const balance = await provider.getBalance("0x...", 42161);

// Get latest block
const block = await provider.getBlock(42161);

// Estimate gas
const gas = await provider.estimateGas({
  to: "0x...",
  data: "0x...",
  value: 0n,
}, 42161);

// Send transaction
const hash = await provider.sendTransaction({
  to: "0x...",
  data: "0x...",
  from: "0x...",
  value: 0n,
}, 42161);

// Wait for confirmation
const receipt = await provider.waitForReceipt(hash, 42161, 1);
```

## The IProtocolAdapter Interface

Each adapter implements this interface:

```typescript
interface IProtocolAdapter {
  readonly protocolId: string;
  readonly supportedChains: readonly number[];
  readonly supportedActions: readonly ProtocolAction[];

  encode(action: ProtocolAction, params: Record<string, unknown>): Promise<EncodedTransaction>;
  decode(logs: Array<{ address: string; topics: string[]; data: string }>): DecodedEvent[];
  quote(params: Record<string, unknown>): Promise<QuoteResult>;
}
```

The `encode()` method returns an `EncodedTransaction`:

```typescript
interface EncodedTransaction {
  to: string;      // Target contract address
  data: string;    // ABI-encoded calldata
  value: bigint;   // ETH value (for payable calls)
}
```

## Built-in Adapters

### Uniswap V3

The `UniswapV3Adapter` supports swaps and liquidity provision via the SwapRouter02 and NonfungiblePositionManager contracts.

**Supported chains:** Ethereum (1), Arbitrum (42161), Base (8453), Optimism (10), Polygon (137).

**Supported actions:** `swap`, `addLiquidity`.

**Swap encoding:**

```typescript
import { UniswapV3Adapter } from "@meridian/sdk";

const adapter = new UniswapV3Adapter();

const tx = await adapter.encode("swap", {
  tokenIn: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",   // USDC
  tokenOut: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",  // WETH
  fee: 3000,              // 0.3% fee tier
  recipient: "0x...",
  amountIn: 1000000000n,  // 1000 USDC (6 decimals)
  amountOutMinimum: 0n,
  chainId: 1,
});

// tx.to   -> SwapRouter02 address
// tx.data -> ABI-encoded multicall with exactInputSingle
// tx.value -> 0n (no ETH needed for USDC -> WETH)
```

The adapter wraps `exactInputSingle` calls inside a `multicall` with a deadline (defaults to 20 minutes from encoding time).

**Liquidity provision:**

```typescript
const tx = await adapter.encode("addLiquidity", {
  token0: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  token1: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  fee: 3000,
  tickLower: -887220,     // Full range
  tickUpper: 887220,
  amount0Desired: 1000000000n,
  amount1Desired: 500000000000000000n,
  recipient: "0x...",
  chainId: 1,
});
```

**Quoting:**

```typescript
const quote = await adapter.quote({
  tokenIn: "0xA0b8...",
  tokenOut: "0xC02a...",
  chainId: 1,
});
// Returns: { amountOut, priceImpactBps, route, estimatedGas, protocol }
```

### Aave V3

Lending, borrowing, and repayment on Aave V3 with support for both stable and variable rate modes.

### Curve

Stable-swap and multi-asset pool interactions via Curve's routing contracts.

### Lido

Liquid staking of ETH via Lido's stETH contract with wrap/unwrap support.

### Jupiter (Solana)

Token swaps on Solana via Jupiter's aggregation API, using `@solana/web3.js` for transaction construction.

## Writing a Custom Adapter

To add support for a new protocol, implement `IProtocolAdapter`:

```typescript
import type {
  IProtocolAdapter,
  ProtocolAction,
  EncodedTransaction,
} from "@meridian/sdk";
import type { DecodedEvent } from "@meridian/sdk";
import type { QuoteResult } from "@meridian/sdk";
import { encodeFunctionData, parseAbi } from "viem";

const MY_ABI = parseAbi([
  "function deposit(address token, uint256 amount) external returns (uint256)",
]);

export class MyProtocolAdapter implements IProtocolAdapter {
  readonly protocolId = "my-protocol";
  readonly supportedChains = [1, 42161] as const;
  readonly supportedActions: readonly ProtocolAction[] = ["supply", "withdraw"];

  async encode(
    action: ProtocolAction,
    params: Record<string, unknown>,
  ): Promise<EncodedTransaction> {
    switch (action) {
      case "supply":
        return this.encodeSupply(params);
      case "withdraw":
        return this.encodeWithdraw(params);
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  }

  decode(logs: Array<{ address: string; topics: string[]; data: string }>): DecodedEvent[] {
    // Decode protocol-specific events from transaction logs
    return [];
  }

  async quote(params: Record<string, unknown>): Promise<QuoteResult> {
    return {
      amountOut: 0n,
      priceImpactBps: 0,
      route: [],
      estimatedGas: 150_000n,
      protocol: this.protocolId,
    };
  }

  private encodeSupply(params: Record<string, unknown>): EncodedTransaction {
    const data = encodeFunctionData({
      abi: MY_ABI,
      functionName: "deposit",
      args: [
        params["token"] as `0x${string}`,
        params["amount"] as bigint,
      ],
    });

    return {
      to: "0x...", // Protocol contract address
      data,
      value: 0n,
    };
  }

  private encodeWithdraw(params: Record<string, unknown>): EncodedTransaction {
    // Similar encoding for withdrawal
    return { to: "0x...", data: "0x", value: 0n };
  }
}
```

### Registration

Register your adapter with the agent's chain connector:

```typescript
const myAdapter = new MyProtocolAdapter();
// The adapter is now available for use in strategy actions
// with protocol: "my-protocol"
```

### Best Practices

1. **Use viem's `encodeFunctionData`** for ABI encoding -- it provides type safety and handles all Solidity types correctly.

2. **Validate chain support** early -- check `chainId` in `encode()` and throw a `ChainError` with `recoverable: false` if the protocol is not deployed on that chain.

3. **Keep contract addresses in a const map** keyed by chain ID, following the pattern used by `UniswapV3Adapter`.

4. **Implement `decode()`** to parse protocol-specific events from transaction receipts. This enables the agent's Reflect phase to understand what actually happened on-chain.

5. **Return accurate gas estimates** from `quote()` -- the risk module uses these to validate gas costs before execution.

## Gas Estimation

The `GasEstimator` provides EIP-1559 fee estimation:

```typescript
import { GasEstimator } from "@meridian/sdk";

const estimator = new GasEstimator(provider);
const fees = await estimator.estimate(42161);
// Returns: { maxFeePerGas, maxPriorityFeePerGas, gasPrice }
```

## Nonce Management

The `NonceManager` handles concurrent transaction nonce tracking to prevent nonce collisions when an agent submits multiple transactions in rapid succession:

```typescript
import { NonceManager } from "@meridian/sdk";

const nonce = new NonceManager(provider);
const nextNonce = await nonce.next("0x...", 42161);
```
