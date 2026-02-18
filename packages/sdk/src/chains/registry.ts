// ---------------------------------------------------------------------------
// Chain and protocol registry — canonical lists for Meridian.
// ---------------------------------------------------------------------------

export const SUPPORTED_CHAINS = {
  ethereum: { id: 1, name: "Ethereum", testnet: false },
  sepolia: { id: 11155111, name: "Sepolia", testnet: true },
  arbitrum: { id: 42161, name: "Arbitrum One", testnet: false },
  arbitrumSepolia: { id: 421614, name: "Arbitrum Sepolia", testnet: true },
  base: { id: 8453, name: "Base", testnet: false },
  optimism: { id: 10, name: "Optimism", testnet: false },
  polygon: { id: 137, name: "Polygon", testnet: false },
} as const;

export type SupportedChainKey = keyof typeof SUPPORTED_CHAINS;

export const SUPPORTED_PROTOCOLS = [
  "uniswap-v3",
  "aave-v3",
  "curve",
  "lido",
  "compound-v3",
  "gmx",
  "camelot",
  "jupiter",
  "raydium",
] as const;

export type SupportedProtocol = (typeof SUPPORTED_PROTOCOLS)[number];
