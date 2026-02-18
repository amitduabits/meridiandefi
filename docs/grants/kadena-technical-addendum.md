# Meridian on Kadena — Technical Porting Addendum

**Detailed Architecture Compatibility Analysis and Implementation Plan**
**February 2026**

---

## 1. Architecture Compatibility Analysis

### 1.1 EVM to Chainweb EVM Mapping

Kadena's EVM compatibility layer provides a standard Ethereum Virtual Machine execution environment within the Chainweb network. Meridian's architecture is EVM-first, meaning the mapping is a deployment configuration change rather than an architectural refactor.

| Meridian Component | Current Implementation | Chainweb EVM Mapping | Migration Effort |
|-------------------|----------------------|---------------------|-----------------|
| Smart Contracts (Solidity 0.8.24+) | Deployed on Arbitrum Sepolia | Direct deployment via Foundry — no code changes | Minimal (RPC config) |
| EVM Client (viem) | Arbitrum/Ethereum RPC | Chainweb EVM RPC endpoint swap | Minimal (config) |
| Gas Estimation | EIP-1559 fee estimation | Chainweb gas model calibration | Low (1-2 days) |
| Chain ID Registration | Arbitrum: 421614 | Chainweb EVM testnet/mainnet chain IDs | Minimal (config) |
| Block Confirmation | Arbitrum finality (~7 days L1) | Chainweb finality (30-second block time) | Low (parameter tuning) |
| Event Indexing | Standard EVM event logs | Chainweb EVM event log compatibility | Minimal (same ABI) |
| Contract Verification | Etherscan/Arbiscan | Kadena block explorer integration | Low (tooling config) |

### 1.2 Dependency Compatibility Matrix

All core Meridian dependencies are chain-agnostic or EVM-generic. No dependency requires Arbitrum-specific or Ethereum-specific features.

| Dependency | Version | Chainweb EVM Compatible | Notes |
|-----------|---------|------------------------|-------|
| viem | Latest | Yes | Uses standard JSON-RPC; chain config is pluggable |
| ethers v6 | 6.x | Yes | Compatibility layer only; viem is primary |
| OpenZeppelin v5 | 5.x | Yes | Standard EVM contracts |
| Foundry | Latest | Yes | Uses standard EVM bytecode compilation |
| drizzle-orm | 0.33+ | N/A | Off-chain database ORM; chain-independent |
| BullMQ | Latest | N/A | Off-chain job queue; chain-independent |
| xstate v5 | 5.x | N/A | Off-chain state machine; chain-independent |
| pino | Latest | N/A | Off-chain logging; chain-independent |

### 1.3 Non-Compatible Areas Requiring Custom Development

The following areas require Kadena-specific implementation work:

1. **Protocol Adapters** — Kadena's DEX and lending protocols have unique contract interfaces. New protocol adapters implementing the `IDeFiConnector` methods must be written for each Kadena-native protocol.

2. **Multi-Chain Routing** — Chainweb's 20 parallel chains introduce a routing dimension that does not exist on single-chain networks. The agent must determine which of the 20 chains offers optimal execution for a given transaction.

3. **Cross-Chain State Queries** — Monitoring portfolio state across 20 chains requires concurrent RPC queries with aggregation. The current single-chain state query pattern must be extended to parallel multi-chain queries.

4. **Gas Model Calibration** — Chainweb's gas pricing may differ from EIP-1559. The gas estimation module in `packages/sdk/src/chains/evm/gas.ts` needs calibration against Chainweb's fee market.

---

## 2. Chain Connector Implementation Plan

### 2.1 IDeFiConnector Interface

The `IDeFiConnector` interface defines 12 methods that every chain connector must implement. The Chainweb connector will implement all 12 using viem as the underlying EVM client.

```
IDeFiConnector
  swap(params: SwapParams): Promise<TxResult>
  addLiquidity(params: LiquidityParams): Promise<TxResult>
  removeLiquidity(params: LiquidityParams): Promise<TxResult>
  borrow(params: BorrowParams): Promise<TxResult>
  repay(params: RepayParams): Promise<TxResult>
  stake(params: StakeParams): Promise<TxResult>
  bridge(params: BridgeParams): Promise<TxResult>
  getPrice(token: TokenId, chainId: number): Promise<PriceData>
  getBalance(address: string, token: TokenId, chainId: number): Promise<bigint>
  getPositions(address: string, chainId: number): Promise<Position[]>
  simulate(txData: unknown): Promise<SimulationResult>
  submit(txData: unknown): Promise<TxResult>
```

### 2.2 Implementation Architecture

```
packages/sdk/src/chains/
  connector.ts                  — IDeFiConnector interface (existing)
  evm/
    provider.ts                 — EVM provider factory (existing)
    gas.ts                      — Gas estimation (existing, extend for Chainweb)
    nonce.ts                    — Nonce management (existing)
  chainweb/
    chainweb-provider.ts        — Chainweb-specific viem client configuration
    chainweb-connector.ts       — IDeFiConnector implementation for Chainweb EVM
    chainweb-gas.ts             — Chainweb gas model calibration
    multi-chain-router.ts       — 20-chain routing and aggregation logic
    chain-registry.ts           — Registry of all 20 Chainweb chain IDs and RPC endpoints
  protocols/
    base-adapter.ts             — Base protocol adapter (existing)
    uniswap-v3.ts               — Uniswap V3 adapter (existing, reference implementation)
    kadena-dex.ts               — Kadena-native DEX adapter (new)
    kadena-lending.ts           — Kadena-native lending adapter (new)
```

### 2.3 Chainweb Provider Configuration

The Chainweb EVM provider extends Meridian's existing EVM provider factory with Kadena-specific configuration.

**Required configuration parameters:**

| Parameter | Type | Description |
|----------|------|-------------|
| `chainwebChainIds` | `number[]` | Array of all 20 Chainweb EVM chain IDs |
| `rpcEndpoints` | `Record<number, string>` | RPC URL for each of the 20 chains |
| `blockConfirmations` | `number` | Confirmations required before considering a transaction final |
| `gasMultiplier` | `number` | Multiplier for gas estimation (calibrated to Chainweb's fee model) |
| `maxConcurrentRpcCalls` | `number` | Rate limiting for parallel RPC queries across 20 chains |
| `preferredChains` | `number[]` | Subset of chains for priority execution (optimization) |

### 2.4 Implementation Timeline

| Week | Deliverable | Details |
|------|------------|---------|
| 1 | Chainweb provider and chain registry | viem client configuration for all 20 chains, RPC connectivity validation |
| 2 | Core connector methods | `getPrice()`, `getBalance()`, `getPositions()`, `simulate()`, `submit()` |
| 3 | DeFi operations | `swap()`, `addLiquidity()`, `removeLiquidity()` via Kadena DEX adapter |
| 4 | Lending and staking | `borrow()`, `repay()`, `stake()`, `bridge()` implementations |
| 5 | Multi-chain router | Cross-chain query aggregation, optimal chain selection logic |
| 6 | Gas calibration and testing | Chainweb gas model tuning, integration tests, testnet validation |

---

## 3. Multi-Chain Agent Architecture for 20 Parallel Braided Chains

### 3.1 The Coordination Problem

Chainweb's 20 parallel braided chains present a unique challenge: state is distributed across 20 concurrent execution environments. A portfolio manager must maintain a unified view of positions, prices, and opportunities that span all chains simultaneously. No existing DeFi agent framework addresses this.

### 3.2 Hierarchical Agent Topology

Meridian's multi-agent orchestration engine enables a hierarchical topology purpose-built for Chainweb:

```
                    Portfolio Manager Agent
                    (Unified Decision-Making)
                            |
            ┌───────────────┼───────────────┐
            |               |               |
    Risk Sentinel      Strategy Engine    Execution Router
    (Cross-Chain       (Unified Signal    (Optimal Chain
     Monitoring)        Generation)        Selection)
            |               |               |
    ┌───┬───┴───┬───┐      |       ┌───┬───┴───┬───┐
    |   |       |   |      |       |   |       |   |
   C1  C2  ... C19 C20    |      C1  C2  ... C19 C20
   Chain Watcher Agents    |    Execution Agents
   (Per-Chain State)       |    (Per-Chain Tx Submit)
                           |
                    ┌──────┴──────┐
                    |             |
               ML Models    LLM Gateway
               (Prediction) (Reasoning)
```

**Agent Roles:**

| Agent Type | Count | Responsibility |
|-----------|-------|---------------|
| Portfolio Manager | 1 | Unified decision-making across all 20 chains. Aggregates intelligence from chain watchers, evaluates strategy signals, delegates execution. |
| Chain Watcher | Up to 20 | Per-chain state monitoring. Each watcher tracks prices, liquidity depths, pending transactions, and protocol health on a single Chainweb chain. Reports state changes via libp2p GossipSub. |
| Risk Sentinel | 1 | Cross-chain risk aggregation. Monitors portfolio exposure across all chains, enforces global circuit breakers, detects correlated anomalies across chains. |
| Strategy Engine | 1 | Signal generation from aggregated multi-chain data. Evaluates strategy triggers against the unified state view. |
| Execution Router | 1 | Determines which of the 20 chains offers optimal execution for a given trade (lowest gas, deepest liquidity, minimal slippage). |
| Execution Agent | Variable | Per-chain transaction submission and confirmation tracking. |

### 3.3 Communication Protocol

Inter-agent communication uses libp2p GossipSub with protobuf message serialization. Message types for Chainweb multi-chain coordination:

| Message Type | Sender | Receiver | Payload |
|-------------|--------|----------|---------|
| `ChainStateUpdate` | Chain Watcher | Portfolio Manager, Risk Sentinel | Chain ID, block number, token prices, liquidity depths, gas price |
| `RiskAlert` | Risk Sentinel | Portfolio Manager | Alert type, affected chains, severity, recommended action |
| `TradeSignal` | Strategy Engine | Portfolio Manager | Asset pair, direction, confidence, supporting data |
| `ExecutionRequest` | Portfolio Manager | Execution Router | Trade parameters, acceptable chains, deadline |
| `ChainSelection` | Execution Router | Execution Agent | Selected chain ID, routing rationale, gas estimate |
| `ExecutionResult` | Execution Agent | Portfolio Manager | Transaction hash, chain ID, execution price, actual gas |

### 3.4 State Aggregation

The Portfolio Manager maintains a unified state view aggregated from all 20 Chain Watcher agents. State updates are received asynchronously via GossipSub and merged into a consolidated `ChainwebPortfolioState`:

```
ChainwebPortfolioState
  totalValueUsd: number                      — Aggregated across all 20 chains
  chainStates: Map<chainId, ChainState>      — Per-chain breakdown
    positions: Position[]
    tokenBalances: Map<TokenId, bigint>
    currentGasPrice: bigint
    lastBlockNumber: bigint
    lastUpdateTimestamp: number
  crossChainOpportunities: Opportunity[]     — Identified cross-chain arbitrage/yield
  globalRiskScore: number                    — Aggregated risk across all chains
```

State staleness is managed per-chain. If a Chain Watcher has not reported within a configurable threshold (default: 30 seconds), the corresponding chain state is marked stale and excluded from active strategy evaluation until fresh data arrives. The Oracle Staleness circuit breaker trips if more than 25% of chains are stale simultaneously.

---

## 4. Risk Management Adaptations

### 4.1 Pre-Flight Validation Extensions

The existing `PreFlightValidator` performs seven checks per transaction. For Chainweb, three additional checks are introduced:

| Check | Description | Risk Contribution |
|-------|-------------|-------------------|
| Cross-Chain Exposure | Total exposure across all 20 chains must not exceed configurable limit. Prevents concentration risk where one chain failure impacts the entire portfolio. | 0-25 |
| Chain Staleness | Transaction is denied if the target chain's state data is older than the staleness threshold. Prevents execution on stale pricing. | 0-20 |
| Parallel Execution Limit | Maximum number of simultaneous pending transactions across all chains. Prevents over-commitment during network congestion. | 0-15 |

### 4.2 Circuit Breaker Extensions

Two new circuit breaker types for Chainweb:

| Breaker Type | Trigger Condition | Cooldown | Recovery Probes |
|-------------|-------------------|----------|-----------------|
| `CHAINWEB_DESYNC` | More than 3 chains report block height divergence exceeding 10 blocks from the median. Indicates potential chain split or network partition. | 15 minutes | 5 probes |
| `CROSS_CHAIN_ANOMALY` | Price divergence between the same asset on different Chainweb chains exceeds 5% for more than 60 seconds. Indicates potential oracle or bridge exploit. | 30 minutes | 3 probes |

### 4.3 Position Limit Distribution

Risk limits must be defined both globally (across all 20 chains) and per-chain. The configuration schema extends `RiskLimits`:

```
ChainwebRiskLimits extends RiskLimits
  globalMaxPositionSizeUsd: number           — Maximum single position across any chain
  perChainMaxExposurePct: number             — Maximum portfolio % on any single chain
  maxConcurrentPendingTx: number             — Maximum pending transactions across all chains
  chainStalenessThresholdMs: number          — Maximum age of chain state data
  crossChainDivergenceThresholdPct: number   — Max acceptable price divergence between chains
```

### 4.4 Emergency Procedures

The `StrategyVault.emergencyWithdraw()` function operates per-contract. On Chainweb, a portfolio spanning multiple chains requires coordinated emergency procedures:

1. Portfolio Manager issues `EMERGENCY_HALT` to all agents via GossipSub
2. All Execution Agents cancel pending transactions where possible
3. Risk Sentinel trips all circuit breakers to `OPEN` state
4. Each chain's StrategyVault executes `emergencyWithdraw()` independently
5. Portfolio Manager aggregates withdrawal confirmations and reports final state

---

## 5. Smart Contract Porting Strategy

### 5.1 Contract Deployment Plan

All four Meridian contracts are Solidity 0.8.24+ with OpenZeppelin v5 dependencies. Deployment to Chainweb EVM uses standard Foundry tooling.

| Contract | Standard | Key Features | Chainweb Deployment Notes |
|----------|----------|-------------|--------------------------|
| AgentRegistry | ERC-721 | Agent identity, capability indexing, oracle reputation | Deploy once per Chainweb environment. Agents register on a single chain; the registry is the canonical identity source. |
| StrategyVault | ERC-4626 | Tokenized vault, per-tx limits, daily caps, protocol allowlist, 48hr timelock | Deploy one vault per strategy per chain. Each vault holds assets on a single Chainweb chain. |
| PaymentEscrow | Custom | Agent-to-agent payment settlement | Deploy on a designated "settlement chain" (one of the 20). All inter-agent payments route through this chain. |
| MeridianGovernance | Governor | On-chain parameter management, voting | Deploy on the same chain as AgentRegistry. Governance actions propagate to other chains via admin functions. |

### 5.2 Cross-Chain Contract Coordination

Chainweb's braided architecture means contracts on different chains cannot directly call each other. Coordination between contracts on different Chainweb chains follows this pattern:

1. **Canonical Chain** — AgentRegistry, Governance, and PaymentEscrow deploy on a single designated canonical chain.
2. **Per-Chain Vaults** — StrategyVaults deploy on each chain where the agent holds positions.
3. **Off-Chain Coordination** — The Meridian agent runtime (off-chain) reads state from all chains and submits transactions to the appropriate chain.
4. **State Sync** — The agent's memory system (Redis + PostgreSQL) maintains the unified cross-chain state. On-chain state is authoritative for each individual chain; the off-chain aggregation is the unified view.

This pattern avoids cross-chain messaging complexity while preserving the security properties of each individual chain's smart contracts.

### 5.3 Contract Testing on Chainweb

| Test Phase | Method | Scope |
|-----------|--------|-------|
| Unit Tests | `forge test --gas-report` (local) | All contract logic, access controls, edge cases |
| Chainweb Testnet Integration | `forge script` with Chainweb RPC | Deployment, basic operations, gas consumption |
| Multi-Contract Integration | Vitest + viem against testnet | AgentRegistry + StrategyVault + PaymentEscrow interaction flows |
| Agent Lifecycle E2E | Playwright + testnet | Full agent lifecycle: register, execute strategy, collect payment, deregister |
| Load Testing | Custom harness | 50+ concurrent agent transactions across multiple chains |

### 5.4 Gas Optimization for Chainweb

Chainweb's gas model may have different base fees and pricing dynamics compared to Arbitrum or Ethereum mainnet. Optimization targets:

- **AgentRegistry.registerAgent()** — Storage-heavy (capabilities array, index updates). Profile against Chainweb gas costs; consider capability count limits if gas exceeds targets.
- **StrategyVault.executeStrategy()** — Multi-call pattern with loop. Profile batch sizes against Chainweb block gas limits.
- **PaymentEscrow settlements** — Optimize for minimum gas per settlement transaction.
- **Governance proposals** — Evaluate if Chainweb gas costs affect governance participation incentives.

---

## 6. Testing Strategy on Chainweb Testnet

### 6.1 Test Pyramid

```
                 ┌───────────┐
                 │    E2E    │   Playwright — Full agent lifecycle on Chainweb testnet
                 │   Tests   │   5-10 scenarios, run weekly
                 ├───────────┤
                 │Integration│   Vitest — Chain connector against Chainweb testnet
                 │   Tests   │   50+ tests, run daily
                 ├───────────┤
                 │   Unit    │   Vitest + Foundry — All business logic, mocked chains
                 │   Tests   │   200+ tests, run on every commit
                 └───────────┘
```

### 6.2 Chainweb-Specific Test Scenarios

| Scenario | Description | Validation Criteria |
|----------|-------------|-------------------|
| Single-Chain Swap | Execute a token swap on one Chainweb chain via Kadena DEX | Transaction confirmed, correct output amount within slippage tolerance |
| Multi-Chain Price Query | Query same token price on all 20 chains concurrently | All 20 queries return within 5 seconds, prices within expected range |
| Cross-Chain Arbitrage Detection | Detect price differential between two Chainweb chains | Signal generated when differential exceeds threshold, correct chains identified |
| Agent Registration | Register agent on AgentRegistry deployed to Chainweb | ERC-721 minted, capabilities indexed, `findAgents()` returns correct results |
| Vault Strategy Execution | Execute multi-step strategy through StrategyVault | All protocol calls succeed, daily limit tracking accurate, events emitted |
| Circuit Breaker — Chain Desync | Simulate chain state divergence | `CHAINWEB_DESYNC` breaker trips, all operations halt, auto-recovery after cooldown |
| Emergency Withdrawal | Trigger coordinated emergency withdrawal across 3 chains | All vaults drain, Portfolio Manager confirms complete withdrawal |
| 20-Chain State Aggregation | Monitor state across all 20 chains simultaneously | Unified portfolio state updated within 30 seconds of any chain state change |
| Gas Estimation Accuracy | Compare estimated vs actual gas across 50 transactions | Estimation within 15% of actual on 90%+ of transactions |
| Nonce Management Under Load | Submit 10 concurrent transactions from same agent | All transactions confirmed, no nonce collisions, correct ordering |

### 6.3 Continuous Integration Pipeline

```
On every commit:
  1. Lint (eslint + prettier)
  2. Type check (tsc --noEmit)
  3. Unit tests (vitest run)
  4. Contract tests (forge test --gas-report)

Daily (scheduled):
  5. Chainweb testnet integration tests
  6. Agent lifecycle smoke test on testnet
  7. Gas consumption report comparison

Weekly:
  8. Full E2E test suite on Chainweb testnet
  9. Multi-agent orchestration validation
  10. Performance benchmarks (latency, throughput)
```

---

## 7. Performance Considerations

### 7.1 RPC Query Optimization

Monitoring 20 parallel chains requires efficient RPC usage. Without optimization, 20 chains with 1-second polling intervals generate 1,200 RPC calls per minute per data type.

**Optimization strategies:**

| Strategy | Implementation | Impact |
|----------|---------------|--------|
| Batch JSON-RPC | Use `eth_call` batching to combine multiple queries per chain into single HTTP requests | 5-10x reduction in HTTP overhead |
| Adaptive Polling | Poll active chains (with open positions) at 1-second intervals; idle chains at 10-second intervals | 50-80% reduction in RPC calls for chains without activity |
| WebSocket Subscriptions | Use `eth_subscribe` for real-time block and event notifications where Chainweb EVM supports WebSocket | Eliminates polling for event-driven data |
| Local Caching | Cache token prices, liquidity depths, and gas prices in Redis with configurable TTL per data type | Reduces redundant queries for slowly-changing data |
| Connection Pooling | Maintain persistent HTTP/WebSocket connections per chain with health checking | Reduces connection establishment latency |

### 7.2 Agent Decision Latency Budget

The target decision latency is under 3 seconds for the full Sense-Think-Act-Reflect cycle. On Chainweb, the Sense phase must aggregate data from multiple chains.

| Phase | Single-Chain Budget | Chainweb Budget (20 chains) | Optimization |
|-------|-------------------|---------------------------|-------------|
| Sense | 200ms | 500ms | Parallel RPC queries with Promise.allSettled(), pre-aggregated cache |
| Think | 1,500ms | 1,500ms | No change — LLM reasoning operates on aggregated state |
| Act | 800ms | 800ms | Single-chain execution per transaction; chain already selected |
| Reflect | 500ms | 500ms | No change — outcome evaluation is post-execution |
| **Total** | **3,000ms** | **3,300ms** | Target: under 3.5 seconds for 20-chain cycle |

### 7.3 Memory System Scaling

The three-tier memory system scales linearly with the number of chains monitored:

| Tier | Current Size (2 chains) | Projected Size (20 chains) | Scaling Strategy |
|------|------------------------|---------------------------|-----------------|
| Redis (Hot) | ~50 keys | ~500 keys | Redis handles millions of keys; no architecture change |
| PostgreSQL (Warm) | ~1K rows/day | ~10K rows/day | TimescaleDB hypertables with chain_id partition key |
| Qdrant (Knowledge) | ~5K vectors | ~50K vectors | Qdrant scales to millions; add chain_id metadata filter |

### 7.4 Resource Requirements

| Resource | Minimum (Testnet) | Recommended (Production) |
|----------|-------------------|-------------------------|
| CPU | 4 cores | 8 cores |
| RAM | 8 GB | 16 GB |
| Storage | 50 GB SSD | 200 GB NVMe |
| Redis | 1 GB memory | 4 GB memory |
| PostgreSQL | 20 GB | 100 GB (with TimescaleDB compression) |
| Network | 100 Mbps | 1 Gbps (for 20 concurrent RPC connections) |
| RPC Endpoints | 20 (one per Chainweb chain) | 40 (primary + fallback per chain) |

---

## 8. Deployment Architecture

### 8.1 Testnet Deployment (Month 1)

```
┌─────────────────────────────────────────────┐
│              Meridian Agent Node             │
│                                             │
│  ┌─────────┐  ┌─────────┐  ┌────────────┐ │
│  │ Agent   │  │ Multi-  │  │ Chainweb   │ │
│  │ Runtime │  │ Chain   │  │ Connector  │ │
│  │ (xstate)│  │ Router  │  │ (20 RPCs)  │ │
│  └────┬────┘  └────┬────┘  └─────┬──────┘ │
│       │            │              │         │
│  ┌────▼────────────▼──────────────▼──────┐ │
│  │         Risk Management Layer         │ │
│  │  PreFlight + CircuitBreakers + Limits │ │
│  └───────────────────┬──────────────────┘ │
│                      │                     │
│  ┌──────┐  ┌────────▼┐  ┌──────────────┐ │
│  │Redis │  │PostgreSQL│  │    Qdrant    │ │
│  │(Hot) │  │(Episodic)│  │  (Semantic)  │ │
│  └──────┘  └─────────┘  └──────────────┘ │
└──────────────────────┬──────────────────────┘
                       │
          ┌────────────▼────────────┐
          │  Chainweb EVM Testnet   │
          │  Chains 0-19 (20 RPCs)  │
          │                         │
          │  AgentRegistry (Chain 0)│
          │  Governance   (Chain 0) │
          │  PaymentEscrow(Chain 0) │
          │  StrategyVault(Chain N) │
          └─────────────────────────┘
```

### 8.2 Production Deployment (Month 6)

Production adds high availability, monitoring, and redundancy:

- Agent Node runs in Docker containers with automatic restart policies
- Redis deployed as Redis Cluster for hot state availability
- PostgreSQL with TimescaleDB replication for episodic data durability
- Multiple RPC endpoints per Chainweb chain (primary + fallback)
- Monitoring dashboard (React 18 + TanStack Query + Recharts) with real-time agent status, portfolio performance, and risk metrics
- Structured JSON logs (pino) shipped to centralized log aggregation
- Health check endpoints for each agent and infrastructure component

---

## 9. Migration Path from Testnet to Mainnet

| Step | Action | Validation |
|------|--------|-----------|
| 1 | Complete security audit with all critical/high findings remediated | Published audit report |
| 2 | Deploy AgentRegistry to Chainweb mainnet (canonical chain) | Contract verified on block explorer |
| 3 | Deploy Governance contract with initial parameters | Governance proposal and voting flow tested |
| 4 | Deploy PaymentEscrow on canonical chain | Settlement flow validated with test agents |
| 5 | Deploy StrategyVaults on 2-3 initial chains | Vault deposit/withdraw/execute flow validated |
| 6 | Register first agent on mainnet AgentRegistry | ERC-721 minted, capabilities queryable |
| 7 | Execute initial strategy with conservative limits | Per-tx limit: $100, daily limit: $500 |
| 8 | Monitor for 7 days with no circuit breaker trips | All breakers remain CLOSED |
| 9 | Gradually increase limits based on performance data | Progressive limit expansion with risk committee approval |
| 10 | Deploy remaining StrategyVaults across additional chains | Expand to 5, then 10, then 20 chains over weeks |

---

*Meridian Protocol | Technical Architecture Document*
*Version 1.0 | February 2026*
*For review by Kadena technical team*
