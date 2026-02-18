import { config } from '../config.js'

// ---------------------------------------------------------------------------
// Types matching the actual server tRPC procedures
// ---------------------------------------------------------------------------

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

// Helper: encode tRPC input as query param
function inp(obj: unknown) {
  return encodeURIComponent(JSON.stringify(obj))
}

// ---------------------------------------------------------------------------
// Agent — uses agents.list (returns MockAgent[])
// ---------------------------------------------------------------------------

export async function fetchAgentStatus(): Promise<AgentStatus | null> {
  try {
    const res = await fetch(`${BASE_URL}/trpc/agents.list?input=${inp({})}`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    // tRPC response: { result: { data: [...] } }
    const agents: Array<{
      id: string
      name: string
      state: string
      capabilities: string[]
      chains: number[]
      cycleCount: number
      pnlUsd: number
      dryRun: boolean
    }> = data.result?.data ?? []
    if (!agents.length) return null
    const a = agents[0]!
    return {
      id: a.id,
      name: a.name,
      state: a.state,
      strategy: a.capabilities.join(', '),
      wallet: '',
      totalTrades: a.cycleCount,
      uptime: 0,
      currentAllocation: {},
      targetAllocation: {},
      lastDecision: null,
    }
  } catch {
    return null // Fall back to mock data
  }
}

// ---------------------------------------------------------------------------
// Portfolio — combines overview + positions + history endpoints
// ---------------------------------------------------------------------------

export async function fetchPortfolio(): Promise<PortfolioSnapshot | null> {
  try {
    const [ovRes, posRes, histRes] = await Promise.all([
      fetch(`${BASE_URL}/trpc/portfolio.overview?input=${inp({})}`, { signal: AbortSignal.timeout(5000) }),
      fetch(`${BASE_URL}/trpc/portfolio.positions?input=${inp({})}`, { signal: AbortSignal.timeout(5000) }),
      fetch(`${BASE_URL}/trpc/portfolio.history?input=${inp({ days: 30 })}`, { signal: AbortSignal.timeout(5000) }),
    ])
    if (!ovRes.ok) return null

    const ov: {
      totalValueUsd: number
      totalPnlUsd: number
    } = (await ovRes.json()).result?.data

    const positions: Array<{
      symbol: string
      balance: string
      valueUsd: number
    }> = posRes.ok ? ((await posRes.json()).result?.data ?? []) : []

    const hist: { points: Array<{ timestamp: number; valueUsd: number }> } =
      histRes.ok ? ((await histRes.json()).result?.data ?? { points: [] }) : { points: [] }

    return {
      totalValueUsd: ov.totalValueUsd,
      tokens: positions.map((p) => ({
        symbol: p.symbol,
        balance: p.balance,
        valueUsd: p.valueUsd,
        allocationPct: ov.totalValueUsd > 0 ? (p.valueUsd / ov.totalValueUsd) * 100 : 0,
        targetPct: 0,
        driftPct: 0,
      })),
      equityCurve: hist.points.map((pt) => ({ timestamp: pt.timestamp, value: pt.valueUsd })),
    }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Transactions — server returns { items, total, limit, offset }
// ---------------------------------------------------------------------------

export async function fetchTransactions(limit = 20): Promise<Transaction[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/trpc/transactions.list?input=${inp({ limit })}`,
      { signal: AbortSignal.timeout(5000) },
    )
    if (!res.ok) return []
    const data = await res.json()
    // result.data is { items: MockTransaction[], total, limit, offset }
    const result = data.result?.data
    const items: Array<{
      id: string
      hash: string
      type: string
      tokenIn: string
      tokenOut: string | null
      amountIn: string
      amountOut: string | null
      gasUsed: string | null
      timestamp: string
      description: string
      chainId: number
    }> = result?.items ?? []
    return items.map((tx) => ({
      txHash: tx.hash,
      action: tx.type,
      tokenIn: tx.tokenIn,
      tokenOut: tx.tokenOut ?? '',
      amountIn: tx.amountIn,
      amountOut: tx.amountOut ?? '0',
      gasUsed: tx.gasUsed ?? '0',
      timestamp: new Date(tx.timestamp).getTime(),
      reasoning: tx.description,
      arbiscanUrl: `https://sepolia.arbiscan.io/tx/${tx.hash}`,
    }))
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Health — simple REST endpoint (not tRPC)
// ---------------------------------------------------------------------------

export async function fetchHealth(): Promise<{ status: string; uptime: number } | null> {
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// GitHub stars
// ---------------------------------------------------------------------------

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
