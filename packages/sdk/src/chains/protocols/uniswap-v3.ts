// ---------------------------------------------------------------------------
// UniswapV3Adapter — protocol adapter for Uniswap V3 (SwapRouter02).
// ---------------------------------------------------------------------------

import { encodeFunctionData, decodeEventLog, parseAbi } from "viem";
import type { DecodedEvent } from "../../types/chain.js";
import type { QuoteResult } from "../connector.js";
import { ChainError } from "../../core/errors.js";
import { createLogger } from "../../core/logger.js";
import type pino from "pino";
import type {
  IProtocolAdapter,
  ProtocolAction,
  EncodedTransaction,
} from "./base-adapter.js";

// ---------------------------------------------------------------------------
// Contract addresses per chain
// ---------------------------------------------------------------------------

const SWAP_ROUTER_02: Readonly<Record<number, string>> = {
  1: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  42161: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  8453: "0x2626664c2603336E57B271c5C0b26F421741e481",
  10: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  137: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
};

const NONFUNGIBLE_POSITION_MANAGER: Readonly<Record<number, string>> = {
  1: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
  42161: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
  8453: "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1",
  10: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
  137: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
};

// ---------------------------------------------------------------------------
// ABI fragments — SwapRouter02
// ---------------------------------------------------------------------------

export const SWAP_ROUTER_ABI = parseAbi([
  // exactInputSingle
  "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
  // exactInput (multi-hop)
  "function exactInput((bytes path, address recipient, uint256 amountIn, uint256 amountOutMinimum)) external payable returns (uint256 amountOut)",
  // exactOutputSingle
  "function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountIn)",
  // multicall
  "function multicall(uint256 deadline, bytes[] data) external payable returns (bytes[] results)",
]);

// ---------------------------------------------------------------------------
// ABI fragments — NonfungiblePositionManager (liquidity)
// ---------------------------------------------------------------------------

export const POSITION_MANAGER_ABI = parseAbi([
  // mint (add new position)
  "function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
  // increaseLiquidity
  "function increaseLiquidity((uint256 tokenId, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) external payable returns (uint128 liquidity, uint256 amount0, uint256 amount1)",
]);

// ---------------------------------------------------------------------------
// Event ABI for decoding
// ---------------------------------------------------------------------------

const SWAP_EVENT_ABI = parseAbi([
  "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
]);

// ---------------------------------------------------------------------------
// Supported chains and actions
// ---------------------------------------------------------------------------

const SUPPORTED_CHAINS = [1, 42161, 8453, 10, 137] as const;

const SUPPORTED_ACTIONS: readonly ProtocolAction[] = [
  "swap",
  "addLiquidity",
] as const;

// ---------------------------------------------------------------------------
// UniswapV3Adapter
// ---------------------------------------------------------------------------

export class UniswapV3Adapter implements IProtocolAdapter {
  readonly protocolId = "uniswap-v3";
  readonly supportedChains: readonly number[] = SUPPORTED_CHAINS;
  readonly supportedActions: readonly ProtocolAction[] = SUPPORTED_ACTIONS;

  private log: pino.Logger;

  constructor() {
    this.log = createLogger({ module: "uniswap-v3-adapter" });
  }

  // -----------------------------------------------------------------------
  // IProtocolAdapter.encode
  // -----------------------------------------------------------------------

  async encode(
    action: ProtocolAction,
    params: Record<string, unknown>,
  ): Promise<EncodedTransaction> {
    switch (action) {
      case "swap":
        return this.encodeSwap(params);
      case "addLiquidity":
        return this.encodeAddLiquidity(params);
      default:
        throw new ChainError(
          `Uniswap V3 does not support action: ${action}`,
          {
            code: "PROTOCOL_UNSUPPORTED_ACTION",
            recoverable: false,
            context: { protocol: this.protocolId, action },
          },
        );
    }
  }

  // -----------------------------------------------------------------------
  // IProtocolAdapter.decode
  // -----------------------------------------------------------------------

  decode(
    logs: Array<{ address: string; topics: string[]; data: string }>,
  ): DecodedEvent[] {
    const decoded: DecodedEvent[] = [];

    for (const log of logs) {
      try {
        const event = decodeEventLog({
          abi: SWAP_EVENT_ABI,
          data: log.data as `0x${string}`,
          topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
        });
        decoded.push({
          name: event.eventName,
          args: event.args as unknown as Record<string, unknown>,
          address: log.address,
        });
      } catch {
        // Log entry doesn't match known Uniswap V3 events — skip.
      }
    }

    return decoded;
  }

  // -----------------------------------------------------------------------
  // IProtocolAdapter.quote
  // -----------------------------------------------------------------------

  async quote(params: Record<string, unknown>): Promise<QuoteResult> {
    // In production this would call the Quoter V2 contract on-chain.
    // For now we return a placeholder that the framework can build upon.
    const chainId = params["chainId"] as number | undefined;
    this.validateChain(chainId ?? 0);

    return {
      amountOut: 0n,
      priceImpactBps: 0,
      route: [
        String(params["tokenIn"] ?? ""),
        String(params["tokenOut"] ?? ""),
      ],
      estimatedGas: 200_000n,
      protocol: this.protocolId,
    };
  }

  // -----------------------------------------------------------------------
  // Swap encoding
  // -----------------------------------------------------------------------

  /**
   * Encode a swap via SwapRouter02.exactInputSingle.
   *
   * Required params:
   *   tokenIn    - address
   *   tokenOut   - address
   *   fee        - uint24 pool fee tier (500, 3000, 10000)
   *   recipient  - address
   *   amountIn   - bigint
   *   amountOutMinimum - bigint
   *   chainId    - number
   *
   * Optional:
   *   sqrtPriceLimitX96 - bigint (default 0 = no limit)
   *   deadline   - number (unix seconds, default 20 min from now)
   *   value      - bigint (for native ETH swaps)
   */
  encodeSwap(params: Record<string, unknown>): EncodedTransaction {
    const chainId = params["chainId"] as number;
    this.validateChain(chainId);

    const routerAddress = this.getRouterAddress(chainId);

    const swapParams = {
      tokenIn: params["tokenIn"] as `0x${string}`,
      tokenOut: params["tokenOut"] as `0x${string}`,
      fee: params["fee"] as number ?? 3000,
      recipient: params["recipient"] as `0x${string}`,
      amountIn: params["amountIn"] as bigint,
      amountOutMinimum: params["amountOutMinimum"] as bigint ?? 0n,
      sqrtPriceLimitX96: params["sqrtPriceLimitX96"] as bigint ?? 0n,
    };

    const deadline = (params["deadline"] as number) ??
      Math.floor(Date.now() / 1000) + 20 * 60;

    // Encode the exactInputSingle call, then wrap in multicall with deadline.
    const innerCalldata = encodeFunctionData({
      abi: SWAP_ROUTER_ABI,
      functionName: "exactInputSingle",
      args: [swapParams],
    });

    const calldata = encodeFunctionData({
      abi: SWAP_ROUTER_ABI,
      functionName: "multicall",
      args: [BigInt(deadline), [innerCalldata]],
    });

    const value = (params["value"] as bigint) ?? 0n;

    this.log.info(
      {
        chainId,
        tokenIn: swapParams.tokenIn,
        tokenOut: swapParams.tokenOut,
        amountIn: swapParams.amountIn.toString(),
      },
      "Swap encoded",
    );

    return { to: routerAddress, data: calldata, value };
  }

  // -----------------------------------------------------------------------
  // Liquidity encoding
  // -----------------------------------------------------------------------

  /**
   * Encode an addLiquidity call via NonfungiblePositionManager.mint.
   *
   * Required params:
   *   token0, token1     - addresses (must be sorted)
   *   fee                - uint24
   *   tickLower, tickUpper - int24
   *   amount0Desired, amount1Desired - bigint
   *   recipient          - address
   *   chainId            - number
   *
   * Optional:
   *   amount0Min, amount1Min - bigint (default 0)
   *   deadline            - number
   *   value               - bigint
   */
  encodeAddLiquidity(params: Record<string, unknown>): EncodedTransaction {
    const chainId = params["chainId"] as number;
    this.validateChain(chainId);

    const posManagerAddress = this.getPositionManagerAddress(chainId);

    const deadline = (params["deadline"] as number) ??
      Math.floor(Date.now() / 1000) + 20 * 60;

    const mintParams = {
      token0: params["token0"] as `0x${string}`,
      token1: params["token1"] as `0x${string}`,
      fee: params["fee"] as number ?? 3000,
      tickLower: params["tickLower"] as number ?? -887220,
      tickUpper: params["tickUpper"] as number ?? 887220,
      amount0Desired: params["amount0Desired"] as bigint,
      amount1Desired: params["amount1Desired"] as bigint,
      amount0Min: (params["amount0Min"] as bigint) ?? 0n,
      amount1Min: (params["amount1Min"] as bigint) ?? 0n,
      recipient: params["recipient"] as `0x${string}`,
      deadline: BigInt(deadline),
    };

    const calldata = encodeFunctionData({
      abi: POSITION_MANAGER_ABI,
      functionName: "mint",
      args: [mintParams],
    });

    const value = (params["value"] as bigint) ?? 0n;

    this.log.info(
      {
        chainId,
        token0: mintParams.token0,
        token1: mintParams.token1,
        fee: mintParams.fee,
      },
      "Add liquidity encoded",
    );

    return { to: posManagerAddress, data: calldata, value };
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private validateChain(chainId: number): void {
    if (!SUPPORTED_CHAINS.includes(chainId as (typeof SUPPORTED_CHAINS)[number])) {
      throw new ChainError(
        `Uniswap V3 is not deployed on chain ${chainId}`,
        {
          code: "PROTOCOL_CHAIN_UNSUPPORTED",
          recoverable: false,
          context: {
            protocol: this.protocolId,
            chainId,
            supportedChains: [...SUPPORTED_CHAINS],
          },
        },
      );
    }
  }

  private getRouterAddress(chainId: number): string {
    const addr = SWAP_ROUTER_02[chainId];
    if (!addr) {
      throw new ChainError(
        `No SwapRouter02 address for chain ${chainId}`,
        {
          code: "PROTOCOL_ADDRESS_MISSING",
          recoverable: false,
          context: { protocol: this.protocolId, chainId },
        },
      );
    }
    return addr;
  }

  private getPositionManagerAddress(chainId: number): string {
    const addr = NONFUNGIBLE_POSITION_MANAGER[chainId];
    if (!addr) {
      throw new ChainError(
        `No NonfungiblePositionManager address for chain ${chainId}`,
        {
          code: "PROTOCOL_ADDRESS_MISSING",
          recoverable: false,
          context: { protocol: this.protocolId, chainId },
        },
      );
    }
    return addr;
  }
}
