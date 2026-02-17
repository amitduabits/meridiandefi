// ---------------------------------------------------------------------------
// Mock data for the Meridian dashboard.
// Provides realistic data for all views without a live backend.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Agent types
// ---------------------------------------------------------------------------

export type AgentState = "IDLE" | "SENSING" | "THINKING" | "ACTING" | "REFLECTING" | "ERROR" | "COOLDOWN" | "PAUSED";

export interface MockAgent {
  id: string;
  name: string;
  state: AgentState;
  strategy: string;
  chains: string[];
  lastAction: string;
  lastActionTime: number;
  cycleCount: number;
  uptime: number;
  pnlPct: number;
  portfolioValue: number;
}

export interface MockPosition {
  token: string;
  chain: string;
  amount: number;
  valueUsd: number;
  pnlUsd: number;
  pnlPct: number;
  protocol: string;
}

export interface MockTransaction {
  id: string;
  agentId: string;
  agentName: string;
  timestamp: number;
  chain: string;
  action: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  amountOut: number;
  valueUsd: number;
  gasCostUsd: number;
  txHash: string;
  status: "success" | "failed" | "pending";
}

export interface MockPnlPoint {
  timestamp: number;
  value: number;
  pnl: number;
}

export interface MockBreakerStatus {
  type: string;
  status: "CLOSED" | "OPEN" | "HALF_OPEN";
  lastTripped?: number;
  tripCount: number;
}

// ---------------------------------------------------------------------------
// Mock agents
// ---------------------------------------------------------------------------

const now = Date.now();
const hour = 3_600_000;
const day = 86_400_000;

export const mockAgents: MockAgent[] = [
  {
    id: "agent-1",
    name: "DeFi Rebalancer",
    state: "SENSING",
    strategy: "Portfolio Rebalance (40/30/30)",
    chains: ["Arbitrum", "Ethereum"],
    lastAction: "SWAP 0.5 ETH → USDC",
    lastActionTime: now - 2 * 60_000,
    cycleCount: 342,
    uptime: 7 * day,
    pnlPct: 4.2,
    portfolioValue: 25_430,
  },
  {
    id: "agent-2",
    name: "Yield Optimizer",
    state: "ACTING",
    strategy: "Max Yield Farming",
    chains: ["Arbitrum", "Base"],
    lastAction: "SUPPLY 1000 USDC to Aave",
    lastActionTime: now - 5 * 60_000,
    cycleCount: 128,
    uptime: 3 * day,
    pnlPct: 2.8,
    portfolioValue: 15_200,
  },
  {
    id: "agent-3",
    name: "Arbitrage Hunter",
    state: "THINKING",
    strategy: "Cross-DEX Arbitrage",
    chains: ["Ethereum", "Polygon", "Arbitrum"],
    lastAction: "SWAP WETH via Uniswap V3",
    lastActionTime: now - 30_000,
    cycleCount: 1_247,
    uptime: 14 * day,
    pnlPct: 8.5,
    portfolioValue: 52_100,
  },
  {
    id: "agent-4",
    name: "Risk Monitor",
    state: "IDLE",
    strategy: "Portfolio Protection",
    chains: ["Ethereum"],
    lastAction: "No action needed",
    lastActionTime: now - 3 * hour,
    cycleCount: 56,
    uptime: 7 * day,
    pnlPct: -0.3,
    portfolioValue: 8_900,
  },
  {
    id: "agent-5",
    name: "DCA Bot",
    state: "PAUSED",
    strategy: "Daily ETH DCA",
    chains: ["Base"],
    lastAction: "SWAP 100 USDC → ETH",
    lastActionTime: now - day,
    cycleCount: 30,
    uptime: 30 * day,
    pnlPct: 12.1,
    portfolioValue: 3_360,
  },
];

// ---------------------------------------------------------------------------
// Mock positions
// ---------------------------------------------------------------------------

export const mockPositions: MockPosition[] = [
  { token: "ETH", chain: "Arbitrum", amount: 5.2, valueUsd: 15_600, pnlUsd: 1_200, pnlPct: 8.3, protocol: "Wallet" },
  { token: "USDC", chain: "Arbitrum", amount: 12_500, valueUsd: 12_500, pnlUsd: 0, pnlPct: 0, protocol: "Wallet" },
  { token: "WBTC", chain: "Ethereum", amount: 0.15, valueUsd: 9_000, pnlUsd: 600, pnlPct: 7.1, protocol: "Wallet" },
  { token: "ETH", chain: "Base", amount: 2.0, valueUsd: 6_000, pnlUsd: -150, pnlPct: -2.4, protocol: "Aave" },
  { token: "USDC", chain: "Arbitrum", amount: 5_000, valueUsd: 5_000, pnlUsd: 120, pnlPct: 2.5, protocol: "Aave" },
  { token: "LINK", chain: "Ethereum", amount: 200, valueUsd: 2_800, pnlUsd: -200, pnlPct: -6.7, protocol: "Uniswap V3" },
  { token: "ARB", chain: "Arbitrum", amount: 3_000, valueUsd: 2_400, pnlUsd: 300, pnlPct: 14.3, protocol: "Wallet" },
  { token: "MATIC", chain: "Polygon", amount: 5_000, valueUsd: 1_690, pnlUsd: -110, pnlPct: -6.1, protocol: "Wallet" },
];

// ---------------------------------------------------------------------------
// Mock transactions
// ---------------------------------------------------------------------------

export const mockTransactions: MockTransaction[] = Array.from({ length: 50 }, (_, i) => {
  const chains = ["Arbitrum", "Ethereum", "Base", "Polygon"];
  const actions = ["SWAP", "ADD_LIQUIDITY", "REMOVE_LIQUIDITY", "SUPPLY", "BORROW", "REPAY"];
  const tokens = ["ETH", "USDC", "WBTC", "LINK", "ARB", "MATIC", "DAI"];
  const agents = mockAgents.map((a) => ({ id: a.id, name: a.name }));

  const agent = agents[i % agents.length]!;
  const chain = chains[i % chains.length]!;
  const action = actions[i % actions.length]!;
  const tokenIn = tokens[i % tokens.length]!;
  const tokenOut = tokens[(i + 2) % tokens.length]!;

  return {
    id: `tx-${i}`,
    agentId: agent.id,
    agentName: agent.name,
    timestamp: now - i * 45 * 60_000,
    chain,
    action,
    tokenIn,
    tokenOut,
    amountIn: Math.random() * 10,
    amountOut: Math.random() * 10,
    valueUsd: Math.random() * 5000 + 100,
    gasCostUsd: Math.random() * 2 + 0.01,
    txHash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
    status: i === 2 ? "failed" : i === 0 ? "pending" : "success",
  };
});

// ---------------------------------------------------------------------------
// Mock PnL data (30 days)
// ---------------------------------------------------------------------------

export const mockPnlData: MockPnlPoint[] = (() => {
  const data: MockPnlPoint[] = [];
  let value = 100_000;
  for (let i = 30; i >= 0; i--) {
    const dailyReturn = (Math.random() - 0.45) * 0.03;
    value *= 1 + dailyReturn;
    data.push({
      timestamp: now - i * day,
      value: Math.round(value * 100) / 100,
      pnl: Math.round((value - 100_000) * 100) / 100,
    });
  }
  return data;
})();

// ---------------------------------------------------------------------------
// Mock circuit breakers
// ---------------------------------------------------------------------------

export const mockBreakers: MockBreakerStatus[] = [
  { type: "PORTFOLIO_DRAWDOWN", status: "CLOSED", tripCount: 0 },
  { type: "FLASH_CRASH", status: "CLOSED", tripCount: 1, lastTripped: now - 3 * day },
  { type: "GAS_SPIKE", status: "HALF_OPEN", tripCount: 2, lastTripped: now - 15 * 60_000 },
  { type: "RPC_FAILURE", status: "CLOSED", tripCount: 0 },
  { type: "ORACLE_STALE", status: "CLOSED", tripCount: 0 },
  { type: "CONTRACT_ANOMALY", status: "CLOSED", tripCount: 0 },
];

// ---------------------------------------------------------------------------
// Mock system health
// ---------------------------------------------------------------------------

export const mockSystemHealth = {
  rpcStatus: [
    { chain: "Ethereum", chainId: 1, latencyMs: 45, lastBlock: 19_500_000, status: "healthy" as const },
    { chain: "Arbitrum", chainId: 42161, latencyMs: 12, lastBlock: 185_000_000, status: "healthy" as const },
    { chain: "Base", chainId: 8453, latencyMs: 18, lastBlock: 12_000_000, status: "healthy" as const },
    { chain: "Polygon", chainId: 137, latencyMs: 320, lastBlock: 55_000_000, status: "degraded" as const },
  ],
  llmUsage: {
    totalTokens: 1_250_000,
    totalCostUsd: 18.75,
    requestsToday: 342,
    avgLatencyMs: 850,
    providers: [
      { name: "Claude", requests: 250, tokens: 900_000, costUsd: 13.50 },
      { name: "GPT-4o", requests: 80, tokens: 300_000, costUsd: 4.50 },
      { name: "Ollama", requests: 12, tokens: 50_000, costUsd: 0.75 },
    ],
  },
  services: {
    redis: { status: "connected" as const, latencyMs: 1 },
    postgres: { status: "connected" as const, latencyMs: 3 },
    qdrant: { status: "connected" as const, latencyMs: 8 },
  },
};

// ---------------------------------------------------------------------------
// Helper: state colors and labels
// ---------------------------------------------------------------------------

export function stateColor(state: AgentState): string {
  switch (state) {
    case "IDLE": return "text-slate-400";
    case "SENSING": return "text-blue-400";
    case "THINKING": return "text-violet-400";
    case "ACTING": return "text-emerald-400";
    case "REFLECTING": return "text-amber-400";
    case "ERROR": return "text-red-400";
    case "COOLDOWN": return "text-orange-400";
    case "PAUSED": return "text-slate-500";
    default: return "text-slate-400";
  }
}

export function stateBgColor(state: AgentState): string {
  switch (state) {
    case "IDLE": return "bg-slate-400/10 text-slate-400 border border-slate-400/10";
    case "SENSING": return "bg-blue-400/10 text-blue-400 border border-blue-400/10";
    case "THINKING": return "bg-violet-400/10 text-violet-400 border border-violet-400/10";
    case "ACTING": return "bg-emerald-400/10 text-emerald-400 border border-emerald-400/10";
    case "REFLECTING": return "bg-amber-400/10 text-amber-400 border border-amber-400/10";
    case "ERROR": return "bg-red-400/10 text-red-400 border border-red-400/10";
    case "COOLDOWN": return "bg-orange-400/10 text-orange-400 border border-orange-400/10";
    case "PAUSED": return "bg-slate-500/10 text-slate-500 border border-slate-500/10";
    default: return "bg-slate-400/10 text-slate-400 border border-slate-400/10";
  }
}

export function stateDotClass(state: AgentState): string {
  switch (state) {
    case "IDLE": return "bg-slate-400";
    case "SENSING": return "bg-blue-400";
    case "THINKING": return "bg-violet-400";
    case "ACTING": return "bg-emerald-400";
    case "REFLECTING": return "bg-amber-400";
    case "ERROR": return "bg-red-400";
    case "COOLDOWN": return "bg-orange-400";
    case "PAUSED": return "bg-slate-500";
    default: return "bg-slate-400";
  }
}

export function stateIsActive(state: AgentState): boolean {
  return state === "SENSING" || state === "THINKING" || state === "ACTING" || state === "REFLECTING";
}
