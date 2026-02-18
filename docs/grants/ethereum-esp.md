# Meridian: Open-Source AI Agent Infrastructure for Ethereum DeFi

**Ethereum Foundation Ecosystem Support Program — Grant Proposal**

**Applicant:** Meridian (meridianagents.xyz)
**Funding Request:** $150,000 -- $200,000
**Duration:** 3 months (milestone-gated disbursement)
**License:** MIT -- fully open-source
**Category:** Developer Tooling / Infrastructure / Public Goods

---

## Executive Summary

Meridian is an open-source AI agent framework purpose-built for decentralized finance. Where general-purpose agent toolkits treat blockchain as one plugin among dozens, Meridian's entire architecture is DeFi-native: every agent maintains a live portfolio context, reasons about positions and risk in real-time, and executes strategies through protocol-semantic connectors that understand Ethereum's DeFi primitives at a structural level.

The framework is not theoretical. It is running today. On Arbitrum Sepolia, a Meridian rebalancing agent has executed over 100 autonomous trades against Uniswap V3 with zero human intervention, maintaining target portfolio allocations within 2% drift over a 30-day continuous operation window. The codebase comprises 19,000 lines of TypeScript and Solidity across 8 core modules, backed by 208 passing tests.

We are applying to the Ethereum Foundation ESP because Meridian is, at its core, Ethereum public goods infrastructure. Every line of code ships under the MIT license. The SDK, smart contracts, protocol connectors, developer documentation, and example agents are freely available to any builder in the Ethereum ecosystem. Our goal is to make autonomous, safe, and composable DeFi agents accessible to every Ethereum developer -- reducing the barrier from "senior DeFi engineer with ML expertise" to "any TypeScript developer with a strategy idea."

---

## The Problem

Ethereum's DeFi ecosystem generates extraordinary financial infrastructure -- Uniswap, Aave, Lido, Curve, Compound -- yet the tools for building autonomous agents on top of this infrastructure remain fragmented, unsafe, and inaccessible.

**Fragmentation.** A developer who wants to build an agent that monitors Aave V3 health factors, rebalances Uniswap V3 positions, and manages Lido staking exposure must integrate three separate protocol SDKs, handle gas estimation across EIP-1559 fee markets, manage nonce ordering, and build their own state machine for crash recovery. There is no unified abstraction.

**Safety.** Existing AI agent frameworks (ElizaOS, GOAT) provide no financial safety rails. A hallucinated LLM output can drain a wallet. There is no pre-execution simulation, no circuit breaker, no position limit enforcement, no slippage bound. For a domain handling real financial assets, this is untenable.

**Accessibility.** Building a DeFi agent today requires deep expertise in smart contract interaction, MEV dynamics, gas optimization, and financial modeling -- simultaneously. This concentrates autonomous DeFi tooling in the hands of a small number of sophisticated teams, while the broader Ethereum developer community is locked out.

Meridian solves all three. It provides a unified, type-safe, protocol-aware framework with built-in risk management, multi-provider LLM reasoning, and an approachable developer experience -- specifically for Ethereum and its L2 ecosystem.

---

## Technical Architecture

Meridian is structured as a pnpm monorepo (Turborepo) with 8 core modules, each independently useful but designed to work as an integrated stack.

### Core Decision Loop

Every Meridian agent follows a continuous **Sense -- Think -- Act -- Reflect** cycle on a tick-based event loop:

1. **Sense** -- Ingest on-chain data via viem (EVM) including prices, positions, protocol state, and gas conditions
2. **Think** -- LLM-powered reasoning (Claude as primary, GPT-4o as fallback) with structured Zod output schemas and Handlebars prompt templates
3. **Act** -- Execute through protocol-semantic connectors that understand liquidity math, collateral factors, and slippage natively
4. **Reflect** -- Log the decision rationale, update episodic memory, and refine future behavior through outcome tracking

### Ethereum-Native Features

Meridian is built around Ethereum's standards and infrastructure:

- **EIP-1559 Gas Optimization** -- Dynamic fee estimation with priority fee calibration, gas cap enforcement, and type-2 transaction construction via viem
- **Flashbots MEV Protection** -- Private transaction submission through Flashbots Protect and MEV Blocker integration, ensuring agents are not front-run or sandwiched
- **ERC-4626 Strategy Vaults** -- StrategyVault.sol implements the ERC-4626 tokenized vault standard, enabling composable vault-based strategy deployment
- **SIWE Authentication** -- Sign-In With Ethereum for the monitoring dashboard, using wallet-based authentication rather than centralized credentials
- **Ethereum Protocol Connectors** -- Typed, protocol-aware integrations for Uniswap V3 (concentrated liquidity management), Aave V3 (lending/borrowing with health factor monitoring), with Lido, Curve, and Compound on the immediate roadmap

### Smart Contracts (Solidity + Foundry)

All contracts are developed using Foundry with Solidity 0.8.24+, OpenZeppelin v5 standards, and NatSpec documentation:

- **AgentRegistry.sol** -- On-chain agent registration with staking and reputation scoring
- **PaymentEscrow.sol** -- Trustless payment settlement for agent-to-agent services
- **StrategyVault.sol** -- ERC-4626 compliant vault for strategy-managed capital
- **MeridianGovernance.sol** -- OpenZeppelin Governor-based governance for protocol parameters

### Risk Management Layer

Every transaction passes through a pre-flight validation pipeline:

- Position size limits and portfolio exposure caps
- Pre-execution simulation (transaction dry-run before signing)
- Circuit breakers with configurable thresholds and cooldown periods
- Slippage bounds and gas cost caps
- Daily loss limit enforcement
- MEV protection via Flashbots private submission

### Memory System (Three-Tier)

- **Tier 1 (Hot):** Redis 7+ -- current market snapshot, active positions, in-flight transactions (TTL: seconds to minutes)
- **Tier 2 (Warm):** PostgreSQL 16 + TimescaleDB -- transaction history, decision logs, P&L tracking (TTL: days to months)
- **Tier 3 (Knowledge):** Qdrant vector database -- embedded decisions, protocol documentation, RAG pipeline for LLM context (TTL: persistent)

---

## Competitive Positioning

| Capability | Meridian | ElizaOS | GOAT |
|---|---|---|---|
| **Core identity** | DeFi-native agent framework -- financial reasoning is the core | Social agent personality framework with blockchain plugins | Action library (200+ plugins) that plugs into other frameworks |
| **Architecture** | Continuous financial state model tracking positions, exposure, PnL, and risk every tick | Built for persistent social personas; blockchain is one of 90+ plugin categories | Stateless tool calls -- no portfolio state, no strategy context between actions |
| **Safety** | Pre-execution simulation, circuit breakers, position limits, slippage bounds, gas caps, drawdown guards | No financial risk management -- a bad LLM hallucination can drain a wallet | No safety layer -- executes whatever the LLM outputs |
| **Ethereum Integration** | Deep: EIP-1559, Flashbots, ERC-4626, SIWE, typed protocol connectors | Shallow: generic transaction sending | Shallow: basic swap/transfer actions |
| **Strategy Abstraction** | Natural language, declarative DSL, or raw TypeScript | Raw code only | Raw code only |
| **Agent Coordination** | P2P via libp2p + on-chain payment escrow | Isolated agents | Isolated agents |

**Summary:** ElizaOS builds social agents that can touch the blockchain. GOAT gives agents hands. Meridian gives agents a financial brain -- with safety rails.

---

## Proof of Work

This is not a whitepaper application. Meridian is a working system.

| Metric | Evidence |
|---|---|
| **100+ autonomous trades** | Executed on Arbitrum Sepolia via Uniswap V3, zero human intervention |
| **19,000 lines of code** | TypeScript + Solidity across 8 core modules |
| **208 tests passing** | Full test suite across 12 test files (vitest for TypeScript, Foundry for Solidity) |
| **99.9% uptime** | 30-day continuous operation on testnet |
| **< 3s decision latency** | Full Sense -- Think -- Act -- Reflect cycle |
| **< 2% portfolio drift** | Target allocation accuracy maintained over 30-day simulation |
| **Open source** | MIT license, public repository |

---

## Deliverables and Milestones

We propose a 3-month engagement with monthly milestone-gated disbursement. Each milestone produces independently valuable, publicly verifiable deliverables.

### Month 1 -- Foundation (30% disbursement)

**Deliverables:**
- Core agent runtime engine with xstate v5 state machine and BullMQ tick scheduler
- 3 Ethereum protocol connectors: Uniswap V3, Aave V3, Lido (typed, protocol-aware)
- SDK v0.1 published to npm (`@meridian/sdk`) with TypeScript types and API reference
- Reference rebalancing agent live on Ethereum Sepolia + Arbitrum Sepolia (L1 + L2)

**Evidence:** Public GitHub repository, verified testnet contracts on Etherscan/Arbiscan, recorded demo walkthrough, 100+ autonomous testnet transactions

### Month 2 -- Intelligence and Orchestration (40% disbursement)

**Deliverables:**
- Multi-agent orchestration engine: agent-to-agent communication via libp2p, task delegation, signal sharing, on-chain payment settlement
- Strategy DSL v1.0: declarative language with PEG grammar for defining agent strategies without low-level connector code, shipped with 10+ example strategies
- 3 production-ready example agents: yield optimizer (Aave V3 + Lido), concentrated liquidity manager (Uniswap V3), and delta-neutral hedger
- Backtesting engine with historical Ethereum/Arbitrum data: Sharpe ratio, Sortino ratio, max drawdown, equity curves

**Evidence:** 4-agent orchestrated demo video, published DSL specification, backtest sample reports, 500+ cumulative testnet transactions

### Month 3 -- Developer Experience and Community (30% disbursement)

**Deliverables:**
- SDK v1.0 with comprehensive documentation, 5+ tutorials, and 10+ runnable examples featuring Ethereum and Arbitrum
- Pre-built agent templates for Ethereum's top 3 protocols: Aave V3 yield optimizer, Uniswap V3 LP manager, Lido staking optimizer
- Developer quickstart tutorial + video walkthrough (zero to running agent in under 30 minutes)
- Community launch: published tutorial series, npm packages, first monthly ecosystem impact report

**Evidence:** npm packages live with download metrics, documentation site published, SDK install-to-running-agent under 10 minutes, impact dashboard with on-chain metrics

---

## Budget Breakdown

| Category | Amount | Percentage | Description |
|---|---|---|---|
| Core Engineering (2 senior engineers) | $80,000 | 44% | Agent runtime, protocol connectors, SDK, multi-agent engine, DSL |
| Smart Contract Development | $25,000 | 14% | Agent Registry, Strategy Vault (ERC-4626), Escrow, testnet deployment |
| Developer Experience | $20,000 | 11% | Documentation, tutorials, video walkthroughs, example agents |
| Infrastructure | $15,000 | 8% | Testnet RPC nodes (Ethereum Sepolia + Arbitrum Sepolia), Redis, PostgreSQL, Qdrant hosting, CI/CD |
| Security and Testing | $20,000 | 11% | Comprehensive test suite expansion, pre-audit preparation, static analysis tooling |
| DevRel and Community | $10,000 | 5% | Developer onboarding materials, community management, technical writing |
| Contingency | $10,000 | 5% | Buffer for scope adjustments |
| **Total** | **$180,000** | **100%** | |

*Note: We are requesting $150,000 -- $200,000. The budget above represents the midpoint ($180,000). At the lower bound ($150,000), contingency and DevRel are reduced. At the upper bound ($200,000), we add a fourth protocol connector (Curve) and expand the security review scope.*

---

## Benefit to the Ethereum Ecosystem

### Public Goods Infrastructure

Meridian is MIT-licensed infrastructure that any Ethereum developer can use, fork, extend, and build upon without restriction. The SDK, protocol connectors, smart contracts, Strategy DSL, and all documentation are open source. We are building commons, not a competitive moat.

### Driving L2 Adoption

Meridian agents operate natively across Ethereum L1 and L2 rollups. Our testnet deployment spans Ethereum Sepolia and Arbitrum Sepolia, with architecture designed for Optimism, Base, and zkSync expansion. Every agent deployed through Meridian generates persistent transaction volume on Ethereum's rollup ecosystem.

### Making DeFi Accessible

The Strategy DSL and natural language strategy input lower the barrier from "senior DeFi developer with ML expertise" to "any developer who can describe a strategy in English or a simple declarative syntax." This expands the addressable developer audience for Ethereum DeFi by an order of magnitude.

### Protocol Activity Generation

Meridian agents are persistent users of Ethereum DeFi protocols. Each agent generates continuous swap volume on Uniswap, lending activity on Aave, staking flows through Lido, and liquidity provision across the ecosystem. This is not one-time usage -- agents run 24/7, generating compounding protocol activity.

### Security Standards for AI-Managed Capital

Meridian's risk management layer -- pre-execution simulation, circuit breakers, position limits, MEV protection via Flashbots -- establishes a standard for safe AI agent behavior on Ethereum. As AI agents become a larger portion of on-chain activity, these safety patterns benefit the entire ecosystem.

---

## Team

[TEAM_PLACEHOLDER -- Insert team bios, relevant experience, and prior contributions to Ethereum/open-source projects]

**Current team:** 4-6 core contributors with experience across DeFi protocol engineering, infrastructure development, ML/AI systems, and smart contract security.

---

## Open-Source Commitment

- **License:** MIT (all code, contracts, documentation)
- **Repository:** Public from day one
- **Standards:** Conventional commits, comprehensive test coverage, NatSpec documentation on all Solidity interfaces
- **Community:** Open contribution guidelines, Discord for developer support, quarterly office hours
- **Sustainability:** Post-grant, Meridian sustains through the on-chain strategy marketplace (optional revenue sharing on agent strategies) and enterprise support tiers -- the core SDK and infrastructure remain permanently free and open-source

---

## Milestone Guarantee

We propose milestone-gated disbursement: 30% / 40% / 30% across three months. Each milestone is independently verifiable through:

- Public GitHub commits and pull requests
- Verified testnet contract deployments (Etherscan/Arbiscan)
- On-chain transaction logs demonstrating autonomous agent activity
- Published npm packages with download metrics
- Documentation and tutorial publication timestamps

If any milestone is materially unmet, the subsequent disbursement is held until remediation. The Ethereum Foundation's technical team is welcome to review deliverables at each stage.

---

## Monthly Ecosystem Impact Reports

For the duration of the grant, we publish monthly reports detailing:

- Number of agents deployed on Ethereum and Ethereum L2s
- Transaction volume generated across protocols (Uniswap V3, Aave V3, Lido)
- Developer signups, SDK downloads, and npm install metrics
- Community growth (Discord members, GitHub stars/forks, tutorial completions)
- On-chain verification of all claimed metrics

These reports ensure the ESP investment is transparently tracked and the Ethereum community can see concrete returns.

---

## Why Now

The convergence of capable LLMs (Claude, GPT-4), mature Ethereum DeFi protocols, and growing L2 adoption creates a narrow window to establish the standard infrastructure for AI agents in DeFi. Meridian is positioned to be that standard -- but only if the core infrastructure ships while the market is forming. Waiting 6-12 months means ceding the developer mindshare to closed-source, unsafe alternatives that will establish patterns harmful to the Ethereum ecosystem.

The ESP grant accelerates Meridian from a working proof-of-concept to production-grade Ethereum infrastructure that the entire ecosystem can build on.

---

*Meridian: DeFi does not need more trading bots. It needs an intelligence layer.*

*February 2026 | MIT License | Open Source*
*meridianagents.xyz | github.com/meridian-agents | @meridiandefi*
