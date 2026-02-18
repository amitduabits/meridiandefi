# Meridian Grant Proposal — Master Template

**Project:** Meridian — The Autonomous Intelligence Layer for DeFi
**Applicant:** Meridian Team
**Website:** meridianagents.xyz
**GitHub:** https://github.com/amitduabits/meridiandefi
**License:** Apache 2.0 / MIT (dual-licensed, fully open-source)
**Date:** February 2026

---

## 1. Executive Summary

Meridian has executed over 100 autonomous trades on Arbitrum Sepolia with zero human intervention — maintaining portfolio allocations within 2% of target weights across 30 days of continuous operation. Built across 19,000 lines of production TypeScript and Solidity with 208 passing tests, Meridian is a DeFi-native AI agent framework: not a single product, but the infrastructure layer that enables any developer to build, deploy, and orchestrate autonomous financial agents across chains and protocols. This proposal requests funding to advance Meridian from proven testnet infrastructure to production-grade SDK, multi-agent orchestration, and developer ecosystem — positioning [CHAIN] as the definitive home for autonomous DeFi agents.

---

## 2. Problem Statement

### $200B+ in TVL, Under-Optimized

Decentralized finance has crossed $200 billion in total value locked, yet the vast majority of this capital sits in static positions. Liquidity providers suffer impermanent loss because they cannot rebalance in real-time. Lending positions get liquidated because borrowers sleep. Yield opportunities across chains go uncaptured because no human can monitor dozens of protocols simultaneously. The capital is there; the intelligence to manage it is not.

### No Standardized Agent-DeFi Interface

There is no standardized way for AI agents to interact with DeFi protocols. Every developer building an autonomous trading system must hand-roll protocol integrations, manage wallet security, handle transaction simulation, and build risk management from scratch. The result: months of integration work per chain, duplicated across every team, with inconsistent safety guarantees. This is the "integration tax" that kills innovation before it starts.

### Existing Frameworks Are Not Finance-First

The current crop of AI agent frameworks — ElizaOS, GOAT, and others — approach blockchain as one integration among many. ElizaOS is a social agent personality framework with 90+ plugin categories; blockchain is one of them. GOAT provides a stateless action library with no portfolio context, no risk management, and no strategy persistence between calls. Neither was designed for the specific demands of financial operations: continuous state tracking, pre-execution simulation, circuit breakers, position limits, or cross-chain coordination.

ElizaOS builds social agents that can touch the blockchain. GOAT gives agents hands. Meridian gives agents a financial brain.

### The Human Bottleneck

Human traders sleep 8 hours a day, react emotionally to volatility, and cannot monitor more than a handful of positions across chains simultaneously. DeFi operates 24/7/365 across dozens of chains. The mismatch is structural: human attention is the bottleneck constraining how much value DeFi can capture. Autonomous agents — properly constrained by risk management and backed by LLM reasoning — are the solution, but only if the infrastructure exists to build them safely.

### Developer Integration Tax

Today, building a single autonomous DeFi agent requires expertise in blockchain RPC management, wallet security, protocol-specific contract interactions, transaction simulation, gas optimization, MEV protection, and LLM integration — before writing a single line of strategy logic. A senior DeFi developer spends 3-6 months building this infrastructure for one chain. Multiply across chains, and the cost becomes prohibitive for all but the most well-funded teams.

---

## 3. Solution & Technical Approach

### Overview

Meridian is a modular, open-source framework that provides every component a developer needs to build autonomous DeFi agents — from protocol-aware chain connectors to LLM-powered reasoning to pre-execution risk management. The architecture follows a continuous **Sense --> Think --> Act --> Reflect** decision cycle on a tick-based event loop, where each agent maintains persistent financial state across all its positions, chains, and strategies.

### Architecture

```
+-----------------------------------------------------------------------------------+
|                           MERIDIAN AGENT FRAMEWORK                                |
|                                                                                   |
|  +-----------------------------------------------------------------------------+ |
|  |                        DEVELOPER SDK (@meridian/sdk)                         | |
|  |   Strategy DSL  .  Agent Builder API  .  CLI Tools  .  Plugin System         | |
|  +------+-------------------------+---------------------------+-----------------+ |
|         |                         |                           |                   |
|  +------v--------+  +------------v--------------+  +---------v-----------+       |
|  | 1. AGENT       |  | 2. LLM INTEGRATION        |  | 3. CHAIN            |       |
|  | RUNTIME        |  |    LAYER                   |  | CONNECTORS          |       |
|  |                |  |                            |  |                     |       |
|  | xstate v5 FSM  |  | Claude / GPT-4 / Llama    |  | EVM: viem           |       |
|  | BullMQ ticks   |  | Structured output (Zod)    |  | Solana: web3.js     |       |
|  | Crash recovery |  | Handlebars prompts         |  | Protocol-semantic   |       |
|  +------+---------+  +------------+--------------+  +---------+-----------+       |
|         |                         |                           |                   |
|  +------v--------+  +------------v--------------+  +---------v-----------+       |
|  | 4. STRATEGY    |  | 5. MEMORY SYSTEM           |  | 6. AGENT-TO-AGENT  |       |
|  | ENGINE         |  |                            |  | COMMUNICATION      |       |
|  |                |  | Working: Redis (sub-ms)     |  |                    |       |
|  | NL / DSL / TS  |  | Episodic: Postgres+Timescale|  | libp2p P2P         |       |
|  | Backtest engine|  | Semantic: Qdrant vectors    |  | Protobuf messages  |       |
|  +------+---------+  +------------+--------------+  +---------+-----------+       |
|         |                         |                           |                   |
|  +------v-------------------------v---------------------------v-----------+       |
|  |                       7. RISK MANAGEMENT LAYER                         |       |
|  | Pre-flight simulation . Circuit breakers . Position limits . MEV guard |       |
|  +-----------------------------------+------------------------------------+       |
|                                      |                                            |
|  +-----------------------------------v------------------------------------+       |
|  |                    8. ON-CHAIN SMART CONTRACTS                          |       |
|  | AgentRegistry.sol (ERC-721) . PaymentEscrow.sol . StrategyVault.sol    |       |
|  | (ERC-4626) . MeridianGovernance.sol (OpenZeppelin Governor)            |       |
|  +---------------------------------------------------------------------+  |       |
+-----------------------------------------------------------------------------------+
```

### The Eight Core Modules

**Module 1: Agent Runtime Engine.** Each agent runs as an xstate v5 finite state machine following the lifecycle: IDLE --> SENSING --> THINKING --> ACTING --> REFLECTING --> IDLE, with error recovery paths (ERROR --> COOLDOWN --> IDLE) and manual PAUSED states. BullMQ schedules ticks via Redis, and crash recovery ensures agents resume from their last known state after restarts. Structured pino logging captures every state transition with full context.

**Module 2: LLM Integration Layer.** Agents reason about financial decisions using Claude (primary), GPT-4o (fallback), or Llama 3.1 via Ollama (local/private). All LLM outputs are parsed through Zod schemas for type-safe structured responses — no unvalidated string parsing. Handlebars prompt templates separate reasoning logic from presentation, and automatic failover ensures agents never stall on a single provider outage.

**Module 3: Chain Connectors.** Protocol-aware typed connectors built on viem (EVM) and @solana/web3.js (Solana). These are not raw RPC wrappers — they understand protocol semantics: liquidity math for Uniswap V3, collateral factors for Aave V3, funding rates for perpetuals. Every connector implements the `IDeFiConnector` interface with standardized methods: `swap()`, `addLiquidity()`, `getPrice()`, `getBalance()`, `simulate()`, and more.

**Module 4: Strategy Engine.** Developers define strategies in three ways: natural language (LLM-translated to executable logic), the Meridian Strategy DSL (a declarative domain-specific language parsed via PEG grammar), or raw TypeScript for maximum control. The DSL enables non-developers to express sophisticated strategies:

```
strategy "ETH Mean Reversion" v1.0
param lookback_period = 20
param z_score_entry = -2.0

when price_zscore(ETH, $lookback_period) < $z_score_entry
  and portfolio.exposure(ETH) < 0.1
do
  swap(USDC -> ETH, amount: portfolio.value * 0.1)
  notify(telegram, "Entered ETH mean reversion long")

constraints
  max_position: 25%
  stop_loss: -5%
  chains: [arbitrum, ethereum]
```

Strategies execute in an isolated-vm sandbox for safety, and a backtesting engine replays them against historical data with Sharpe ratio, Sortino ratio, max drawdown, and equity curve outputs.

**Module 5: Memory & State.** A three-tier memory system ensures agents maintain context across time horizons. Tier 1 (Redis): sub-millisecond access to current market snapshots, active positions, and in-flight transactions. Tier 2 (PostgreSQL + TimescaleDB): transaction history, decision logs, and P&L tracking with time-series optimization. Tier 3 (Qdrant): vector-embedded decision history and protocol documentation powering a RAG pipeline that gives agents long-term semantic memory.

**Module 6: Agent-to-Agent Communication.** Agents discover and communicate with each other via libp2p (GossipSub + Kademlia DHT) using protobuf-serialized messages. A portfolio manager agent can delegate yield optimization to a specialist, negotiate terms, and settle payment through on-chain escrow — enabling a composable agent economy.

**Module 7: Risk Management.** Every transaction passes through a pre-flight validation pipeline before execution: position size check, portfolio exposure analysis, gas cost estimation, slippage simulation, contract approval verification, daily loss limit enforcement, and full transaction simulation. Circuit breakers halt trading when drawdown thresholds are breached. MEV protection routes transactions through Flashbots to prevent sandwich attacks.

**Module 8: On-Chain Smart Contracts.** Four Solidity contracts (Foundry-tested) provide on-chain infrastructure: AgentRegistry (ERC-721 NFTs representing registered agents), PaymentEscrow (trustless payment for agent-to-agent services), StrategyVault (ERC-4626 compliant vaults for agent-managed capital), and MeridianGovernance (OpenZeppelin Governor for protocol governance).

### Key Differentiators

| Capability | Meridian | General Agent Frameworks |
|-----------|----------|-------------------------|
| DeFi as core domain | Entire architecture built for finance | One plugin among many |
| Portfolio-aware reasoning | Persistent financial context per agent | Stateless tool calls |
| Cross-chain execution | Unified routing across 6+ chains | Single-chain or none |
| Risk management | Pre-execution simulation, circuit breakers, drawdown guards | No financial safety rails |
| Agent-to-agent economy | P2P coordination + on-chain payment settlement | Isolated agents |
| Strategy abstraction | Natural language, DSL, or TypeScript | Raw code only |

---

## 4. Proof of Work

Meridian is not a whitepaper or a roadmap — it is working software. The following metrics are verifiable on-chain and via public GitHub:

| Metric | Value | Evidence |
|--------|-------|----------|
| Autonomous trades executed | 100+ on Arbitrum Sepolia | On-chain transaction history, zero human intervention |
| Continuous operation | 30-day burn-in on testnet | Uptime logs, agent state history |
| Agent uptime | 99.9% across test period | Monitoring dashboard, crash recovery logs |
| Portfolio accuracy | ±2% drift from target allocation | Trade logs, rebalancing history |
| Decision latency | <3 seconds per full cycle | Sense --> Think --> Act --> Reflect timing telemetry |
| Codebase | 19,000 lines of code, 127 TypeScript files, 12 Solidity files | Public GitHub repository |
| Test coverage | 208 tests passing across 12 test files | CI pipeline, vitest + Foundry results |
| Smart contracts | 4 contracts deployed to Arbitrum Sepolia | Verified on Arbiscan |
| Modules completed | 8 of 8 core modules built | Code review, architecture documentation |
| Example agents | 2 fully working examples (DeFi rebalancer, multi-agent portfolio) | Public repositories with deployment instructions |
| LLM reasoning | Every trade includes human-readable justification | Decision log database, sample reasoning outputs |

**GitHub:** https://github.com/amitduabits/meridiandefi
**Live Agent:** Rebalancing agent on Arbitrum Sepolia, observable via dashboard and on-chain transactions.

---

## 5. Milestone Breakdown

This proposal follows a three-month delivery schedule with milestone-gated disbursement. Each milestone produces independently valuable deliverables — the grant program receives working software at every stage.

### Month 1 — Foundation (30% Disbursement)

**Focus:** Core framework, chain connectors, SDK foundation, reference agent on [CHAIN].

| Deliverable | Description | Success Metric |
|-------------|-------------|----------------|
| Core runtime on [CHAIN] | Agent runtime engine configured and deployed for [CHAIN] testnet | Agent executing autonomous trades on [CHAIN] testnet |
| 3 chain connectors | Typed, protocol-aware connectors for [CHAIN]'s top 3 protocols (e.g., [DEX], [LENDING], [YIELD]) | All connectors passing integration tests, published as open-source |
| SDK v0.1 | Developer SDK with agent creation, strategy definition, and deployment APIs | npm package published, install-to-running-agent in <15 minutes |
| Reference agent live | Rebalancing agent autonomously managing a portfolio on [CHAIN] testnet | 100+ autonomous testnet transactions logged |

**Evidence format:** Public GitHub repository with tagged release, verified testnet contract addresses, recorded demo walkthrough, CI pipeline green.

### Month 2 — Intelligence (40% Disbursement)

**Focus:** Multi-agent orchestration, Strategy DSL, example agents, backtesting.

| Deliverable | Description | Success Metric |
|-------------|-------------|----------------|
| Multi-agent orchestration engine | Agent-to-agent communication, task delegation, and coordinated execution | 4-agent orchestrated demo (portfolio manager, yield scout, risk monitor, executor) |
| Strategy DSL v1.0 | Declarative strategy language with PEG parser, 10+ example strategies | Published DSL specification, VS Code extension, 10 runnable examples |
| 3 example agents | Production-ready agent templates for [CHAIN]'s flagship protocols | Each template deployable in <30 minutes, documented |
| Backtesting engine | Historical data replay with Sharpe, Sortino, max drawdown, equity curves | Backtest reports for all 3 example strategies with [CHAIN] historical data |

**Evidence format:** 4-agent orchestrated demo video, published DSL spec, backtest sample reports, 100+ additional autonomous testnet transactions.

### Month 3 — Developer Experience (30% Disbursement)

**Focus:** SDK v1.0, documentation, agent templates, community launch, impact reporting.

| Deliverable | Description | Success Metric |
|-------------|-------------|----------------|
| SDK v1.0 | Production-quality SDK with comprehensive API reference, 5+ tutorials, 10+ runnable examples | npm and PyPI packages published, install-to-agent <10 minutes |
| Full documentation | Architecture deep-dives, tutorial series, API reference, deployment guides | Documentation site live, all 8 modules documented |
| Agent templates for [CHAIN] | 3 production-ready templates for [CHAIN]'s top protocols | Deploy-ready with configurable parameters, documented |
| Community launch | Developer onboarding pipeline: Discord, tutorials, quickstart guides | 50+ developer signups, 10+ agents deployed by external developers |
| Impact report | On-chain metrics, developer adoption, protocol activity generated | Published report with verifiable data |

**Evidence format:** npm/PyPI packages live, documentation site published, tutorial series complete, community metrics dashboard, first ecosystem impact report.

---

## 6. Offer Stack — What You Get

This grant does not fund a single deliverable. It funds an integrated stack of infrastructure, tooling, documentation, and ecosystem development — each component independently valuable, collectively transformative.

### Core Deliverable: Production-Grade DeFi Agent SDK for [CHAIN]

Full SDK with typed chain connectors, multi-agent orchestration, Strategy DSL, backtesting, and risk management — all featuring [CHAIN] as the primary chain in examples and documentation. Every developer tutorial, every quickstart, every example agent runs on [CHAIN] first.

**Perceived value:** $150K-$200K (comparable infrastructure build cost for a venture-funded team)

### Bonus 1: Backtesting Engine with [CHAIN] Historical Data

Developers test strategies against real historical on-chain data before deploying capital. Outputs include Sharpe ratio, Sortino ratio, max drawdown, win rate, and equity curves. Open-sourced with sample reports.

**Perceived value:** $40K-$60K (standalone product at competing firms)

### Bonus 2: Monthly Ecosystem Impact Reports

For the duration of the grant period and three months beyond: monthly reports detailing agents deployed on [CHAIN], transaction volume generated, protocols touched, developer signups, SDK downloads, and community growth — all with on-chain verification. The grant becomes the most transparent and accountable investment in [CHAIN]'s portfolio.

**Perceived value:** $15K-$25K (analytics and reporting service)

### Bonus 3: Pre-Built Agent Templates for [CHAIN]'s Top 3 Protocols

Three production-ready agent templates specifically configured for [CHAIN]'s flagship protocols. Each template is deploy-ready with configurable parameters — developers go from zero to running a sophisticated DeFi agent in under an hour.

**Perceived value:** $25K-$40K (custom development cost per template)

### The Stack

| Component | Perceived Value |
|-----------|----------------|
| Production SDK + multi-agent + DSL | $150K-$200K |
| Backtesting engine with [CHAIN] data | $40K-$60K |
| Monthly impact reports (6 months) | $15K-$25K |
| 3 agent templates for [CHAIN] protocols | $25K-$40K |
| Developer tutorials + video walkthroughs | $10K-$15K |
| Open-source chain connectors (npm published) | $30K-$50K |
| **Total Perceived Value** | **$270K-$390K** |
| **Actual Ask** | **$[AMOUNT]** |
| **Value-to-Ask Ratio** | **3-5x** |

### Guarantee: Milestone-Based Disbursement

Funds are disbursed in three tranches tied to publicly verifiable deliverables (Month 1: 30%, Month 2: 40%, Month 3: 30%). Each milestone is independently valuable. If any milestone is materially unmet, the subsequent disbursement is held until remediation. The grant program pays only for delivered work, verified by on-chain transactions, public GitHub releases, and published documentation.

This is not a bet on a promise. It is a performance contract backed by a team that has already shipped 19,000 lines of working code and 100+ autonomous trades.

---

## 7. Team

**Core Team: 4-6 contributors, scaling to 8-10 by Phase 4**

[TEAM_PLACEHOLDER — Populate with actual team members before submission]

| Role | Responsibilities | Background |
|------|------------------|------------|
| **Lead Engineer** | Architecture, agent runtime, SDK design | [BACKGROUND: DeFi protocol engineering, open-source infrastructure] |
| **Chain Engineer** | Protocol connectors, cross-chain execution | [BACKGROUND: EVM/Solana development, protocol integrations] |
| **ML/AI Engineer** | LLM integration, strategy engine, ML models | [BACKGROUND: ML research, NLP, financial modeling] |
| **Smart Contract Engineer** | Solidity contracts, security, audit preparation | [BACKGROUND: Smart contract development, security auditing] |
| **Developer Experience** | SDK documentation, tutorials, community | [BACKGROUND: DevRel, technical writing, developer onboarding] |

**Advisors:**

| Name | Domain | Contribution |
|------|--------|--------------|
| [ADVISOR_1] | Quantitative Finance | Strategy validation, risk model review |
| [ADVISOR_2] | Protocol Architecture | Chain integration strategy, ecosystem positioning |
| [ADVISOR_3] | Ecosystem Development | Grant strategy, partnership introductions |

**Relevant Experience:**
- Built and deployed autonomous DeFi agent with 100+ trades and zero failures on Arbitrum Sepolia
- 208 passing tests across 12 test files — production-grade testing discipline from day one
- 4 auditable smart contracts (ERC-721, ERC-4626, Governor pattern) deployed and tested
- Prior contributions to open-source DeFi projects and blockchain tooling

---

## 8. Ecosystem Impact & Sustainability

### Developer Adoption Targets

| Timeframe | Metric | Target |
|-----------|--------|--------|
| Month 3 (grant end) | Developers using SDK | 50+ |
| Month 3 | Agents deployed on [CHAIN] by external developers | 10+ |
| Month 6 (post-grant) | Developers using SDK | 200+ |
| Month 6 | Active agents on [CHAIN] | 50+ |
| Month 12 | Developers using SDK | 1,000+ |
| Month 12 | Active agents generating protocol activity | 200+ |

### TVL Impact Model

Every active agent generates persistent protocol activity: swap volume for DEXes, borrow/supply volume for lending protocols, staking activity for yield protocols. Conservative estimates for [CHAIN]:

- 50 active agents (Month 6), each managing $10K average: $500K additional TVL under active management
- 200 active agents (Month 12), each managing $25K average: $5M additional TVL under active management
- Each agent generates 10-50 transactions per day, compounding protocol fee revenue

This is not speculative — our testnet agent already executes 3-5 trades per day autonomously. Scaling to 200 agents on mainnet creates measurable, persistent economic activity on [CHAIN].

### Long-Term Sustainability

Meridian is designed to be self-sustaining beyond grant funding through three revenue mechanisms:

1. **Strategy Marketplace (Phase 3-4).** Developers publish, rate, and monetize agent strategies with optional revenue sharing (0-20% of profits). Meridian takes a platform fee on marketplace transactions, creating recurring revenue tied to ecosystem growth.

2. **Agent Registry Staking.** Agents stake tokens to register on-chain, earning reputation scores. The registry creates network effects — more agents attract more strategies, which attract more developers, which attract more agents.

3. **Enterprise SDK Licensing.** The core SDK remains open-source (Apache 2.0 / MIT). Enterprise features — dedicated support, custom agent types, SLA-backed infrastructure — provide a commercial revenue stream without restricting open-source access.

### Why This Grant Has Compounding Returns

Most grants produce a deliverable and end. This grant produces infrastructure that generates compounding value:

- Every chain connector we build enables every future agent on [CHAIN] — it is used once but leveraged infinitely.
- Every strategy template reduces the barrier for the next developer from weeks to hours.
- Every agent deployed generates persistent transaction volume and protocol fees for [CHAIN].
- The SDK and documentation create a self-service developer pipeline that scales without additional investment.

The grant committee is not funding a project. It is funding the infrastructure layer that makes an entire category of applications possible on [CHAIN].

---

## Appendix A: Budget Breakdown

| Category | Allocation | Details |
|----------|------------|---------|
| Engineering (core runtime, connectors, SDK) | 55% | 3 FTE-equivalent months across runtime, chain, and strategy modules |
| Smart contracts + testing | 10% | Contract deployment, Foundry testing, gas optimization |
| Developer experience (docs, tutorials, templates) | 15% | Documentation site, tutorial series, video walkthroughs, agent templates |
| Infrastructure (testnet RPC, LLM APIs, hosting) | 10% | Node providers, Anthropic/OpenAI API costs, CI/CD, monitoring |
| Community + ecosystem (Discord, events, impact reports) | 10% | Community management, impact reporting, developer onboarding |

### Appendix B: Technical References

- **GitHub Repository:** https://github.com/amitduabits/meridiandefi
- **Architecture Documentation:** https://docs.meridianagents.xyz/architecture
- **Strategy DSL Specification:** https://docs.meridianagents.xyz/strategy-dsl
- **Smart Contract Addresses (Arbitrum Sepolia):** [ADDRESSES — populate before submission]
- **Live Dashboard:** https://demo.meridianagents.xyz

### Appendix C: Competitive Landscape

| | ElizaOS | GOAT | Meridian |
|---|---|---|---|
| Core identity | Social agent personality framework | Stateless action library (200+ plugins) | DeFi-native agent framework |
| Financial state | None — stateless tool calls | None — no portfolio context | Continuous position, exposure, P&L tracking |
| Risk management | None | None | Pre-execution simulation, circuit breakers, position limits, MEV protection |
| Strategy abstraction | N/A | N/A | Natural language, DSL, and TypeScript |
| Multi-agent coordination | Limited | None | P2P with on-chain payment settlement |

---

*Document version: 1.0 — Master template. Customize [CHAIN], [DEX], [LENDING], [YIELD], [AMOUNT], and [TEAM] placeholders before each submission.*
