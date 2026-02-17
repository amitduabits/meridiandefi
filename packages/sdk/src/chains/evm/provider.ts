// ---------------------------------------------------------------------------
// EVMProvider — multi-chain EVM client management using viem.
// ---------------------------------------------------------------------------

import {
  createPublicClient,
  createWalletClient,
  http,
} from "viem";
import type {
  PublicClient,
  WalletClient,
  TransactionReceipt,
  Chain,
  HttpTransport,
  Hash,
} from "viem";
import {
  mainnet,
  sepolia,
  arbitrum,
  arbitrumSepolia,
  base,
  optimism,
  polygon,
  avalanche,
} from "viem/chains";
import type pino from "pino";
import { ChainError } from "../../core/errors.js";
import { createLogger } from "../../core/logger.js";

// ---------------------------------------------------------------------------
// Chain configuration
// ---------------------------------------------------------------------------

export interface EVMChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer: string;
  viemChain: Chain;
}

/**
 * Mapping from numeric chain ID to viem chain definition.
 * RPC URLs default to the public endpoints embedded in viem chain objects;
 * callers can override via `EVMProvider.configure()`.
 */
const DEFAULT_CHAIN_CONFIGS: ReadonlyMap<number, EVMChainConfig> = new Map([
  [
    1,
    {
      chainId: 1,
      name: "Ethereum",
      rpcUrl: "https://eth.llamarpc.com",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      blockExplorer: "https://etherscan.io",
      viemChain: mainnet,
    },
  ],
  [
    11155111,
    {
      chainId: 11155111,
      name: "Ethereum Sepolia",
      rpcUrl: "https://rpc.sepolia.org",
      nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
      blockExplorer: "https://sepolia.etherscan.io",
      viemChain: sepolia,
    },
  ],
  [
    42161,
    {
      chainId: 42161,
      name: "Arbitrum One",
      rpcUrl: "https://arb1.arbitrum.io/rpc",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      blockExplorer: "https://arbiscan.io",
      viemChain: arbitrum,
    },
  ],
  [
    421614,
    {
      chainId: 421614,
      name: "Arbitrum Sepolia",
      rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      blockExplorer: "https://sepolia.arbiscan.io",
      viemChain: arbitrumSepolia,
    },
  ],
  [
    8453,
    {
      chainId: 8453,
      name: "Base",
      rpcUrl: "https://mainnet.base.org",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      blockExplorer: "https://basescan.org",
      viemChain: base,
    },
  ],
  [
    10,
    {
      chainId: 10,
      name: "Optimism",
      rpcUrl: "https://mainnet.optimism.io",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      blockExplorer: "https://optimistic.etherscan.io",
      viemChain: optimism,
    },
  ],
  [
    137,
    {
      chainId: 137,
      name: "Polygon",
      rpcUrl: "https://polygon-rpc.com",
      nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
      blockExplorer: "https://polygonscan.com",
      viemChain: polygon,
    },
  ],
  [
    43114,
    {
      chainId: 43114,
      name: "Avalanche",
      rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
      nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
      blockExplorer: "https://snowtrace.io",
      viemChain: avalanche,
    },
  ],
]);

// ---------------------------------------------------------------------------
// EVMProvider
// ---------------------------------------------------------------------------

export class EVMProvider {
  private configs: Map<number, EVMChainConfig>;
  private publicClients = new Map<number, PublicClient<HttpTransport, Chain>>();
  private walletClients = new Map<number, WalletClient<HttpTransport, Chain>>();
  private log: pino.Logger;

  constructor(overrides?: Partial<Record<number, Partial<EVMChainConfig>>>) {
    this.configs = new Map(DEFAULT_CHAIN_CONFIGS);
    this.log = createLogger({ module: "evm-provider" });

    // Apply per-chain overrides (e.g. custom RPC URLs).
    if (overrides) {
      for (const [chainIdStr, partial] of Object.entries(overrides)) {
        const chainId = Number(chainIdStr);
        const existing = this.configs.get(chainId);
        if (existing && partial) {
          this.configs.set(chainId, { ...existing, ...partial });
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // Configuration helpers
  // -----------------------------------------------------------------------

  /** Get the chain config for a given chain ID. */
  getChainConfig(chainId: number): EVMChainConfig {
    const config = this.configs.get(chainId);
    if (!config) {
      throw new ChainError(`Unsupported EVM chain: ${chainId}`, {
        code: "CHAIN_UNSUPPORTED",
        recoverable: false,
        context: { chainId },
      });
    }
    return config;
  }

  /** Return all supported chain IDs. */
  getSupportedChains(): number[] {
    return [...this.configs.keys()];
  }

  // -----------------------------------------------------------------------
  // Client accessors
  // -----------------------------------------------------------------------

  /** Get or lazily create a public (read-only) client for a chain. */
  getPublicClient(chainId: number): PublicClient<HttpTransport, Chain> {
    const existing = this.publicClients.get(chainId);
    if (existing) return existing;

    const config = this.getChainConfig(chainId);

    const client = createPublicClient({
      chain: config.viemChain,
      transport: http(config.rpcUrl),
    }) as PublicClient<HttpTransport, Chain>;

    this.publicClients.set(chainId, client);
    this.log.debug({ chainId, name: config.name }, "Public client created");
    return client;
  }

  /** Get or lazily create a wallet client for a chain (requires a transport with signer). */
  getWalletClient(chainId: number): WalletClient<HttpTransport, Chain> {
    const existing = this.walletClients.get(chainId);
    if (existing) return existing;

    const config = this.getChainConfig(chainId);

    const client = createWalletClient({
      chain: config.viemChain,
      transport: http(config.rpcUrl),
    }) as WalletClient<HttpTransport, Chain>;

    this.walletClients.set(chainId, client);
    this.log.debug({ chainId, name: config.name }, "Wallet client created");
    return client;
  }

  // -----------------------------------------------------------------------
  // Chain operations
  // -----------------------------------------------------------------------

  /** Get native balance for an address. */
  async getBalance(address: string, chainId: number): Promise<bigint> {
    try {
      const client = this.getPublicClient(chainId);
      const balance = await client.getBalance({
        address: address as `0x${string}`,
      });
      return balance;
    } catch (err) {
      if (err instanceof ChainError) throw err;
      throw new ChainError(`Failed to get balance on chain ${chainId}`, {
        code: "CHAIN_BALANCE_ERROR",
        recoverable: true,
        context: { address, chainId },
        cause: err,
      });
    }
  }

  /** Get latest block information. */
  async getBlock(chainId: number): Promise<{
    number: bigint;
    timestamp: bigint;
    baseFeePerGas: bigint | null;
    hash: string | null;
  }> {
    try {
      const client = this.getPublicClient(chainId);
      const block = await client.getBlock();
      return {
        number: block.number,
        timestamp: block.timestamp,
        baseFeePerGas: block.baseFeePerGas ?? null,
        hash: block.hash,
      };
    } catch (err) {
      if (err instanceof ChainError) throw err;
      throw new ChainError(`Failed to get block on chain ${chainId}`, {
        code: "CHAIN_BLOCK_ERROR",
        recoverable: true,
        context: { chainId },
        cause: err,
      });
    }
  }

  /** Estimate gas for a transaction. */
  async estimateGas(
    tx: {
      to: string;
      data?: string;
      value?: bigint;
      from?: string;
    },
    chainId: number,
  ): Promise<bigint> {
    try {
      const client = this.getPublicClient(chainId);
      const gas = await client.estimateGas({
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}` | undefined,
        value: tx.value,
        account: tx.from as `0x${string}` | undefined,
      });
      return gas;
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

  /** Send a transaction via the wallet client. */
  async sendTransaction(
    tx: {
      to: string;
      data?: string;
      value?: bigint;
      from: string;
      gas?: bigint;
      maxFeePerGas?: bigint;
      maxPriorityFeePerGas?: bigint;
      nonce?: number;
    },
    chainId: number,
  ): Promise<Hash> {
    try {
      const client = this.getWalletClient(chainId);
      const hash = await client.sendTransaction({
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}` | undefined,
        value: tx.value,
        account: tx.from as `0x${string}`,
        gas: tx.gas,
        maxFeePerGas: tx.maxFeePerGas,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
        nonce: tx.nonce,
        chain: this.getChainConfig(chainId).viemChain,
      });

      this.log.info({ hash, chainId }, "Transaction sent");
      return hash;
    } catch (err) {
      if (err instanceof ChainError) throw err;
      throw new ChainError(`Failed to send transaction on chain ${chainId}`, {
        code: "CHAIN_TX_SEND_ERROR",
        recoverable: true,
        context: { chainId, to: tx.to },
        cause: err,
      });
    }
  }

  /** Wait for a transaction receipt (confirmation). */
  async waitForReceipt(
    hash: string,
    chainId: number,
    confirmations = 1,
  ): Promise<TransactionReceipt> {
    try {
      const client = this.getPublicClient(chainId);
      const receipt = await client.waitForTransactionReceipt({
        hash: hash as `0x${string}`,
        confirmations,
      });

      this.log.info(
        {
          hash,
          chainId,
          status: receipt.status,
          blockNumber: receipt.blockNumber.toString(),
        },
        "Transaction confirmed",
      );

      return receipt;
    } catch (err) {
      if (err instanceof ChainError) throw err;
      throw new ChainError(
        `Failed to wait for receipt on chain ${chainId}`,
        {
          code: "CHAIN_RECEIPT_ERROR",
          recoverable: true,
          context: { hash, chainId },
          cause: err,
        },
      );
    }
  }
}
