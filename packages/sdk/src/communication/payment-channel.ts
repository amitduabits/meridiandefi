// ---------------------------------------------------------------------------
// Payment Channel — interface to the PaymentEscrow smart contract.
// In mock mode (no rpcUrl), all operations return deterministic mock data.
// ---------------------------------------------------------------------------

import { createLogger } from "../core/logger.js";
import { MeridianError } from "../core/errors.js";

const logger = createLogger({ module: "communication/payment-channel" });

export class PaymentChannelError extends MeridianError {
  constructor(message: string, opts?: { code?: string; recoverable?: boolean; context?: Record<string, unknown>; cause?: unknown }) {
    super(message, { code: opts?.code ?? "PAYMENT_CHANNEL_ERROR", recoverable: opts?.recoverable ?? true, context: opts?.context, cause: opts?.cause });
    this.name = "PaymentChannelError";
  }
}

export type PaymentStatus = "PENDING" | "RELEASED" | "DISPUTED" | "REFUNDED";

export interface PaymentChannelConfig {
  escrowContractAddress?: `0x${string}`;
  rpcUrl?: string;
  privateKey?: `0x${string}`;
}

// ---------------------------------------------------------------------------
// In-memory payment record (used in mock mode)
// ---------------------------------------------------------------------------

interface PaymentRecord {
  taskId: string;
  amount: bigint;
  executor: string;
  status: PaymentStatus;
  txHash: string;
}

// ---------------------------------------------------------------------------
// Mock tx hash generator
// ---------------------------------------------------------------------------

function mockTxHash(taskId: string, op: string): string {
  // Deterministic but unique-looking — 66-char hex string.
  const seed = `${op}:${taskId}:${Date.now()}`;
  let hash = "0x";
  for (let i = 0; i < 64; i++) {
    hash += Math.floor(Math.random() * 16).toString(16);
  }
  // Prefix with seed length to make it deterministic w.r.t. taskId
  void seed;
  return hash;
}

// ---------------------------------------------------------------------------
// PaymentChannel
// ---------------------------------------------------------------------------

export class PaymentChannel {
  private readonly _config: PaymentChannelConfig;
  private readonly _isMock: boolean;

  /** In-memory store for mock mode. */
  private readonly _payments = new Map<string, PaymentRecord>();

  constructor(config: PaymentChannelConfig) {
    this._config = config;
    this._isMock = !config.rpcUrl;

    if (this._isMock) {
      logger.info("PaymentChannel operating in mock mode — no on-chain transactions");
    } else {
      logger.info(
        { escrow: config.escrowContractAddress, rpc: config.rpcUrl },
        "PaymentChannel initialised in production mode",
      );
    }
  }

  /**
   * Create a payment for a task.
   * Returns the transaction hash (mock or real).
   */
  async createPayment(taskId: string, amount: bigint, executor: string): Promise<string> {
    if (this._isMock) {
      return this._mockCreate(taskId, amount, executor);
    }
    return this._onChainCreate(taskId, amount, executor);
  }

  /**
   * Release an escrowed payment to the executor upon task completion.
   * Returns the transaction hash.
   */
  async releasePayment(taskId: string): Promise<string> {
    if (this._isMock) {
      return this._mockRelease(taskId);
    }
    return this._onChainRelease(taskId);
  }

  /**
   * Open a dispute for a payment.
   * Returns the transaction hash.
   */
  async disputePayment(taskId: string, reason: string): Promise<string> {
    if (this._isMock) {
      return this._mockDispute(taskId, reason);
    }
    return this._onChainDispute(taskId, reason);
  }

  /** Query the current status of a payment. */
  async getPaymentStatus(taskId: string): Promise<PaymentStatus> {
    if (this._isMock) {
      const record = this._payments.get(taskId);
      if (!record) {
        throw new PaymentChannelError(`No payment found for taskId ${taskId}`, { code: "PAYMENT_NOT_FOUND" });
      }
      return record.status;
    }
    return this._onChainStatus(taskId);
  }

  // ---------------------------------------------------------------------------
  // Mock implementations
  // ---------------------------------------------------------------------------

  private _mockCreate(taskId: string, amount: bigint, executor: string): string {
    if (this._payments.has(taskId)) {
      throw new PaymentChannelError(`Payment already exists for taskId ${taskId}`, { code: "PAYMENT_DUPLICATE" });
    }
    const txHash = mockTxHash(taskId, "create");
    this._payments.set(taskId, { taskId, amount, executor, status: "PENDING", txHash });
    logger.debug({ taskId, amount: amount.toString(), executor, txHash }, "[mock] Payment created");
    return txHash;
  }

  private _mockRelease(taskId: string): string {
    const record = this._payments.get(taskId);
    if (!record) {
      throw new PaymentChannelError(`No payment found for taskId ${taskId}`, { code: "PAYMENT_NOT_FOUND" });
    }
    if (record.status !== "PENDING") {
      throw new PaymentChannelError(`Cannot release payment in status ${record.status}`, { code: "INVALID_STATUS" });
    }
    record.status = "RELEASED";
    const txHash = mockTxHash(taskId, "release");
    logger.debug({ taskId, txHash }, "[mock] Payment released");
    return txHash;
  }

  private _mockDispute(taskId: string, reason: string): string {
    const record = this._payments.get(taskId);
    if (!record) {
      throw new PaymentChannelError(`No payment found for taskId ${taskId}`, { code: "PAYMENT_NOT_FOUND" });
    }
    if (record.status !== "PENDING") {
      throw new PaymentChannelError(`Cannot dispute payment in status ${record.status}`, { code: "INVALID_STATUS" });
    }
    record.status = "DISPUTED";
    const txHash = mockTxHash(taskId, "dispute");
    logger.debug({ taskId, reason, txHash }, "[mock] Payment disputed");
    return txHash;
  }

  // ---------------------------------------------------------------------------
  // Production implementations (viem)
  // ---------------------------------------------------------------------------

  private async _onChainCreate(taskId: string, amount: bigint, executor: string): Promise<string> {
    // Dynamically import viem to avoid hard dependency in mock builds.
    try {
      const { createWalletClient, createPublicClient, http, parseAbi } = await import("viem");

      if (!this._config.privateKey || !this._config.rpcUrl || !this._config.escrowContractAddress) {
        throw new PaymentChannelError("Missing required production config (privateKey, rpcUrl, escrowContractAddress)", {
          code: "CONFIG_MISSING",
        });
      }

      const { privateKeyToAccount } = await import("viem/accounts");
      const account = privateKeyToAccount(this._config.privateKey);

      const transport = http(this._config.rpcUrl);
      const _publicClient = createPublicClient({ transport });
      const walletClient = createWalletClient({ account, transport });

      const abi = parseAbi([
        "function createPayment(bytes32 taskId, address executor) external payable",
      ]);

      const txHash = await walletClient.writeContract({
        address: this._config.escrowContractAddress,
        abi,
        functionName: "createPayment",
        args: [`0x${Buffer.from(taskId).toString("hex").padEnd(64, "0")}` as `0x${string}`, executor as `0x${string}`],
        value: amount,
      });

      logger.info({ taskId, txHash }, "Payment created on-chain");
      return txHash;
    } catch (err) {
      if (err instanceof PaymentChannelError) throw err;
      throw new PaymentChannelError("On-chain createPayment failed", { cause: err });
    }
  }

  private async _onChainRelease(taskId: string): Promise<string> {
    try {
      const { createWalletClient, http, parseAbi } = await import("viem");

      if (!this._config.privateKey || !this._config.rpcUrl || !this._config.escrowContractAddress) {
        throw new PaymentChannelError("Missing required production config", { code: "CONFIG_MISSING" });
      }

      const { privateKeyToAccount } = await import("viem/accounts");
      const account = privateKeyToAccount(this._config.privateKey);
      const walletClient = createWalletClient({ account, transport: http(this._config.rpcUrl) });

      const abi = parseAbi(["function releasePayment(bytes32 taskId) external"]);

      const txHash = await walletClient.writeContract({
        address: this._config.escrowContractAddress,
        abi,
        functionName: "releasePayment",
        args: [`0x${Buffer.from(taskId).toString("hex").padEnd(64, "0")}` as `0x${string}`],
      });

      logger.info({ taskId, txHash }, "Payment released on-chain");
      return txHash;
    } catch (err) {
      if (err instanceof PaymentChannelError) throw err;
      throw new PaymentChannelError("On-chain releasePayment failed", { cause: err });
    }
  }

  private async _onChainDispute(taskId: string, reason: string): Promise<string> {
    try {
      const { createWalletClient, http, parseAbi } = await import("viem");

      if (!this._config.privateKey || !this._config.rpcUrl || !this._config.escrowContractAddress) {
        throw new PaymentChannelError("Missing required production config", { code: "CONFIG_MISSING" });
      }

      const { privateKeyToAccount } = await import("viem/accounts");
      const account = privateKeyToAccount(this._config.privateKey);
      const walletClient = createWalletClient({ account, transport: http(this._config.rpcUrl) });

      const abi = parseAbi(["function disputePayment(bytes32 taskId, string calldata reason) external"]);

      const txHash = await walletClient.writeContract({
        address: this._config.escrowContractAddress,
        abi,
        functionName: "disputePayment",
        args: [`0x${Buffer.from(taskId).toString("hex").padEnd(64, "0")}` as `0x${string}`, reason],
      });

      logger.info({ taskId, reason, txHash }, "Payment disputed on-chain");
      return txHash;
    } catch (err) {
      if (err instanceof PaymentChannelError) throw err;
      throw new PaymentChannelError("On-chain disputePayment failed", { cause: err });
    }
  }

  private async _onChainStatus(taskId: string): Promise<PaymentStatus> {
    try {
      const { createPublicClient, http, parseAbi } = await import("viem");

      if (!this._config.rpcUrl || !this._config.escrowContractAddress) {
        throw new PaymentChannelError("Missing required production config", { code: "CONFIG_MISSING" });
      }

      const publicClient = createPublicClient({ transport: http(this._config.rpcUrl) });

      const abi = parseAbi(["function getPaymentStatus(bytes32 taskId) external view returns (uint8)"]);

      const statusCode = await publicClient.readContract({
        address: this._config.escrowContractAddress,
        abi,
        functionName: "getPaymentStatus",
        args: [`0x${Buffer.from(taskId).toString("hex").padEnd(64, "0")}` as `0x${string}`],
      });

      const statusMap: Record<number, PaymentStatus> = {
        0: "PENDING",
        1: "RELEASED",
        2: "DISPUTED",
        3: "REFUNDED",
      };

      return statusMap[Number(statusCode)] ?? "PENDING";
    } catch (err) {
      if (err instanceof PaymentChannelError) throw err;
      throw new PaymentChannelError("On-chain getPaymentStatus failed", { cause: err });
    }
  }
}
