# Getting Started

This guide walks you through installing Meridian, setting up your environment, and running your first autonomous DeFi agent.

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 20+ | LTS recommended |
| pnpm | 9+ | `npm install -g pnpm` |
| Docker & Docker Compose | Latest | For Redis, PostgreSQL, Qdrant |
| Git | 2.x+ | |
| Foundry | Latest | Only for smart contract development |

Optional but recommended:
- An Anthropic API key (for Claude-based reasoning)
- An OpenAI API key (for fallback LLM provider)
- An Alchemy or Infura RPC URL (for production chain access)

## Installation

```bash
# Clone the repository
git clone https://github.com/amitduabits/meridiandefi.git
cd meridian

# Install all workspace dependencies
pnpm install

# Build all packages
pnpm turbo build
```

The monorepo uses pnpm workspaces with Turborepo for build orchestration. All packages are built in the correct dependency order automatically.

## Environment Setup

Copy the example environment file and fill in your keys:

```bash
cp .env.example .env
```

Required variables:

```env
# LLM Providers
ANTHROPIC_API_KEY=sk-ant-...        # Primary reasoning provider
OPENAI_API_KEY=sk-...               # Fallback provider (optional)

# EVM RPC URLs
ETH_RPC_URL=https://eth.llamarpc.com
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
BASE_RPC_URL=https://mainnet.base.org

# Infrastructure
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://meridian:meridian@localhost:5432/meridian
QDRANT_URL=http://localhost:6333

# Agent wallet (testnet only — never commit mainnet keys)
PRIVATE_KEY=0x...
```

## Infrastructure

Start the required services with Docker Compose:

```bash
docker compose up -d
```

This brings up:
- **Redis 7** on port 6379 (working memory / hot cache)
- **PostgreSQL 16 + TimescaleDB** on port 5432 (episodic memory / decision history)
- **Qdrant** on port 6333 (semantic memory / vector search)

Verify everything is running:

```bash
docker compose ps
```

## Running Your First Agent

The fastest way to see Meridian in action is the DeFi Rebalancer demo. It runs an autonomous agent on Arbitrum Sepolia that monitors a token portfolio and rebalances when allocation drifts beyond a threshold.

```bash
# Start in dry-run mode (no real transactions)
pnpm --filter @meridian/example-defi-rebalancer start
```

You should see the agent begin its Sense-Think-Act-Reflect cycle, reading on-chain balances, reasoning about portfolio drift, and (in dry-run mode) simulating rebalance trades.

## Core Concepts

### Agents

An agent is the fundamental autonomous unit in Meridian. Each agent wraps an xstate v5 state machine that governs its lifecycle:

```
IDLE -> SENSING -> THINKING -> ACTING -> REFLECTING -> IDLE
                                                       (repeat)
ERROR -> COOLDOWN -> IDLE
PAUSED (manual pause/resume)
```

Agents are created with a configuration object validated by Zod at construction time:

```typescript
import { Agent, EventBus } from "@meridian/sdk";

const agent = new Agent(
  {
    name: "My DeFi Agent",
    capabilities: ["SWAP", "PORTFOLIO_MANAGEMENT"],
    chains: [42161],           // Arbitrum One
    tickIntervalMs: 5_000,     // 5 second cycle
    dryRun: true,              // no real transactions
  },
  { eventBus, sense, think, act, memory },
);
```

### Dependency Injection

Agents don't hardcode their data sources or execution targets. Instead, four provider interfaces are injected at construction:

| Provider | Interface | Purpose |
|----------|-----------|---------|
| Sense | `ISenseProvider` | Reads chain data, prices, positions |
| Think | `IThinkProvider` | LLM reasoning, produces decisions |
| Act | `IActProvider` | Executes on-chain actions |
| Memory | `IMemoryProvider` | Stores and retrieves decision records |

This makes agents testable and composable. You can swap a live chain reader for a mock, or replace Claude with a local model, without changing the agent code.

### Strategies

A strategy defines **what** the agent should do. It consists of triggers (conditions that activate the strategy), actions (what to execute), and constraints (risk limits).

```typescript
import { StrategyBuilder } from "@meridian/sdk";

const builder = new StrategyBuilder();
const strategy = builder.fromCode({
  id: "my-strategy",
  name: "Simple DCA",
  version: "1.0.0",
  description: "Dollar-cost average into ETH every hour",
  triggers: [
    { type: "TIME_INTERVAL", params: { bars: 12 } },
  ],
  actions: [
    { type: "SWAP", params: { tokenOut: "ETH" }, chainId: 1 },
  ],
  constraints: {
    maxPositionPct: 25,
    stopLossPct: -5,
    maxSlippageBps: 50,
  },
});

agent.setStrategy(strategy);
await agent.start();
```

### Memory Tiers

Meridian uses a three-tier memory architecture:

| Tier | Storage | Latency | Use Case |
|------|---------|---------|----------|
| Working | Redis | < 1ms | Current market snapshot, active positions, in-flight tx |
| Episodic | PostgreSQL + TimescaleDB | < 10ms | Transaction history, decision logs, P&L tracking |
| Semantic | Qdrant | < 50ms | Embedded past decisions, protocol documentation, RAG |

### Risk Management

Every action passes through a pre-flight validator before execution. The risk module has **veto power** -- if any check fails, the trade is blocked. See [Risk Management](risk-management.md) for full details.

## Running Tests

```bash
# All tests across the monorepo
pnpm turbo test

# SDK tests only
pnpm --filter @meridian/sdk test

# Smart contract tests (requires Foundry)
cd packages/contracts && forge test --gas-report
```

## Project Structure

```
packages/
  sdk/           Core SDK — agent runtime, LLM, chains, strategy, memory, risk
  contracts/     Solidity smart contracts (Foundry)
  dashboard/     React 18 monitoring dashboard
  server/        tRPC + WebSocket API server
examples/
  defi-rebalancer/          Portfolio rebalancing on Arbitrum Sepolia
  multi-agent-portfolio/    3-agent collaborative portfolio management
```

## Next Steps

- [Architecture](architecture.md) -- understand the full system design
- [Strategy DSL Reference](strategy-dsl.md) -- define custom strategies
- [Protocol Adapters](protocol-adapters.md) -- connect to DeFi protocols
- [API Reference](api-reference/sdk.md) -- explore the SDK API
- [Examples](examples.md) -- learn from working agent implementations
