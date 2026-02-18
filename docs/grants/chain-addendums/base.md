# Base / Coinbase Grant Addendum — Meridian Framework

**Program:** Coinbase Developer Platform (CDP) Grants / Base Ecosystem Fund
**Category:** AI + DeFi Infrastructure / x402 Integration
**Recommended Ask:** $30K (Tier 1/2)
**Priority:** MEDIUM

---

## A) Ecosystem Customization

Base has emerged as the fastest-growing L2 by developer adoption, backed by Coinbase's distribution network and a deliberate focus on onchain commerce, AI agents, and developer experience. Coinbase's x402 protocol -- HTTP-native micropayments using the 402 Payment Required status code -- represents a paradigm shift for autonomous agent economics: agents can pay for services, data feeds, and compute resources over HTTP without pre-negotiated billing relationships or custodial payment processors. Meridian's multi-agent orchestration engine, where specialist agents delegate tasks and settle payments on-chain, maps directly to the x402 model. A Meridian yield scout agent could pay an oracle agent for premium price data via x402, while a portfolio manager agent purchases risk assessment from a specialized analysis agent -- all settled in USDC on Base with no intermediaries.

Base's positioning within the Coinbase ecosystem provides distribution advantages that no other L2 can match. With Coinbase Wallet integration, fiat on-ramps, and institutional credibility, Base lowers the barrier for Meridian agents to access real capital and real users. Meridian's framework -- 19,000 lines of production code, 208 tests, 100+ autonomous trades on Arbitrum Sepolia -- is EVM-native and deploys to Base without modification. Our existing Uniswap V3 connector works with Base's Uniswap deployment, and Aave V3 on Base provides the lending infrastructure our agents already understand. For Coinbase, funding Meridian means funding the infrastructure that makes onchain AI agents a product category their users can actually interact with, not just a developer experiment.

## B) Why Build on Base Specifically

- **x402 enables agent-native commerce.** Coinbase's x402 micropayment protocol gives Meridian agents the ability to pay for services over HTTP, creating a self-sustaining agent economy where agents buy and sell intelligence, data, and execution services without human intermediaries.
- **Coinbase distribution.** Base's integration with Coinbase Wallet and fiat on-ramps means Meridian agents can be accessed by Coinbase's 100M+ verified users, providing the largest potential user base for autonomous DeFi agents.
- **EVM compatibility with zero friction.** Meridian's existing EVM connectors deploy to Base without a single code change. Uniswap V3, Aave V3, and other protocols on Base use identical interfaces to our existing integrations.

## C) Recommended Funding and Program

**Amount:** $30K from Coinbase Developer Platform Grants or Base Ecosystem Fund
**Tier:** Entry/Standard -- x402 integration proof-of-concept, Base-specific connectors, agent commerce demo, and SDK quickstart featuring Base.
**Milestone structure:** 6-week delivery with two milestones (50/50 split).

## D) Key Contact / Channel

- **CDP Grants:** docs.cdp.coinbase.com (Coinbase Developer Platform)
- **Base Ecosystem:** base.org/ecosystem
- **Primary contact:** Base ecosystem team, Coinbase developer relations
- **Engage before applying:** Join the Base Discord and participate in the Builder channels. Reference x402 integration specifically -- this is the differentiator that will resonate with the Coinbase grants team. Attend a Base Builder event or office hours.

## E) Unique Demo Addition

**x402 Agent Commerce Network.** Deploy a Meridian multi-agent system on Base testnet where agents transact with each other using the x402 payment protocol. A portfolio manager agent pays (via x402 micropayment) a market data agent for premium price feeds, then pays an execution agent to route a trade through the optimal Base DEX. Every inter-agent payment is settled in USDC on Base with full HTTP-native payment flow. Publish as an open-source reference implementation for x402 agent commerce.

## F) Pre-Written Application Answers

**Q1: What are you building?**
Meridian is an open-source AI agent framework purpose-built for DeFi. Agents maintain persistent portfolio context, reason about positions and risk using LLM-powered analysis, and execute strategies through typed protocol connectors. Metrics: 19,000 lines of TypeScript, 208 tests, 100+ autonomous trades on Arbitrum Sepolia, 8 core modules, 4 smart contracts. MIT license. GitHub: https://github.com/amitduabits/meridiandefi

**Q2: How does Meridian integrate with x402?**
Meridian's multi-agent communication layer currently uses libp2p for signaling and on-chain settlement for payments. We will extend this to support x402 as a payment channel, enabling agents to pay for services (data feeds, risk assessments, execution routing) over HTTP using the 402 Payment Required flow. This makes every Meridian agent both a consumer and provider of paid on-chain services on Base.

**Q3: Why Base?**
Base's x402 protocol enables the agent commerce model that Meridian's multi-agent architecture is designed for. Coinbase's distribution network (100M+ users, fiat on-ramps, Coinbase Wallet) provides the largest addressable user base. EVM compatibility means zero-friction deployment of our existing infrastructure.

**Q4: What are your milestones?**
Week 1-3: Base chain connector (Uniswap V3/Base, Aave V3/Base), rebalancing agent on Base Sepolia, x402 payment integration prototype. Week 4-6: Multi-agent x402 commerce demo, SDK quickstart for Base, published tutorial and reference implementation.

**Q5: What makes Meridian different?**
ElizaOS is social-first, GOAT provides stateless actions, Virtuals is a token launchpad. Meridian is DeFi-first with persistent portfolio state, pre-execution risk simulation, multi-agent coordination, and protocol-semantic connectors. The x402 integration makes Meridian the first agent framework where autonomous agents can engage in HTTP-native commerce.

**Q6: Is this open source?**
Yes. MIT license. All Base-specific connectors and x402 integration code will be published as open-source packages.

---

*Last Updated: February 2026*
