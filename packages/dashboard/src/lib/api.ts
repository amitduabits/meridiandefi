import { config } from '../config.js'

export interface AgentStatus {
  id: string
  name: string
  state: string
  strategy: string
  wallet: string
  totalTrades: number
  uptime: number
  currentAllocation: Record<string, number>
  targetAllocation: Record<string, number>
  lastDecision: {
    action: string
    reasoning: string
    timestamp: number
    txHash?: string
  } | null
}

export interface PortfolioSnapshot {
  totalValueUsd: number
  tokens: Array<{
    symbol: string
    balance: string
    valueUsd: number
    allocationPct: number
    targetPct: number
    driftPct: number
  }>
  equityCurve: Array<{ timestamp: number; value: number }>
}

export interface Transaction {
  txHash: string
  action: string
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOut: string
  gasUsed: string
  timestamp: number
  reasoning: string
  arbiscanUrl: string
}

const BASE_URL = config.apiUrl

export async function fetchAgentStatus(): Promise<AgentStatus | null> {
  try {
    const res = await fetch(`${BASE_URL}/trpc/agents.getActive`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const data = await res.json()
    return data.result?.data || null
  } catch {
    return null  // Fall back to mock data
  }
}

export async function fetchPortfolio(): Promise<PortfolioSnapshot | null> {
  try {
    const res = await fetch(`${BASE_URL}/trpc/portfolio.overview`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const data = await res.json()
    return data.result?.data || null
  } catch {
    return null
  }
}

export async function fetchTransactions(limit = 20): Promise<Transaction[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/trpc/transactions.list?input=${encodeURIComponent(JSON.stringify({ limit }))}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.result?.data || []
  } catch {
    return []
  }
}

export async function fetchHealth(): Promise<{ status: string; uptime: number } | null> {
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchGitHubStars(): Promise<number | null> {
  try {
    const res = await fetch('https://api.github.com/repos/amitduabits/meridiandefi', {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.stargazers_count ?? null
  } catch {
    return null
  }
}
