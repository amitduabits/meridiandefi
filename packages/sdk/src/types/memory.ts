// ---------------------------------------------------------------------------
// Decision record — written after every Think→Act→Reflect cycle.
// ---------------------------------------------------------------------------

export interface DecisionRecord {
  id: string;
  agentId: string;
  timestamp: number;
  state: string;
  reasoning: string;
  action: string;
  params: Record<string, unknown>;
  outcome?: string;
  reward?: number;
  learnings?: string[];
  chainId: number;
  txHash?: string;
}

// ---------------------------------------------------------------------------
// Agent state snapshot — for checkpoint/restore.
// ---------------------------------------------------------------------------

export interface AgentStateSnapshot {
  agentId: string;
  timestamp: number;
  /** Serialized xstate machine snapshot for crash recovery. */
  machineSnapshot: unknown;
  /** Current working memory keys and values. */
  workingMemory: Record<string, unknown>;
  /** Active strategy ID. */
  strategyId?: string;
  /** Cycle counter at checkpoint time. */
  cycleCount: number;
}

// ---------------------------------------------------------------------------
// Market snapshot — current market state used during Sense phase.
// ---------------------------------------------------------------------------

export interface MarketSnapshot {
  timestamp: number;
  prices: Record<string, number>;
  balances: Record<string, string>;
  positions: Record<string, unknown>[];
  gasPerChain: Record<number, number>;
  blockNumbers: Record<number, number>;
}
