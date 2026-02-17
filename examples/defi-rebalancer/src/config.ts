// ---------------------------------------------------------------------------
// Configuration — loaded from environment variables.
// ---------------------------------------------------------------------------

import "dotenv/config";

// ---------------------------------------------------------------------------
// Token addresses on Arbitrum Sepolia
// ---------------------------------------------------------------------------

export interface TokenConfig {
  symbol: string;
  address: `0x${string}`;
  decimals: number;
  /** Target allocation as a fraction (0–1). */
  targetPct: number;
}

export const TOKENS: TokenConfig[] = [
  {
    symbol: "ETH",
    address: "0x0000000000000000000000000000000000000000", // native
    decimals: 18,
    targetPct: 0.40,
  },
  {
    symbol: "USDC",
    address: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d", // Arbitrum Sepolia USDC
    decimals: 6,
    targetPct: 0.30,
  },
  {
    symbol: "WBTC",
    address: "0x3Ec3D2e3E86B664EB61F4bDcC1D7E2C5F4D4C6e2", // placeholder test token
    decimals: 8,
    targetPct: 0.30,
  },
];

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`\n  Missing required environment variable: ${key}`);
    console.error(`  Copy .env.example to .env and fill in the values.\n`);
    process.exit(1);
  }
  return value;
}

export const config = {
  /** Arbitrum Sepolia RPC URL. */
  rpcUrl: requireEnv("ARBITRUM_SEPOLIA_RPC_URL"),

  /** Anthropic API key for Claude reasoning. */
  anthropicApiKey: requireEnv("ANTHROPIC_API_KEY"),

  /** Wallet private key (with 0x prefix). */
  privateKey: requireEnv("WALLET_PRIVATE_KEY") as `0x${string}`,

  /** Chain ID — Arbitrum Sepolia. */
  chainId: 421614,

  /** Drift threshold (fraction) — rebalance if any token drifts more than this. */
  driftThreshold: Number(process.env["DRIFT_THRESHOLD"] ?? "0.05"),

  /** Tick interval in seconds — how often the agent checks. */
  tickIntervalSec: Number(process.env["TICK_INTERVAL_SEC"] ?? "60"),

  /** Max slippage in basis points for swaps. */
  maxSlippageBps: Number(process.env["MAX_SLIPPAGE_BPS"] ?? "50"),

  /** Dry-run mode — simulate but don't actually send transactions. */
  dryRun: process.env["DRY_RUN"] === "true",

  /** Claude model to use. */
  claudeModel: process.env["CLAUDE_MODEL"] ?? "claude-sonnet-4-5-20250929",
} as const;
