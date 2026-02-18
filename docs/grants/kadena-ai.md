# Meridian: Autonomous DeFi Intelligence Infrastructure for Kadena

**Grant Application to the Kadena AI Fund**
**Submitted by Meridian Protocol | February 2026**
**Requested Amount: $150,000 - $250,000 (Tier 2/3)**

---

## Executive Summary

Kadena's Chainweb architecture — 20 parallel braided chains with EVM compatibility — represents the most technically ambitious Layer 1 in production today. It also presents a coordination problem that no human trader, portfolio manager, or DevOps team can solve manually: monitoring liquidity, arbitrage opportunities, risk exposures, and protocol health across 20 simultaneous chains in real time.

Meridian solves this. We are the first AI agent framework purpose-built for decentralized finance, and we are proposing a 6-month strategic partnership to make Kadena the definitive home for autonomous DeFi agents. Our framework deploys intelligent agents that sense on-chain state, reason about portfolio positions using large language models and specialized ML models, execute cross-chain strategies through typed protocol connectors, and continuously learn from outcomes — all within a production-grade risk management envelope that enforces position limits, circuit breakers, slippage controls, and daily loss caps on every single transaction.

Arbitrum has ElizaOS. Base has Virtuals. Solana has GOAT. Kadena has nothing in the autonomous agent category. Meridian closes this gap — not with a proof-of-concept, but with a production-grade SDK, auditable smart contracts, and a self-sustaining agent economy that generates persistent protocol activity long after the grant period ends.

---

## The Kadena Opportunity: Why AI Agents and Why Now

Kadena's $25M AI Fund signals a clear strategic priority: position Kadena at the intersection of artificial intelligence and blockchain infrastructure. Meridian is purpose-built to deliver on every pillar of that priority.

### AI Contract Analysis

Kadena's AI Fund specifically targets intelligent contract analysis — the ability for automated systems to evaluate smart contract behavior, detect vulnerabilities, and validate execution paths before capital is deployed.

Meridian's Risk Management module performs exactly this function. Every transaction processed by a Meridian agent passes through a deterministic pre-flight validation pipeline that enforces seven independent checks: position size limits, portfolio exposure thresholds, gas cost ratios, slippage tolerance bounds, daily loss limits, trade frequency caps, and open position limits. Each check produces a scored risk contribution (0-100 scale) with modification suggestions when thresholds are approached. The system does not rely on heuristics — it enforces configurable, auditable risk parameters validated through Zod schemas at construction time.

Beyond pre-flight validation, our circuit breaker system monitors six distinct failure categories: portfolio drawdown, flash crash detection, gas price spikes, RPC endpoint failures, oracle staleness, and contract anomaly detection. Each breaker operates on a state machine (CLOSED, OPEN, HALF_OPEN) with configurable cooldown periods and probe-based recovery. When a contract anomaly breaker trips, all agent operations halt for a minimum of 60 minutes with five successful probe validations required before resumption. This is enterprise-grade contract analysis infrastructure operating in real time, on every transaction, across every chain the agent touches.

### On-Chain Prediction

Kadena's AI Fund prioritizes on-chain prediction capabilities — systems that can forecast market conditions, identify patterns, and make data-driven decisions based on blockchain state.

Meridian's Strategy Engine and ML integration layer deliver this directly. Our backtesting engine simulates agent strategies against historical OHLCV data, computing Sharpe ratio, Sortino ratio, maximum drawdown, win rate, and full equity curves. Agents leverage pre-computed technical indicators (SMA, EMA, RSI, Bollinger Bands) alongside LLM-powered reasoning to generate trade signals. The strategy evaluation pipeline supports six trigger types: price thresholds, percentage change detection, indicator-based signals, time-interval scheduling, gas price conditions, and portfolio drift detection.

Our Phase 4 ML integration adds dedicated LSTM-based trend classification, volatility regime detection, liquidity depth analysis, and gas price prediction models — all trained on chain-specific on-chain data. For Kadena, this means prediction models calibrated to Chainweb's unique multi-chain dynamics, including cross-chain arbitrage detection across the 20 parallel braided chains.

### AI Identity Verification

Kadena's AI Fund calls for AI-driven identity verification — systems that establish trust, reputation, and accountability for autonomous actors operating on-chain.

Meridian's AgentRegistry smart contract is an ERC-721-based identity system purpose-built for autonomous agents. Each registered agent receives a unique on-chain identity (NFT), declares typed capabilities (e.g., "yield-optimization", "risk-monitoring", "arbitrage-execution"), and accumulates a reputation score managed by an authorized oracle. The capability index enables permissionless agent discovery — any protocol or user can query `findAgents("liquidity-management")` to discover all agents advertising that capability, ranked by reputation.

This is not a speculative design. The AgentRegistry contract is deployed, tested, and follows the CEI (Checks-Effects-Interactions) pattern with custom errors for gas efficiency. Agent deregistration burns the NFT and removes capability index entries. Oracle-managed reputation creates an auditable trust layer where agent performance is quantified and publicly verifiable.

---

## Technical Architecture: Built for Kadena

### Framework Overview

Meridian is a TypeScript/Python monorepo managed by pnpm and Turborepo. The core SDK (`@meridian/sdk`) provides:

- **Agent Runtime Engine** — xstate v5 finite state machine governing the agent lifecycle (IDLE, SENSING, THINKING, ACTING, REFLECTING, ERROR, COOLDOWN, PAUSED), BullMQ tick scheduler for deterministic event loops, pino structured JSON logging for auditability.

- **LLM Integration Layer** — Multi-provider gateway (Claude as primary reasoning engine, GPT-4o as fallback, Ollama for local inference) with Zod-validated structured outputs and Handlebars prompt templates. Provider selection is use-case-specific: Claude for trade reasoning and risk assessment, GPT-4o-mini for data extraction, local Llama 3.1 for real-time signal processing.

- **Chain Connector Module** — A typed `IDeFiConnector` interface requiring 12 protocol-semantic methods: `swap()`, `addLiquidity()`, `removeLiquidity()`, `borrow()`, `repay()`, `stake()`, `bridge()`, `getPrice()`, `getBalance()`, `getPositions()`, `simulate()`, and `submit()`. Current implementations use viem for EVM chains. The Chainweb EVM connector will implement this identical interface, ensuring every existing Meridian agent and strategy works on Kadena without modification.

- **Strategy Engine** — Custom DSL parsed via PEG grammar (peggy), natural language to strategy conversion via LLM, sandboxed execution in isolated-vm, and DuckDB-powered backtesting with full statistical metrics.

- **Memory System** — Three-tier architecture: Redis for hot state (market snapshots, active positions, in-flight transactions), PostgreSQL with TimescaleDB for warm episodic storage (transaction history, decision logs, P&L), and Qdrant for persistent semantic memory (embedded decisions, protocol documentation, RAG pipeline).

- **Agent-to-Agent Communication** — libp2p GossipSub with Kademlia DHT for peer discovery, protobuf message serialization, and on-chain payment settlement between agents via the PaymentEscrow contract.

### Smart Contract Suite

Four production-ready Solidity 0.8.24+ contracts built on OpenZeppelin v5:

1. **AgentRegistry** (ERC-721) — On-chain agent identity, capability indexing, oracle-managed reputation scoring.
2. **StrategyVault** (ERC-4626) — Tokenized vault delegating execution to authorized agents with per-transaction limits, daily spending caps, protocol allowlists, 48-hour timelock on agent changes, and emergency withdrawal.
3. **PaymentEscrow** — Trustless agent-to-agent payment settlement for inter-agent services.
4. **MeridianGovernance** — On-chain governance for protocol parameter changes and agent registry management.

All contracts follow CEI pattern, use custom errors over require strings, and emit events for every state change.

### Chainweb EVM Compatibility

Kadena's EVM compatibility layer means Meridian's existing Solidity contracts deploy directly to Chainweb without modification. Our viem-based EVM provider requires only RPC endpoint configuration to target Chainweb chains. The `IDeFiConnector` interface abstracts chain-specific details behind typed method signatures, meaning a Chainweb connector is a configuration change — not an architectural change.

The 20 parallel braided chains present a unique advantage for Meridian's multi-agent architecture. Where single-chain environments force agents to compete for the same opportunities, Chainweb's parallel execution enables agent specialization by chain — a portfolio manager agent coordinating 20 specialized chain-watcher agents, each monitoring a dedicated Chainweb chain for arbitrage, liquidity events, and protocol state changes simultaneously.

---

## What We Deliver: The Full Stack

### Core Infrastructure (Months 1-2)

- Chainweb EVM chain connector implementing the full `IDeFiConnector` interface
- All four smart contracts deployed to Chainweb EVM testnet (AgentRegistry, StrategyVault, PaymentEscrow, MeridianGovernance)
- Reference rebalancing agent executing autonomous trades on Chainweb testnet
- SDK v1.0 with Kadena featured as the primary chain in all examples and tutorials

### Intelligence Layer (Months 2-4)

- Multi-agent orchestration engine demonstrating coordinated strategies across Chainweb's parallel chains
- Strategy DSL v1.0 with 10+ example strategies (yield rotation, delta-neutral hedging, cross-chain arbitrage detection, portfolio rebalancing)
- Backtesting engine with Kadena-specific historical data integration
- ML model integration: LSTM trend classification, volatility regime detection, gas price prediction — all calibrated to Chainweb dynamics

### Custom Agent Types for Kadena (Months 3-5)

- **Cross-Chain Arbitrage Agent** — Monitors price differentials across Chainweb's 20 parallel chains, executing atomic arbitrage when spreads exceed configurable thresholds
- **Multi-Chain Liquidity Manager** — Optimizes liquidity provisioning across Kadena DEX protocols, rebalancing positions based on volume, fees, and impermanent loss projections
- **Risk Sentinel Agent** — Continuous monitoring of lending protocol health factors, liquidation distances, and systemic risk indicators across all 20 chains simultaneously
- **Yield Aggregation Agent** — Identifies and rotates into optimal yield opportunities across Kadena's DeFi protocols, accounting for gas costs and bridge fees across chains

### Enterprise Infrastructure (Months 4-6)

- Security audit of all Meridian smart contracts deployed on Kadena by a recognized audit firm
- On-chain Agent Registry and Strategy Marketplace (beta) deployed to Kadena mainnet
- Developer grants sub-program ($15K-$25K allocated from grant) for Kadena ecosystem builders creating Meridian-based agents
- Comprehensive documentation, tutorials, and video walkthroughs with Kadena as the primary chain

---

## Enterprise Value Proposition

Kadena was founded by JP Morgan alumni with an enterprise-first philosophy. Meridian's architecture reflects the same values.

**Auditability.** Every agent decision is logged through pino structured JSON logging. Every transaction passes through pre-flight validation with a scored risk assessment. Every state transition is captured in the xstate finite state machine. Decision logs are persisted to PostgreSQL with TimescaleDB for time-series querying.

**Compliance-Ready Architecture.** The StrategyVault enforces per-transaction value limits, daily spending caps, and protocol allowlists. Agent changes require a 48-hour timelock. Emergency withdrawal is available to the vault owner at any time. These are not optional features — they are enforced at the smart contract level.

**Circuit Breakers.** Six independent circuit breakers monitor portfolio drawdown, flash crashes, gas spikes, RPC failures, oracle staleness, and contract anomalies. Each operates on a configurable state machine with automatic cooldown and probe-based recovery. No agent can bypass a tripped breaker.

**Institutional-Grade Risk Management.** Every transaction undergoes seven pre-flight checks with quantified risk scores. The system produces modification suggestions (e.g., "reduce position size to $X") rather than binary pass/fail, enabling agents to adapt within risk parameters rather than halting entirely.

---

## Competitive Landscape

| Chain | AI Agent Infrastructure | Status |
|-------|------------------------|--------|
| Arbitrum | ElizaOS | Active ecosystem |
| Base | Virtuals | Growing adoption |
| Solana | GOAT Framework | Early traction |
| NEAR | AI Agent Fund recipients | Emerging |
| **Kadena** | **None** | **Gap** |

Meridian on Kadena is not catching up — it is leapfrogging. ElizaOS, Virtuals, and GOAT are general-purpose agent frameworks that bolt DeFi on as a plugin. Meridian is DeFi-native from the ground up: portfolio-aware reasoning, protocol-semantic connectors, pre-execution simulation, and multi-agent coordination are core architecture, not afterthoughts.

---

## Funding Request and Budget

**Total Request: $150,000 - $250,000**

| Category | Allocation | Description |
|----------|-----------|-------------|
| Core Engineering | 35% | Chainweb connector, contract deployment, SDK integration |
| AI/ML Development | 20% | LSTM models, anomaly detection, Kadena-specific training data |
| Custom Agent Types | 15% | 4 Kadena-specific agent archetypes |
| Security Audit | 15% | Third-party audit of all deployed contracts |
| Developer Ecosystem | 10% | Sub-program grants, documentation, tutorials |
| Program Management | 5% | Milestone reporting, community engagement, impact metrics |

---

## Milestone-Based Disbursement

| Month | Disbursement | Deliverables | Evidence |
|-------|-------------|-------------|----------|
| 1 | 15% | Chainweb EVM connector, contracts on testnet, reference agent live | GitHub repo, verified testnet contracts, demo video |
| 2 | 20% | Multi-agent engine, strategy DSL, 3 example agents, backtesting | 4-agent demo, published DSL spec, backtest reports |
| 3 | 20% | SDK v1.0, full documentation, agent templates, community launch | npm package live, docs site, first impact report |
| 4 | 15% | Custom agent types deployed, ML model v1 integrated, registry on testnet | Agent performance benchmarks, model cards |
| 5 | 15% | Security audit initiated, marketplace beta, sub-program grants awarded | Audit engagement letter, marketplace demo |
| 6 | 15% | Audit complete, mainnet deployment, final impact assessment | Published audit report, mainnet contracts, TVL metrics |

Each milestone produces independently valuable deliverables. Disbursements are contingent on verified completion. Quarterly independent review by Kadena's technical team is welcomed.

---

## Current Traction

| Metric | Value |
|--------|-------|
| Autonomous Trades Executed | 100+ on Arbitrum Sepolia (Uniswap V3) |
| Portfolio Accuracy | < 2% drift from target allocation over 30-day simulation |
| Agent Uptime | 99.9% across 2-week burn-in |
| Decision Latency | < 3 seconds per Sense-Think-Act-Reflect cycle |
| Test Coverage | 208/208 tests passing across 12 test files |
| Smart Contracts | 4 production-ready (AgentRegistry, StrategyVault, PaymentEscrow, Governance) |
| License | MIT — fully open source |

---

## Team

**4-6 core contributors, scaling to 8-10 by Month 4**

- **Core Engineering** — Senior engineers with DeFi protocol, infrastructure, and ML/AI experience. Prior contributions to open-source DeFi projects and blockchain tooling.
- **Smart Contracts** — Solidity engineers with audit preparation experience across the AgentRegistry, StrategyVault, PaymentEscrow, and Governance contracts.
- **DevRel and Documentation** — Technical writers focused on SDK tutorials, developer onboarding, and community building.
- **Advisors** — Domain experts in quantitative finance, protocol architecture, and blockchain ecosystem development.

---

## Why Kadena Should Fund Meridian

1. **Direct alignment with every AI Fund priority.** Contract analysis, on-chain prediction, and identity verification are not adjacent features — they are core modules in our shipping codebase.

2. **Chainweb's 20-chain architecture is Meridian's competitive moat.** No human can monitor 20 parallel chains simultaneously. Autonomous agents can. Meridian turns Kadena's most complex architectural feature into its greatest DeFi advantage.

3. **Enterprise credibility through engineering discipline.** Circuit breakers, pre-flight validation, timelocked agent changes, protocol allowlists, emergency withdrawals — this is infrastructure built for institutional capital, not hackathon demos.

4. **Self-sustaining economics.** The Agent Registry and Strategy Marketplace generate persistent on-chain activity, staking, and fee revenue. The grant funds infrastructure that compounds in value after the funding period ends.

5. **First-mover advantage is real and time-limited.** Every month without AI agent infrastructure on Kadena is a month where developers choose chains that have it. Meridian delivers a working agent on Chainweb testnet in Month 1.

---

*Meridian Protocol | meridianagents.xyz | github.com/meridian-agents | @meridiandefi*
*MIT License | February 2026*
