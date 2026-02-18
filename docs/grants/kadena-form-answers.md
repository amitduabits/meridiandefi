# Kadena AI Grant — Pre-Written Form Answers

**Last Updated: February 2026**
**Use these answers as starting points. Adjust length and formatting to match the specific application form.**

---

## 1. Project Description (1 sentence)

Meridian is a production-grade AI agent framework for decentralized finance that deploys autonomous agents capable of real-time contract analysis, on-chain prediction, and verifiable identity management across Kadena's 20 parallel braided chains.

---

## 2. How Does Meridian Leverage AI?

Meridian integrates artificial intelligence at every layer of its architecture, from decision-making through execution to post-trade learning.

**Multi-Provider LLM Reasoning.** Each Meridian agent operates on a Sense-Think-Act-Reflect decision cycle. During the Think phase, the agent consults a tiered LLM gateway: Claude serves as the primary reasoning engine for trade decisions and risk assessments, GPT-4o provides fallback reasoning, and local models (Llama 3.1 via Ollama) handle real-time signal processing with sub-second latency. All LLM outputs are validated through Zod structured output schemas — the agent never executes on unstructured or unparseable model responses.

**Structured Output Validation.** Every LLM response is parsed against a typed schema before it can influence agent behavior. Trade recommendations must include asset pair, direction, size, confidence score, and reasoning chain. Risk assessments must produce a numerical score, categorical rating, and enumerated risk factors. This eliminates hallucination-driven execution errors.

**ML-Powered Market Intelligence.** Beyond LLM reasoning, Meridian integrates specialized machine learning models for quantitative analysis:
- LSTM-based trend classification trained on historical price and volume data
- Volatility regime detection for adaptive strategy parameter tuning
- Liquidity depth analysis for optimal execution timing
- Gas price prediction for transaction cost optimization
- Anomaly detection for identifying unusual on-chain patterns (potential exploits, oracle manipulation, flash loan attacks)

**Semantic Memory and RAG.** Agents maintain a three-tier memory system. The knowledge tier uses Qdrant vector database with local embeddings (all-MiniLM-L6-v2 via @xenova/transformers) to store and retrieve past decisions, protocol documentation, and market analysis. A RAG (Retrieval-Augmented Generation) pipeline enriches LLM context with relevant historical decisions and protocol-specific knowledge before each reasoning cycle.

**Natural Language Strategy Definition.** Users can define trading strategies in plain English. The LLM integration layer converts natural language descriptions into executable strategy configurations, validated against the strategy DSL schema, and sandboxed in isolated-vm for safe execution.

**Continuous Learning Loop.** The Reflect phase of each decision cycle evaluates trade outcomes against predictions, stores the comparison in episodic memory (PostgreSQL + TimescaleDB), and feeds performance data back into the agent's context for improved future reasoning.

---

## 3. How Does This Benefit Kadena's Ecosystem?

**Fills the AI agent infrastructure gap.** Kadena currently has no AI agent framework in its ecosystem. Competing L1s (Arbitrum with ElizaOS, Base with Virtuals, Solana with GOAT) are actively attracting AI-focused developers. Meridian gives Kadena a competitive answer that is architecturally superior — DeFi-native rather than general-purpose.

**Generates persistent protocol activity.** Each deployed Meridian agent generates continuous on-chain transactions: swaps, liquidity provisioning, lending operations, cross-chain bridging. A single rebalancing agent executing on Arbitrum Sepolia has generated over 100 autonomous trades in its testing period. Scaled across Kadena's ecosystem, this represents meaningful and sustained protocol activity, TVL, and fee revenue.

**Unlocks Chainweb's unique advantage.** Kadena's 20 parallel braided chains are a throughput advantage that currently has no DeFi-specific tooling to exploit it. Meridian's multi-agent orchestration engine enables specialized agents monitoring each chain simultaneously — turning Chainweb's parallelism from a scalability feature into an intelligence advantage that no single-chain ecosystem can replicate.

**Attracts developer gravity.** The Meridian SDK with Kadena as the primary chain in all examples, tutorials, and documentation creates a developer onboarding funnel. Every developer who builds a Meridian agent defaults to deploying on Kadena. The Strategy DSL reduces the barrier from "senior DeFi developer" to "anyone who can write a configuration file," expanding the addressable developer population.

**Establishes enterprise credibility.** Meridian's architecture — circuit breakers, pre-flight validation, timelocked agent changes, protocol allowlists, emergency withdrawals, structured audit trails — meets the compliance and risk management requirements that institutional participants demand. This positions Kadena as an enterprise-ready platform for AI-managed capital.

**Creates a self-sustaining agent economy.** The on-chain Agent Registry (ERC-721 identities with reputation scoring) and Strategy Marketplace enable agents to discover each other, delegate tasks, share signals, and settle payments on-chain. This creates network effects that compound beyond the grant period — every new agent increases the value of the registry for all existing agents.

**Provides a developer grants multiplier.** $15K-$25K from the grant funds a Meridian developer sub-program specifically for Kadena builders. This seeds additional projects building on top of Meridian for Kadena, turning a single grant into an ecosystem of AI-powered applications.

---

## 4. Chainweb Compatibility Plan

Meridian's EVM-first architecture maps directly to Kadena's EVM compatibility layer.

**Smart Contracts.** All four Meridian contracts (AgentRegistry, StrategyVault, PaymentEscrow, MeridianGovernance) are Solidity 0.8.24+ built on OpenZeppelin v5. They deploy to any EVM-compatible chain without modification. Chainweb EVM compatibility means these contracts deploy to Kadena testnet and mainnet using standard Foundry tooling (`forge create`, `forge script`) with Chainweb RPC endpoints.

**Chain Connector.** Meridian's `IDeFiConnector` interface abstracts all chain-specific details behind 12 typed methods. The current EVM implementation uses viem as the primary client. A Chainweb EVM connector requires:
1. RPC endpoint configuration for Chainweb EVM nodes
2. Chain ID registration in the connector registry
3. Gas estimation adjustments for Chainweb's fee model
4. Protocol adapter implementations for Kadena-native DEX and lending protocols

This is configuration-level work, not architectural change. Estimated implementation time: 2-3 weeks for core connector, 2-3 additional weeks for protocol-specific adapters.

**Multi-Chain Agent Architecture.** Chainweb's 20 parallel chains are exposed as 20 distinct chain IDs in Meridian's connector registry. The multi-agent orchestration engine coordinates specialized agents across chains via libp2p GossipSub messaging. A portfolio manager agent can delegate monitoring of specific Chainweb chains to dedicated watcher agents, aggregating intelligence across all 20 chains for unified decision-making.

**Testing Strategy.** Deployment and testing on Chainweb EVM testnet follows our established pipeline: Foundry for contract testing (`forge test --gas-report`), Vitest for SDK integration tests, and Playwright for end-to-end agent lifecycle validation. Testnet deployment in Month 1 provides immediate validation of Chainweb compatibility.

---

## 5. Enterprise Value Proposition

Meridian was designed for environments where autonomous agent failures have financial consequences. Every architectural decision reflects this reality.

**Pre-Flight Validation.** Every transaction passes through seven deterministic checks before execution: position size limits, portfolio exposure thresholds, gas cost ratios, slippage tolerance bounds, daily loss limits, trade frequency caps, and open position limits. Each check produces a quantified risk score (0-100 scale). Failed checks generate modification suggestions rather than simple rejections, enabling agents to adapt within risk parameters.

**Circuit Breaker System.** Six independent breakers monitor: portfolio drawdown (30-minute cooldown), flash crash detection (15-minute cooldown), gas price spikes (5-minute cooldown), RPC endpoint failures (2-minute cooldown), oracle staleness (5-minute cooldown), and contract anomalies (60-minute cooldown). Each breaker follows a state machine (CLOSED, OPEN, HALF_OPEN) with probe-based recovery requiring multiple successful validations before operations resume.

**Smart Contract Safety.** The StrategyVault enforces per-transaction value limits and daily spending caps at the contract level. Agent changes require a 48-hour timelock. Only pre-approved protocol addresses can receive calls. Emergency withdrawal allows the vault owner to recover all funds at any time. All contracts follow CEI (Checks-Effects-Interactions) pattern and use custom errors for gas efficiency.

**Audit Trail.** Every agent decision is logged via pino structured JSON logging. Decision rationale, risk scores, transaction parameters, and execution outcomes are persisted to PostgreSQL with TimescaleDB for time-series analysis. The agent state machine (xstate v5) ensures deterministic lifecycle transitions that can be replayed and audited.

**Institutional Access Controls.** The AgentRegistry uses ERC-721 tokens for agent identity, enabling ownership transfer, delegation, and programmatic access control. The Governance contract provides on-chain parameter management with community voting. SIWE (Sign-In With Ethereum) authentication ensures wallet-based access to the monitoring dashboard.

---

## 6. Team

**Core Engineering (2-3 engineers)**
Senior engineers with combined experience spanning DeFi protocol development, distributed systems infrastructure, and applied ML/AI. Prior contributions include open-source DeFi tooling, blockchain node implementations, and production trading infrastructure. Responsible for the Meridian SDK, agent runtime, chain connectors, and ML integration.

**Smart Contract Engineering (1-2 engineers)**
Solidity engineers with audit preparation experience. Developed the AgentRegistry (ERC-721), StrategyVault (ERC-4626), PaymentEscrow, and Governance contracts using Foundry with comprehensive test suites and gas optimization. Responsible for Chainweb EVM deployment and protocol-specific adapter contracts.

**DevRel and Documentation (1 engineer)**
Technical writer focused on SDK tutorials, API reference documentation, developer onboarding content, and community engagement. Responsible for making Kadena the primary chain in all Meridian developer materials.

**Advisors**
Domain experts in quantitative finance (systematic trading, portfolio construction), protocol architecture (L1/L2 design, cross-chain infrastructure), and blockchain ecosystem development (grant programs, developer community building).

**Current headcount: 4-6. Scaling to 8-10 by Month 4 of the grant period, with 2 additional hires dedicated to Kadena-specific development and community support.**

---

## 7. Budget Breakdown

| Category | % of Grant | $150K Scenario | $250K Scenario | Description |
|----------|-----------|---------------|---------------|-------------|
| Core Engineering | 35% | $52,500 | $87,500 | Chainweb connector development, contract deployment, SDK integration, multi-agent engine |
| AI/ML Development | 20% | $30,000 | $50,000 | LSTM models, anomaly detection pipeline, Kadena-specific training data, model benchmarking |
| Custom Agent Types | 15% | $22,500 | $37,500 | 4 Kadena-specific agent archetypes: cross-chain arbitrage, multi-chain liquidity, risk sentinel, yield aggregation |
| Security Audit | 15% | $22,500 | $37,500 | Third-party audit of all smart contracts deployed on Kadena (Trail of Bits, OpenZeppelin, Spearbit, or equivalent) |
| Developer Ecosystem | 10% | $15,000 | $25,000 | Developer grants sub-program for Kadena builders, tutorial production, video walkthroughs, community events |
| Program Management | 5% | $7,500 | $12,500 | Milestone reporting, impact metrics dashboard, community calls, Kadena governance forum updates |

**Total engineering cost basis is reduced by existing infrastructure.** The Meridian SDK, agent runtime, smart contracts, and EVM connector architecture are already built and tested (208/208 tests passing). The grant funds Kadena-specific development, not ground-up construction. This means faster delivery timelines and lower execution risk compared to teams starting from scratch.

---

## 8. Timeline with Kadena-Specific Milestones

### Month 1 — Genesis (15% disbursement)
- Chainweb EVM chain connector implementing full `IDeFiConnector` interface (12 methods)
- AgentRegistry, StrategyVault, PaymentEscrow, and Governance contracts deployed to Chainweb EVM testnet
- Reference rebalancing agent executing autonomous trades on Chainweb testnet
- Public GitHub repository with Kadena-specific development branch
- **Evidence:** Verified testnet contract addresses, 50+ autonomous testnet transactions, recorded demo walkthrough

### Month 2 — Intelligence (20% disbursement)
- Multi-agent orchestration engine with Chainweb multi-chain coordination demo
- Strategy DSL v1.0 with 10+ example strategies
- 3 Kadena-specific example agents (rebalancer, yield optimizer, risk monitor)
- Backtesting engine with Kadena historical data integration
- **Evidence:** 4-agent orchestrated demo video, published DSL specification, backtest sample reports, 200+ autonomous testnet transactions

### Month 3 — Developer Experience (20% disbursement)
- SDK v1.0 published to npm with Kadena as primary chain in all examples
- Full API reference documentation and developer guides
- 3 pre-built agent templates for Kadena's top protocols
- Community launch with Kadena co-marketing
- First quarterly impact report
- **Evidence:** npm package live, documentation site published, tutorial series, Kadena governance forum post, impact metrics dashboard

### Month 4 — Custom Intelligence (15% disbursement)
- 4 custom agent types deployed: cross-chain arbitrage, multi-chain liquidity manager, risk sentinel, yield aggregator
- ML model v1 integrated: LSTM trend classification, volatility regime detection
- Agent Registry on Chainweb testnet with reputation oracle
- Enterprise pilot program invitation to 3-5 Kadena ecosystem projects
- **Evidence:** Agent performance benchmarks, model cards with A/B test results, pilot program documentation

### Month 5 — Security and Marketplace (15% disbursement)
- Security audit initiated with recognized audit firm
- Strategy Marketplace beta deployed to Chainweb testnet
- Developer grants sub-program: $15K-$25K allocated, first grants awarded to Kadena builders
- Dedicated Kadena developer support channel launched
- **Evidence:** Audit engagement letter, marketplace functional demo, sub-program grant announcements

### Month 6 — Production (15% disbursement)
- Security audit completed with remediation of all critical/high findings
- Smart contracts deployed to Kadena mainnet
- Final impact assessment with TVL, transaction volume, developer adoption metrics
- Transition plan to self-sustaining operations (marketplace fees, agent registry staking)
- Second quarterly independent review
- **Evidence:** Published audit report, mainnet contract addresses, final impact report, sustainability model documentation

---

## 9. Additional Questions — Quick Answers

**What happens after the grant period?**
The Agent Registry and Strategy Marketplace generate ongoing revenue through registration fees, strategy listing fees, and optional performance-based revenue sharing (0-20% of agent profits). The developer sub-program seeds a community of Kadena builders who continue developing on the platform. Meridian's open-source SDK ensures the infrastructure is permanently available regardless of our ongoing involvement.

**How do you handle key management for agents?**
Agent private keys are managed through environment variables, never hardcoded. The StrategyVault pattern delegates execution authority to agent addresses while keeping deposited capital under vault owner control with per-transaction and daily limits. Hardware security module (HSM) integration is on the roadmap for institutional deployments.

**What is your open-source strategy?**
The entire Meridian SDK, all smart contracts, documentation, and example agents are open-source under MIT license. Protocol-specific adapters for Kadena will be published as `@meridian/connector-kadena` on npm. We believe open-source infrastructure drives adoption faster than proprietary lock-in.

**How do you measure success?**
Quantitative: Number of agents deployed on Kadena, autonomous transaction volume generated, protocols interacted with, SDK downloads, developer signups, testnet-to-mainnet conversion rate. Qualitative: Developer NPS from tutorials, audit report findings, community engagement metrics, enterprise pilot feedback.

---

*Meridian Protocol | meridianagents.xyz | github.com/meridian-agents | @meridiandefi*
