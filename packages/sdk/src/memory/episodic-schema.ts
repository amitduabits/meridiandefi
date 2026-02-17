// ---------------------------------------------------------------------------
// Drizzle schema for episodic memory tables.
// Designed for PostgreSQL + TimescaleDB hypertables.
// ---------------------------------------------------------------------------

import {
  pgTable,
  text,
  integer,
  bigint,
  doublePrecision,
  jsonb,
  timestamp,
  index,
  serial,
  boolean,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// decisions — written after every Think→Act→Reflect cycle.
// ---------------------------------------------------------------------------

export const decisions = pgTable(
  "decisions",
  {
    id: text("id").primaryKey(),
    agentId: text("agent_id").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
    state: text("state").notNull(),
    reasoning: text("reasoning").notNull(),
    action: text("action").notNull(),
    params: jsonb("params").notNull().$type<Record<string, unknown>>(),
    outcome: text("outcome"),
    reward: doublePrecision("reward"),
    learnings: jsonb("learnings").$type<string[]>(),
    chainId: integer("chain_id").notNull(),
    txHash: text("tx_hash"),
  },
  (table) => ({
    agentIdIdx: index("idx_decisions_agent_id").on(table.agentId),
    timestampIdx: index("idx_decisions_timestamp").on(table.timestamp),
    chainIdIdx: index("idx_decisions_chain_id").on(table.chainId),
    agentTimestampIdx: index("idx_decisions_agent_timestamp").on(table.agentId, table.timestamp),
  }),
);

// ---------------------------------------------------------------------------
// transactions — raw on-chain transaction log.
// ---------------------------------------------------------------------------

export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    agentId: text("agent_id").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
    chainId: integer("chain_id").notNull(),
    txHash: text("tx_hash").notNull(),
    action: text("action").notNull(),
    params: jsonb("params").notNull().$type<Record<string, unknown>>(),
    gasUsed: bigint("gas_used", { mode: "number" }),
    gasCostUsd: doublePrecision("gas_cost_usd"),
    success: boolean("success").notNull().default(true),
    error: text("error"),
  },
  (table) => ({
    agentIdIdx: index("idx_transactions_agent_id").on(table.agentId),
    timestampIdx: index("idx_transactions_timestamp").on(table.timestamp),
    txHashIdx: index("idx_transactions_tx_hash").on(table.txHash),
  }),
);

// ---------------------------------------------------------------------------
// performance_snapshots — periodic portfolio snapshots for analytics.
// ---------------------------------------------------------------------------

export const performanceSnapshots = pgTable(
  "performance_snapshots",
  {
    id: serial("id").primaryKey(),
    agentId: text("agent_id").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
    portfolioValueUsd: doublePrecision("portfolio_value_usd").notNull(),
    pnlUsd: doublePrecision("pnl_usd").notNull(),
    pnlPct: doublePrecision("pnl_pct").notNull(),
    drawdownPct: doublePrecision("drawdown_pct").notNull(),
    positionCount: integer("position_count").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  },
  (table) => ({
    agentIdIdx: index("idx_perf_agent_id").on(table.agentId),
    timestampIdx: index("idx_perf_timestamp").on(table.timestamp),
  }),
);

// ---------------------------------------------------------------------------
// agent_logs — structured logs for debugging and audit trail.
// ---------------------------------------------------------------------------

export const agentLogs = pgTable(
  "agent_logs",
  {
    id: serial("id").primaryKey(),
    agentId: text("agent_id").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
    level: text("level").notNull(), // info, warn, error
    module: text("module").notNull(),
    message: text("message").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>(),
  },
  (table) => ({
    agentIdIdx: index("idx_logs_agent_id").on(table.agentId),
    timestampIdx: index("idx_logs_timestamp").on(table.timestamp),
    levelIdx: index("idx_logs_level").on(table.level),
  }),
);

// ---------------------------------------------------------------------------
// agent_checkpoints — state snapshots for crash recovery.
// ---------------------------------------------------------------------------

export const agentCheckpoints = pgTable(
  "agent_checkpoints",
  {
    id: serial("id").primaryKey(),
    agentId: text("agent_id").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
    machineSnapshot: jsonb("machine_snapshot").notNull().$type<unknown>(),
    workingMemory: jsonb("working_memory").notNull().$type<Record<string, unknown>>(),
    strategyId: text("strategy_id"),
    cycleCount: integer("cycle_count").notNull().default(0),
  },
  (table) => ({
    agentIdIdx: index("idx_checkpoints_agent_id").on(table.agentId),
    timestampIdx: index("idx_checkpoints_timestamp").on(table.timestamp),
  }),
);
