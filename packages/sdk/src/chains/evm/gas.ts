// ---------------------------------------------------------------------------
// GasEstimator — EIP-1559 fee calculation with safety buffers.
// ---------------------------------------------------------------------------

import type pino from "pino";
import { ChainError } from "../../core/errors.js";
import { createLogger } from "../../core/logger.js";
import type { EVMProvider } from "./provider.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OptimalFees {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

export interface GasEstimateResult {
  gasLimit: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  /** Total maximum cost in wei: gasLimit * maxFeePerGas. */
  totalMaxCost: bigint;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** 20% buffer applied to gas estimates. */
const GAS_BUFFER_NUMERATOR = 120n;
const GAS_BUFFER_DENOMINATOR = 100n;

/** Default max gas price cap: 500 gwei. */
const DEFAULT_MAX_GAS_PRICE = 500_000_000_000n; // 500 gwei

/** Default priority fee: 1.5 gwei. */
const DEFAULT_PRIORITY_FEE = 1_500_000_000n; // 1.5 gwei

// ---------------------------------------------------------------------------
// GasEstimator
// ---------------------------------------------------------------------------

export class GasEstimator {
  private provider: EVMProvider;
  private maxGasPrice: bigint;
  private log: pino.Logger;

  constructor(provider: EVMProvider, opts?: { maxGasPriceWei?: bigint }) {
    this.provider = provider;
    this.maxGasPrice = opts?.maxGasPriceWei ?? DEFAULT_MAX_GAS_PRICE;
    this.log = createLogger({ module: "gas-estimator" });
  }

  /**
   * Get the current base fee from the latest block.
   * Returns 0n if the chain does not support EIP-1559.
   */
  async getBaseFee(chainId: number): Promise<bigint> {
    try {
      const block = await this.provider.getBlock(chainId);
      const baseFee = block.baseFeePerGas ?? 0n;
      this.log.debug({ chainId, baseFee: baseFee.toString() }, "Base fee fetched");
      return baseFee;
    } catch (err) {
      if (err instanceof ChainError) throw err;
      throw new ChainError(`Failed to get base fee on chain ${chainId}`, {
        code: "CHAIN_GAS_BASE_FEE_ERROR",
        recoverable: true,
        context: { chainId },
        cause: err,
      });
    }
  }

  /**
   * Get a reasonable priority fee (tip) for the chain.
   * Falls back to a default if the RPC does not support fee history.
   */
  async getPriorityFee(chainId: number): Promise<bigint> {
    try {
      const client = this.provider.getPublicClient(chainId);

      // Try to use eth_maxPriorityFeePerGas if the node supports it.
      // viem exposes this via estimateMaxPriorityFeePerGas or we can
      // fall back to a sensible default.
      try {
        const fee = await client.request({
          method: "eth_maxPriorityFeePerGas" as "eth_maxPriorityFeePerGas",
        });
        const parsed = BigInt(fee as string);
        this.log.debug({ chainId, priorityFee: parsed.toString() }, "Priority fee from RPC");
        return parsed;
      } catch {
        // Node doesn't support eth_maxPriorityFeePerGas — use default.
        this.log.debug(
          { chainId, fallback: DEFAULT_PRIORITY_FEE.toString() },
          "Using default priority fee",
        );
        return DEFAULT_PRIORITY_FEE;
      }
    } catch (err) {
      if (err instanceof ChainError) throw err;
      throw new ChainError(`Failed to get priority fee on chain ${chainId}`, {
        code: "CHAIN_GAS_PRIORITY_FEE_ERROR",
        recoverable: true,
        context: { chainId },
        cause: err,
      });
    }
  }

  /**
   * Calculate optimal EIP-1559 fees for a chain.
   *
   * maxFeePerGas = (baseFee * 2) + priorityFee — capped at maxGasPrice.
   * This follows the recommended pattern: double the base fee to survive
   * up to 6 consecutive full blocks of fee increases.
   */
  async getOptimalFees(chainId: number): Promise<OptimalFees> {
    const baseFee = await this.getBaseFee(chainId);
    const priorityFee = await this.getPriorityFee(chainId);

    // maxFeePerGas = 2 * baseFee + priorityFee
    let maxFeePerGas = baseFee * 2n + priorityFee;

    // Apply the global cap.
    if (maxFeePerGas > this.maxGasPrice) {
      this.log.warn(
        {
          chainId,
          computed: maxFeePerGas.toString(),
          cap: this.maxGasPrice.toString(),
        },
        "Max fee exceeds gas price cap, clamping",
      );
      maxFeePerGas = this.maxGasPrice;
    }

    // Ensure priority fee doesn't exceed max fee.
    const effectivePriorityFee =
      priorityFee > maxFeePerGas ? maxFeePerGas : priorityFee;

    return {
      maxFeePerGas,
      maxPriorityFeePerGas: effectivePriorityFee,
    };
  }

  /**
   * Full gas estimation: estimate gas limit for a transaction
   * and compute EIP-1559 fee parameters.
   *
   * Applies a 20% buffer to the gas limit.
   */
  async estimateGas(
    tx: {
      to: string;
      data?: string;
      value?: bigint;
      from?: string;
    },
    chainId: number,
  ): Promise<GasEstimateResult> {
    try {
      // Estimate the raw gas limit.
      const rawGas = await this.provider.estimateGas(tx, chainId);

      // Apply 20% buffer.
      const gasLimit =
        (rawGas * GAS_BUFFER_NUMERATOR) / GAS_BUFFER_DENOMINATOR;

      // Get optimal fee parameters.
      const fees = await this.getOptimalFees(chainId);

      const totalMaxCost = gasLimit * fees.maxFeePerGas;

      this.log.info(
        {
          chainId,
          rawGas: rawGas.toString(),
          bufferedGas: gasLimit.toString(),
          maxFeePerGas: fees.maxFeePerGas.toString(),
          maxPriorityFeePerGas: fees.maxPriorityFeePerGas.toString(),
          totalMaxCost: totalMaxCost.toString(),
        },
        "Gas estimated",
      );

      return {
        gasLimit,
        maxFeePerGas: fees.maxFeePerGas,
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
        totalMaxCost,
      };
    } catch (err) {
      if (err instanceof ChainError) throw err;
      throw new ChainError(`Gas estimation failed on chain ${chainId}`, {
        code: "CHAIN_GAS_ESTIMATION_ERROR",
        recoverable: true,
        context: { chainId, to: tx.to },
        cause: err,
      });
    }
  }
}
