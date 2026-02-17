-- ---------------------------------------------------------------------------
-- Meridian Memory Schema — Initial Migration
-- Requires PostgreSQL 15+ and TimescaleDB extension.
-- ---------------------------------------------------------------------------

-- Enable TimescaleDB extension if not already enabled.
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ---------------------------------------------------------------------------
-- decisions — written after every Think→Act→Reflect cycle.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS decisions (
  id            TEXT PRIMARY KEY,
  agent_id      TEXT NOT NULL,
  "timestamp"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  state         TEXT NOT NULL,
  reasoning     TEXT NOT NULL,
  action        TEXT NOT NULL,
  params        JSONB NOT NULL DEFAULT '{}',
  outcome       TEXT,
  reward        DOUBLE PRECISION,
  learnings     JSONB,
  chain_id      INTEGER NOT NULL,
  tx_hash       TEXT
);

CREATE INDEX IF NOT EXISTS idx_decisions_agent_id ON decisions(agent_id);
CREATE INDEX IF NOT EXISTS idx_decisions_timestamp ON decisions("timestamp");
CREATE INDEX IF NOT EXISTS idx_decisions_chain_id ON decisions(chain_id);
CREATE INDEX IF NOT EXISTS idx_decisions_agent_timestamp ON decisions(agent_id, "timestamp");

-- Convert to hypertable for TimescaleDB time-series partitioning.
SELECT create_hypertable('decisions', 'timestamp', if_not_exists => TRUE);

-- ---------------------------------------------------------------------------
-- transactions — raw on-chain transaction log.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS transactions (
  id            SERIAL PRIMARY KEY,
  agent_id      TEXT NOT NULL,
  "timestamp"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  chain_id      INTEGER NOT NULL,
  tx_hash       TEXT NOT NULL,
  action        TEXT NOT NULL,
  params        JSONB NOT NULL DEFAULT '{}',
  gas_used      BIGINT,
  gas_cost_usd  DOUBLE PRECISION,
  success       BOOLEAN NOT NULL DEFAULT TRUE,
  error         TEXT
);

CREATE INDEX IF NOT EXISTS idx_transactions_agent_id ON transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions("timestamp");
CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash);

SELECT create_hypertable('transactions', 'timestamp', if_not_exists => TRUE);

-- ---------------------------------------------------------------------------
-- performance_snapshots — periodic portfolio snapshots for analytics.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS performance_snapshots (
  id                  SERIAL PRIMARY KEY,
  agent_id            TEXT NOT NULL,
  "timestamp"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  portfolio_value_usd DOUBLE PRECISION NOT NULL,
  pnl_usd             DOUBLE PRECISION NOT NULL,
  pnl_pct             DOUBLE PRECISION NOT NULL,
  drawdown_pct        DOUBLE PRECISION NOT NULL,
  position_count      INTEGER NOT NULL,
  metadata            JSONB
);

CREATE INDEX IF NOT EXISTS idx_perf_agent_id ON performance_snapshots(agent_id);
CREATE INDEX IF NOT EXISTS idx_perf_timestamp ON performance_snapshots("timestamp");

SELECT create_hypertable('performance_snapshots', 'timestamp', if_not_exists => TRUE);

-- ---------------------------------------------------------------------------
-- agent_logs — structured logs for debugging and audit trail.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS agent_logs (
  id          SERIAL PRIMARY KEY,
  agent_id    TEXT NOT NULL,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level       TEXT NOT NULL,
  module      TEXT NOT NULL,
  message     TEXT NOT NULL,
  data        JSONB
);

CREATE INDEX IF NOT EXISTS idx_logs_agent_id ON agent_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON agent_logs("timestamp");
CREATE INDEX IF NOT EXISTS idx_logs_level ON agent_logs(level);

SELECT create_hypertable('agent_logs', 'timestamp', if_not_exists => TRUE);

-- ---------------------------------------------------------------------------
-- agent_checkpoints — state snapshots for crash recovery.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS agent_checkpoints (
  id                SERIAL PRIMARY KEY,
  agent_id          TEXT NOT NULL,
  "timestamp"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  machine_snapshot  JSONB NOT NULL,
  working_memory    JSONB NOT NULL DEFAULT '{}',
  strategy_id       TEXT,
  cycle_count       INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_checkpoints_agent_id ON agent_checkpoints(agent_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_timestamp ON agent_checkpoints("timestamp");
