# Architecture

This document describes the high-level architecture of the Meridian framework, its module layout, data flow, and key design decisions.

## System Overview

Meridian is a DeFi-native agent framework structured as a pnpm monorepo. At its core, autonomous agents follow a tick-based **Sense - Think - Act - Reflect** decision cycle, powered by LLM reasoning and backed by a three-tier memory system.

```
┌─────────────────────────────────────────────────────────────┐
│                      MERIDIAN AGENT                          │
│                                                              │
│   ┌────────┐   ┌─────────┐   ┌───────┐   ┌───────────┐    │
│   │ SENSE  │──>│  THINK  │──>│  ACT  │──>│  REFLECT  │────┐│
│   └────────┘   └─────────┘   └───────┘   └───────────┘    ││
│       ^                                                     ││
│       └─────────────────────────────────────────────────────┘│
└──────┬──────────────┬──────────────┬──────────────┬──────────┘
       │              │              │              │
  ┌────▼────┐   ┌─────▼─────┐  ┌────▼────┐   ┌────▼────┐
  │  Chain   │   │    LLM    │  │  Risk   │   │ Memory  │
  │Connectors│   │  Gateway  │  │ Manager │   │ Manager │
  └─────────┘   └───────────┘  └─────────┘   └─────────┘
```

## Monorepo Structure

```
meridian/
├── packages/
│   ├── sdk/           @meridian/sdk         Core SDK (TypeScript)
│   ├── contracts/     @meridian/contracts   Smart contracts (Solidity, Foundry)
│   ├── dashboard/     @meridian/dashboard   React monitoring UI
│   ├── server/        @meridian/server      tRPC + WebSocket API
│   ├── proto/         @meridian/proto       Protobuf schemas for P2P
│   └── ml/            @meridian/ml          Python ML sidecar
├── apps/
│   ├── agent-node/    Standalone agent runner
│   └── cli/           Developer CLI
├── examples/
│   ├── defi-rebalancer/
│   └── multi-agent-portfolio/
├── docs/
└── infra/
```

All TypeScript packages use ESM modules with strict mode. The build pipeline is orchestrated by Turborepo (`turbo.json`), which handles dependency ordering and caching across packages.

## The 8 Core Modules

### 1. Agent Runtime Engine

The agent runtime is built on **xstate v5** state machines. Each agent has a deterministic lifecycle:

```
IDLE ──> SENSING ──> THINKING ──> ACTING ──> REFLECTING ──> IDLE
                                                             │
ERROR ──> COOLDOWN ──> IDLE                                  │
                                                             │
PAUSED <── (manual pause from any state)                     │
```

The `Agent` class orchestrates this cycle in a continuous loop. On each tick:

1. **Sense** -- the `ISenseProvider` gathers on-chain data (balances, prices, positions)
2. **Think** -- the `IThinkProvider` calls an LLM to reason about the market context and produce a decision
3. **Act** -- the `IActProvider` executes the decided action via chain connectors
4. **Reflect** -- the agent evaluates the outcome, stores the `DecisionRecord` in memory, and increments the cycle counter

Configuration is validated at startup with Zod (`AgentConfigSchema`). Key parameters include `tickIntervalMs` (cycle frequency), `maxCycles` (auto-pause after N cycles), `dryRun` (simulation mode), and `cooldownMs` (delay after errors).

### 2. LLM Integration Layer

The `LLMGateway` provides a unified interface over multiple LLM providers with automatic fallback, request caching (LRU), and rate limiting.

**Provider hierarchy:**

| Use Case | Primary | Fallback |
|----------|---------|----------|
| Trade reasoning | Claude Sonnet | GPT-4o |
| Data extraction | GPT-4o-mini | Mistral 7B (local) |
| Strategy generation | Claude Sonnet | GPT-4o |
| Real-time signals | Llama 3.1 8B (local) | GPT-4o-mini |
| Risk assessment | Claude Sonnet | Claude Haiku |

All LLM responses are normalized into a common `LLMResponse` type with usage tracking (tokens, latency, cost). Structured outputs are parsed with Zod schemas (`MarketAnalysisSchema`, `TradeDecisionSchema`, `RiskAssessmentSchema`, `ReflectionSchema`).

Prompt templates use Handlebars (`.hbs` files) managed by the `renderPrompt` / `registerTemplate` API.

### 3. Chain Connector Module

Chain interaction is abstracted behind two layers:

**`EVMProvider`** -- manages viem `PublicClient` and `WalletClient` instances per chain. Lazily initializes clients and provides methods for `getBalance`, `getBlock`, `estimateGas`, `sendTransaction`, and `waitForReceipt`. Ships with default configurations for Ethereum, Arbitrum, Base, Optimism, Polygon, and Avalanche.

**`IProtocolAdapter`** -- encodes DeFi protocol interactions into raw calldata. Each adapter declares its `protocolId`, `supportedChains`, and `supportedActions`, then implements `encode()`, `decode()`, and `quote()` methods. The `UniswapV3Adapter` is the reference implementation.

The unifying `IDeFiConnector` interface provides a protocol-agnostic API: `swap()`, `addLiquidity()`, `removeLiquidity()`, `borrow()`, `repay()`, `stake()`, `bridge()`, `getPrice()`, `getBalance()`, `getPositions()`, `simulate()`, and `submit()`.

### 4. Strategy Engine

Strategies are defined as `IStrategy` objects with triggers, actions, and constraints. The `StrategyBuilder` validates and constructs these from plain objects.

**Trigger types:** `PRICE_ABOVE`, `PRICE_BELOW`, `PRICE_CHANGE_PCT`, `INDICATOR`, `TIME_INTERVAL`, `PORTFOLIO_DRIFT`, `GAS_BELOW`, `CUSTOM`.

**Action types:** `SWAP`, `ADD_LIQUIDITY`, `REMOVE_LIQUIDITY`, `BORROW`, `REPAY`, `STAKE`, `UNSTAKE`, `BRIDGE`, `NOTIFY`, `REBALANCE`, `CUSTOM`.

The `Backtester` simulates strategies against historical OHLCV data, producing metrics like total return, Sharpe ratio, Sortino ratio, max drawdown, and win rate. Technical indicators (`sma`, `ema`, `rsi`, `macd`, `bollingerBands`, `vwap`, `zScore`) are pure functions with no external dependencies.

### 5. Memory & State

Three-tier memory matches DeFi operational needs:

| Tier | Implementation | Latency | TTL | Contents |
|------|---------------|---------|-----|----------|
| Working | `RedisWorkingMemory` (Redis 7+) | < 1ms | Seconds-minutes | Market snapshots, active positions, in-flight tx |
| Episodic | `PostgresEpisodicMemory` (drizzle-orm) | < 10ms | Days-months | Decisions, transactions, performance snapshots |
| Semantic | `QdrantSemanticMemory` | < 50ms | Persistent | Embedded decisions, protocol docs, RAG contexts |

The `MemoryManager` coordinates all three tiers. The `RAGPipeline` queries semantic memory and injects relevant past decisions and protocol knowledge into LLM prompts. The `PostgresCheckpointManager` enables crash recovery by serializing agent state (xstate snapshot + working memory) to PostgreSQL.

Redis keys follow the pattern `meridian:agent:{agentId}:{suffix}` with configurable TTLs. Market snapshots default to 60-second TTL; general data defaults to 5 minutes.

### 6. Agent-to-Agent Communication

Built on **libp2p** with GossipSub for pub/sub messaging and Kademlia DHT for peer discovery. Messages are serialized with Protocol Buffers (defined in `packages/proto`).

Agents discover each other by advertising capabilities to the DHT. Task negotiation follows a request-accept-complete protocol where agents can delegate specialized work (e.g., a portfolio manager asks a risk assessor to evaluate a position).

### 7. Risk Management

The `RiskManager` orchestrates two subsystems and has **veto power** over every agent action:

**Pre-flight validation** (`PreFlightValidator`) -- runs 7 deterministic checks before every transaction:
1. Position size within `maxPositionSizeUsd`
2. Portfolio exposure within `maxPortfolioExposurePct`
3. Gas cost below `maxGasCostPct` of trade value
4. Slippage within `maxSlippageBps`
5. Daily loss within `maxDailyLossPct`
6. Daily trade count within `maxDailyTrades`
7. Open positions within `maxOpenPositions`

**Circuit breakers** (`CircuitBreakerManager`) -- follow a CLOSED -> OPEN -> HALF_OPEN -> CLOSED state machine with configurable cooldowns per breaker type (`PORTFOLIO_DRAWDOWN`, `FLASH_CRASH`, `GAS_SPIKE`, `RPC_FAILURE`, `ORACLE_STALE`, `CONTRACT_ANOMALY`).

### 8. Monitoring Dashboard

React 18 single-page application built with Vite, Tailwind v4, and Radix UI. Communicates with the server via tRPC and WebSocket subscriptions. Key views: portfolio overview, agent management, risk dashboard, transaction history, and system health.

## Data Flow

A single agent cycle flows through these steps:

```
1. Tick fires (BullMQ scheduler or internal timer)
2. SENSE:  ISenseProvider.gather() reads chain data via EVMProvider
3. Agent builds prompt from market snapshot + strategy + recent decisions
4. THINK:  IThinkProvider.reason() calls LLMGateway.complete()
           LLMGateway tries primary provider, falls back on failure
5. ACT:    RiskManager.validateAction() runs pre-flight checks
           If denied, action is vetoed (logged, no execution)
           If approved, IActProvider.execute() submits via chain connector
6. REFLECT: DecisionRecord stored in episodic memory
            Semantic memory updated with embedded decision context
            Working memory updated with new positions
7. Agent sleeps for tickIntervalMs, then loops back to step 1
```

## Error Handling

All errors extend the `MeridianError` base class with structured fields:

```typescript
class MeridianError extends Error {
  readonly code: string;
  readonly recoverable: boolean;
  readonly context?: Record<string, unknown>;
}
```

Specialized subclasses: `AgentError`, `ChainError`, `LLMError`, `RiskError`, `StrategyError`. The `recoverable` flag determines whether the agent enters cooldown (recoverable) or halts (fatal).

## Event System

The `EventBus` provides typed pub/sub for cross-cutting concerns. Key events:

| Event | Payload | Emitted By |
|-------|---------|------------|
| `agent:paused` | `{ agentId, reason }` | Agent |
| `agent:resumed` | `{ agentId }` | Agent |
| `agent:error` | `{ agentId, error, recoverable }` | Agent |
| `agent:trade` | `{ agentId, tx: TxResult }` | Agent |
| `agent:decision` | `{ agentId, record: DecisionRecord }` | Agent |
| `agent:cycleComplete` | `{ agentId, cycle, durationMs }` | Agent |
| `market:snapshot` | `{ snapshot: MarketSnapshot }` | Agent |
| `strategy:loaded` | `{ agentId, strategy }` | Agent |

## Design Principles

1. **Dependency injection over imports** -- agents receive providers as constructor arguments, enabling testing and composition without mocking internal modules.

2. **Deterministic risk logic** -- the risk module is pure computation with no LLM calls and no I/O. Pre-flight validation and circuit breakers produce the same output for the same input.

3. **ESM-only** -- all packages use ES modules (`"type": "module"`) with `.js` extensions in imports and strict TypeScript.

4. **Zod validation at boundaries** -- all configuration, LLM outputs, and external data are validated with Zod schemas before entering the system.

5. **Structured logging** -- pino is the sole logging interface, producing JSON output for easy ingestion into log aggregators.
