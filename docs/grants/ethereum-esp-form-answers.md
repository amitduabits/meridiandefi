# Ethereum Foundation ESP -- Pre-Written Form Answers

*Ready-to-paste answers for the ESP application form. Professional tone. Adjust [TEAM_PLACEHOLDER] sections before submitting.*

---

## 1. Describe your project in one sentence.

Meridian is an open-source, DeFi-native AI agent framework that enables developers to build, deploy, and orchestrate autonomous financial agents across Ethereum and its L2 ecosystem -- with built-in risk management, protocol-aware connectors, and multi-provider LLM reasoning.

---

## 2. What problem does this solve?

Ethereum has the deepest and most composable DeFi ecosystem in crypto, yet the tooling for building autonomous agents on top of this infrastructure is fragmented, unsafe, and inaccessible to the majority of developers.

Today, a developer who wants to build an agent that monitors Aave V3 health factors, rebalances Uniswap V3 concentrated liquidity positions, and manages Lido staking exposure must integrate three separate protocol SDKs, handle EIP-1559 gas estimation, manage nonce ordering, build crash recovery logic, and somehow bolt on LLM reasoning -- all without any safety rails to prevent a hallucinated output from draining a wallet. The existing AI agent frameworks (ElizaOS, GOAT) were built for social agents or generic tool-calling; they treat blockchain as one plugin among many and provide zero financial risk management. A single bad LLM response can execute an unchecked transaction with catastrophic results.

Meridian solves this by providing a unified, type-safe, protocol-semantic framework where DeFi is the core domain, not an afterthought. Every agent runs a continuous Sense-Think-Act-Reflect decision cycle with pre-execution simulation, circuit breakers, position limits, slippage bounds, and MEV protection via Flashbots built into the execution pipeline. The Strategy DSL and natural language interface lower the barrier from "senior DeFi engineer with ML expertise" to "any TypeScript developer with a strategy idea," expanding the addressable developer audience for Ethereum DeFi by an order of magnitude. All of this ships under the MIT license as permanent Ethereum public goods infrastructure.

---

## 3. Who is the target user?

**Primary users: Ethereum DeFi developers and teams.**

These are TypeScript and Solidity developers who want to build autonomous agents that interact with Ethereum's DeFi protocols (Uniswap, Aave, Lido, Curve, Compound) but lack the time or expertise to build the agent runtime, LLM integration, risk management, and protocol connectors from scratch. They range from individual developers building personal portfolio management agents to small teams building commercial DeFi products. Meridian gives them a production-grade SDK that handles the infrastructure so they can focus on strategy logic.

**Secondary users: Quantitative traders and DeFi power users.**

Experienced DeFi participants who have strategy ideas but cannot translate them into code. Meridian's Strategy DSL and natural language input allow them to define strategies in a declarative syntax or plain English, which the framework compiles into executable agent logic with full risk management. These users convert from manual DeFi participants into persistent, 24/7 autonomous protocol users -- generating continuous transaction volume across the Ethereum ecosystem.

**Tertiary users: Protocol teams and DAOs.**

Ethereum protocol teams (DEXs, lending protocols, yield aggregators) benefit from Meridian as infrastructure that drives autonomous activity on their protocols. A Uniswap V3 concentrated liquidity management agent generates continuous swap and LP activity. An Aave V3 yield optimizer generates lending volume. Meridian agents become persistent, intelligent users of Ethereum's protocol layer.

---

## 4. What are your milestones?

### Month 1 -- Foundation (30% of grant)

| Deliverable | Evidence of Completion |
|---|---|
| Core agent runtime engine (xstate v5 FSM, BullMQ tick scheduler, crash recovery) | Public GitHub repo, passing test suite |
| 3 typed protocol connectors: Uniswap V3, Aave V3, Lido | Integration tests against forked mainnet |
| SDK v0.1 published to npm (`@meridian/sdk`) | npm package live with TypeScript types |
| Reference rebalancing agent on Ethereum Sepolia + Arbitrum Sepolia | Verified contracts on Etherscan/Arbiscan, 100+ autonomous transactions |
| Recorded demo walkthrough | Published video demonstrating agent operation |

### Month 2 -- Intelligence and Orchestration (40% of grant)

| Deliverable | Evidence of Completion |
|---|---|
| Multi-agent orchestration engine (libp2p communication, task delegation, on-chain payment settlement) | 4-agent coordinated demo video |
| Strategy DSL v1.0 (PEG grammar, 10+ example strategies) | Published DSL specification, runnable examples |
| 3 example agents: Aave V3 yield optimizer, Uniswap V3 LP manager, delta-neutral hedger | Deployed on Ethereum Sepolia, autonomous operation |
| Backtesting engine with Ethereum + Arbitrum historical data | Sample reports with Sharpe, Sortino, max drawdown, equity curves |
| Cumulative 500+ testnet transactions | On-chain transaction logs |

### Month 3 -- Developer Experience and Community (30% of grant)

| Deliverable | Evidence of Completion |
|---|---|
| SDK v1.0 with comprehensive documentation, 5+ tutorials, 10+ runnable examples | npm package, docs site live |
| Pre-built agent templates for Aave V3, Uniswap V3, and Lido | Deployable with configurable parameters |
| Developer quickstart (zero to running agent in < 30 min) + video walkthrough | Published tutorial and video |
| First monthly ecosystem impact report | Published report with on-chain metrics |
| Community launch (Discord, contribution guidelines, first external contributors) | Active community channels |

Each milestone is independently valuable. If any milestone is delayed, the subsequent disbursement holds until remediation. All evidence is publicly verifiable.

---

## 5. How does this benefit the Ethereum ecosystem?

**Public goods infrastructure.** Meridian is MIT-licensed. The SDK, protocol connectors, smart contracts, Strategy DSL, backtesting engine, and all documentation are freely available to any Ethereum developer. We are building commons -- permanent infrastructure that the ecosystem can build on without restriction, extraction, or gatekeeping.

**Expanding the Ethereum developer base.** The Strategy DSL and natural language interface make autonomous DeFi accessible to developers who lack deep protocol expertise. A TypeScript developer who understands basic portfolio concepts can deploy a sophisticated multi-protocol agent on Ethereum without understanding concentrated liquidity math or health factor calculations. This brings a new tier of developers into the Ethereum DeFi ecosystem.

**Driving L2 adoption.** Meridian agents operate natively across Ethereum L1 and L2 rollups. Our architecture is designed for Arbitrum, Optimism, Base, and zkSync. Every agent deployed through Meridian generates persistent transaction volume on Ethereum's rollup ecosystem, supporting the L2-centric roadmap.

**Protocol activity generation.** Meridian agents are persistent, 24/7 users of Ethereum DeFi protocols. They generate continuous swap volume on Uniswap, lending activity on Aave, staking flows through Lido, and liquidity provision across the ecosystem. This is compounding protocol activity, not one-time usage.

**Establishing safety standards.** As AI agents become a larger share of on-chain activity, Meridian's risk management patterns -- pre-execution simulation, circuit breakers, MEV protection via Flashbots, position limits -- establish a reference implementation for safe AI agent behavior on Ethereum. These patterns benefit every team building autonomous systems on the network.

---

## 6. What is your team's relevant experience?

[TEAM_PLACEHOLDER -- Replace with actual team information before submission]

**Template:**

Our team consists of [X] core contributors with direct experience across DeFi protocol engineering, blockchain infrastructure, ML/AI systems, and smart contract development.

- **[Name], [Role]** -- [X] years in [relevant domain]. Previously [contributed to / built / worked at] [relevant projects/companies]. Specializes in [specific area relevant to Meridian].
- **[Name], [Role]** -- [X] years in [relevant domain]. Previously [contributed to / built / worked at] [relevant projects/companies]. Specializes in [specific area relevant to Meridian].
- **[Name], [Role]** -- [X] years in [relevant domain]. Previously [contributed to / built / worked at] [relevant projects/companies]. Specializes in [specific area relevant to Meridian].

**Relevant prior work:**
- [Open-source contribution, protocol, or project with link]
- [Open-source contribution, protocol, or project with link]
- [Relevant hackathon placement, publication, or recognition]

The team has collectively contributed to [X] open-source projects and has experience deploying production systems handling [relevant scale metric].

---

## 7. What is your budget breakdown?

| Line Item | Amount | % of Budget | Justification |
|---|---|---|---|
| **Core Engineering** (2 senior full-stack engineers, 3 months) | $80,000 | 44% | Agent runtime, protocol connectors (Uniswap V3, Aave V3, Lido), SDK development, multi-agent orchestration engine, Strategy DSL implementation |
| **Smart Contract Development** (1 Solidity engineer, 3 months part-time) | $25,000 | 14% | AgentRegistry, StrategyVault (ERC-4626), PaymentEscrow contracts; Foundry test suite; Ethereum Sepolia + Arbitrum Sepolia deployment |
| **Developer Experience** (documentation, tutorials, examples) | $20,000 | 11% | SDK documentation site, 5+ step-by-step tutorials, 10+ runnable example agents, video walkthroughs, developer quickstart guide |
| **Infrastructure** (hosting, RPCs, CI/CD) | $15,000 | 8% | Ethereum Sepolia + Arbitrum Sepolia RPC nodes (Alchemy/Infura), Redis + PostgreSQL + Qdrant hosting, GitHub Actions CI/CD, testnet operations |
| **Security and Testing** | $20,000 | 11% | Test suite expansion to 300+ tests, static analysis tooling (Slither, Mythril), pre-audit contract review, fuzz testing |
| **DevRel and Community** | $10,000 | 5% | Developer onboarding materials, community management tooling, technical writing, Discord setup and moderation |
| **Contingency** | $10,000 | 5% | Buffer for scope adjustments, unexpected technical challenges, additional testnet infrastructure |
| **Total** | **$180,000** | **100%** | |

*At the $150,000 lower bound, contingency and DevRel line items are reduced. At $200,000, we add a fourth protocol connector (Curve) and expand the security review scope to include a preliminary external audit.*

---

## 8. Have you received other grants?

Meridian has not yet received grant funding. This is our first grant application cycle.

We are currently applying to multiple ecosystem grant programs in parallel, as is standard practice for open-source infrastructure projects seeking non-dilutive funding:

| Program | Status | Amount Requested | Focus Area |
|---|---|---|---|
| Ethereum Foundation ESP | This application | $150K--$200K | Core SDK + Ethereum infrastructure |
| Arbitrum Trailblazer | Application submitted | $50K--$75K | Arbitrum-specific connectors + agent deployment |
| NEAR AI Agent Fund | Application submitted | $75K--$100K | Cross-chain agent orchestration |

Each application targets a different deliverable scope and chain-specific work. There is no double-funding of the same deliverables. The Ethereum ESP grant specifically funds Ethereum-native infrastructure (Ethereum Sepolia + Arbitrum Sepolia L1/L2 deployment, Ethereum protocol connectors, EIP-1559 optimization, Flashbots integration) that would not overlap with chain-specific grants from other ecosystems.

We are committed to full transparency with all grant programs regarding our funding status and will update the ESP if any other grants are awarded during the review period.

---

## 9. What is your open-source plan?

**License:** MIT -- the most permissive open-source license. Any developer, company, or DAO can use, modify, fork, and commercialize Meridian code without restriction.

**Repository:** Public from day one. All development happens in the open on GitHub (github.com/meridian-agents). There is no private fork, no delayed open-sourcing, no "open core" model with proprietary extensions.

**What is open-sourced:**
- Complete SDK (`@meridian/sdk`) -- npm package
- All smart contracts (Solidity + Foundry)
- Protocol connectors for Uniswap V3, Aave V3, Lido, and all future integrations
- Strategy DSL parser and compiler
- Backtesting engine
- Multi-agent orchestration engine
- Monitoring dashboard (React)
- tRPC API server
- All documentation, tutorials, and example agents

**Community development practices:**
- Conventional commits with clear changelogs
- Comprehensive contribution guidelines (CONTRIBUTING.md)
- Issue templates for bugs, features, and protocol connector requests
- Pull request review process with required tests
- Discord channel for developer support and discussion
- Quarterly community office hours

**Long-term sustainability:** Post-grant, the core SDK and infrastructure remain permanently free and open-source. Revenue sustainability comes from an optional on-chain strategy marketplace (creators can set 0-20% profit sharing on published strategies) and enterprise support tiers. The public goods infrastructure is never gated.

---

## 10. How will you measure success?

We commit to the following quantitative metrics, tracked publicly through monthly ecosystem impact reports:

**Development Metrics (by end of Month 3):**
- 300+ passing tests (up from current 208)
- 25,000+ lines of open-source code (up from current 19,000)
- SDK v1.0 published to npm with TypeScript types and complete API reference
- 5+ published tutorials and 10+ runnable example agents
- Install-to-running-agent time under 10 minutes

**On-Chain Metrics (by end of Month 3):**
- 1,000+ cumulative autonomous transactions on Ethereum Sepolia + Arbitrum Sepolia
- Agents interacting with 3+ Ethereum DeFi protocols (Uniswap V3, Aave V3, Lido)
- Multi-agent orchestration demonstrated with 4+ coordinated agents
- 99.9% agent uptime maintained across the grant period
- < 3 second decision latency (Sense-Think-Act-Reflect cycle)

**Adoption Metrics (by end of Month 3):**
- 100+ npm downloads of `@meridian/sdk`
- 50+ GitHub stars
- 25+ Discord community members
- 5+ external developer contributions (PRs, issues, or connector requests)
- 3+ published agent templates deployable by external developers

**Ecosystem Metrics (ongoing):**
- Monthly impact reports published publicly with on-chain verification
- Protocol activity generated across Uniswap V3, Aave V3, and Lido
- Developer feedback incorporated into SDK roadmap

All metrics are publicly verifiable through on-chain data, npm download statistics, GitHub activity, and published impact reports. We do not claim metrics we cannot prove.
