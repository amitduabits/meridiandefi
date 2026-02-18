# Optimism RetroPGF Grant Addendum — Meridian Framework

**Program:** Optimism Retroactive Public Goods Funding (RetroPGF) / Optimism Foundation Grants ($5K--$500K)
**Category:** Developer Tooling / DeFi Infrastructure / Public Goods
**Recommended Ask:** $50K--$100K (Tier 2)
**Priority:** MEDIUM

---

## A) Ecosystem Customization

Optimism's retroactive public goods funding model rewards projects that have already delivered measurable impact to the ecosystem. Meridian is designed to meet this standard: 19,000 lines of open-source code, 208 passing tests, 100+ autonomous trades on Arbitrum Sepolia, 8 core modules, 4 auditable smart contracts, and an MIT license that makes every line of code a public good. The Superchain vision -- a network of interoperable OP Stack chains sharing security, communication, and liquidity -- creates the ideal substrate for Meridian's cross-chain agent architecture. Agents that operate across multiple OP Stack chains, routing liquidity and executing strategies across the Superchain's shared bridge infrastructure, are not just technically possible but architecturally aligned with Optimism's core thesis.

Meridian's value proposition for the Optimism ecosystem is infrastructure that generates compounding public benefit. Every connector we build, every protocol adapter we publish, and every strategy template we release is open-source and available to any developer building on the Superchain. Unlike proprietary trading systems that extract value from the ecosystem, Meridian agents generate protocol fees (swaps, lending, liquidity provision) while the framework itself remains a freely available public good. The retroactive funding model is ideal for Meridian because we can demonstrate delivered impact before requesting funds: working agents, published code, testnet transactions, and developer documentation. For RetroPGF evaluators, the question is not "will this project deliver?" but "how much has this project already delivered, and how much more will it deliver with funding?"

## B) Why Build on Optimism Specifically

- **Superchain-native cross-chain agents.** Meridian agents can operate across multiple OP Stack chains through shared bridge infrastructure, positioning Meridian as the agent framework that makes the Superchain vision tangible for DeFi users.
- **Retroactive funding rewards demonstrated impact.** Meridian's 100+ autonomous trades, 208 tests, and open-source codebase provide concrete evidence of delivered value -- exactly what RetroPGF is designed to reward.
- **Public goods alignment.** Meridian's MIT license, open-source connectors, and published documentation make every component a public good that benefits the entire Superchain ecosystem, not a proprietary tool that extracts from it.

## C) Recommended Funding and Program

**Amount:** $50K--$100K from Optimism RetroPGF or Optimism Foundation Grants
**Tier:** Standard (Tier 2) -- SDK featuring the Superchain, connectors for Uniswap V3/OP + Aave V3/OP + Velodrome, multi-agent orchestration across OP Stack chains, backtesting, and developer templates.
**Milestone structure:** For Foundation Grants: 3-month delivery with monthly disbursement (30/40/30 split). For RetroPGF: retrospective application based on delivered impact.

## D) Key Contact / Channel

- **Optimism Grants:** app.optimism.io/grants (Foundation Grants)
- **RetroPGF:** community.optimism.io (governance forum)
- **Primary contact:** Optimism Foundation grants team and RetroPGF badgeholders
- **Engage before applying:** Build a public track record on Optimism by deploying agents on OP Sepolia and publishing impact data. Participate in the Optimism governance forum. For RetroPGF, ensure the project is listed in the Optimism RPGF registry with detailed impact metrics. For Foundation Grants, engage the developer relations team in Discord.

## E) Unique Demo Addition

**Superchain Cross-Chain Agent Router.** Deploy a Meridian agent that operates across two OP Stack chains simultaneously, routing liquidity and executing strategies across the Superchain's shared bridge. For example: an agent that monitors yield opportunities on OP Mainnet (Velodrome) and Base (Aerodrome), and autonomously bridges capital to the higher-yield chain, settling through the Superchain's native interop. Publish as an open-source reference implementation for cross-chain agent strategy on the Superchain.

## F) Pre-Written Application Answers

**Q1: What is Meridian?**
Meridian is an open-source AI agent framework purpose-built for decentralized finance. Agents follow a Sense-Think-Act-Reflect cycle with persistent portfolio context, LLM-powered reasoning, typed protocol connectors, and pre-execution risk simulation. The framework is MIT licensed with 19,000 lines of TypeScript, 208 tests, 100+ autonomous trades executed, 8 core modules, and 4 smart contracts. GitHub: https://github.com/amitduabits/meridiandefi

**Q2: How does Meridian benefit the Optimism/Superchain ecosystem?**
Every component is open-source (MIT license) and available to all Superchain developers. Meridian agents generate persistent protocol activity (swap fees, lending interest, LP fees) on Optimism. The cross-chain architecture is designed for Superchain interop, enabling agents to operate across OP Stack chains through shared bridge infrastructure.

**Q3: What is your impact to date?**
100+ autonomous trades on Arbitrum Sepolia demonstrating production-ready agent execution. 19,000 lines of open-source code. 208 passing tests across 12 test files. 4 auditable smart contracts (Agent Registry, Payment Escrow, Strategy Vault, Governance). SDK, server, dashboard, and two example applications complete.

**Q4: What Optimism protocols will you integrate?**
Uniswap V3 (on Optimism), Aave V3 (on Optimism), and Velodrome (Optimism-native DEX and liquidity layer). Our existing Uniswap V3 and Aave V3 connectors require only chain-specific configuration for Optimism deployment. Velodrome integration extends our AMM connector to support Optimism's primary liquidity protocol.

**Q5: How does Meridian relate to the Superchain vision?**
Meridian's cross-chain connector architecture enables agents to operate across multiple OP Stack chains simultaneously. An agent can monitor opportunities on OP Mainnet, Base, Zora, and other Superchain members, routing capital through shared bridge infrastructure. This makes Meridian the first agent framework designed for the Superchain's interoperable future.

**Q6: What are your milestones?**
Month 1: OP Mainnet connectors (Uniswap V3, Aave V3, Velodrome), rebalancing agent on OP Sepolia, SDK v0.1 with Optimism examples. Month 2: Multi-agent demo, Superchain cross-chain routing POC, Strategy DSL with OP templates, backtesting engine. Month 3: SDK v1.0 featuring the Superchain, full documentation, agent templates, published impact report with protocol activity metrics.

**Q7: What makes Meridian different from competitors?**
ElizaOS targets social agents, GOAT provides stateless blockchain actions, Virtuals operates as a token launchpad. Meridian is DeFi-native with persistent portfolio state, pre-execution risk simulation (7-point pre-flight check), multi-agent coordination, and protocol-semantic connectors. Every component is a public good under MIT license.

---

*Last Updated: February 2026*
