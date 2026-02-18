# Arbitrum Grant Application — Pre-Written Form Answers

Ready-to-paste answers for Arbitrum Foundation grant application forms (Trailblazer, LTIPP, DAO proposals). Adjust funding amounts per program.

---

## Project Description (1 sentence)

Meridian is an open-source, DeFi-native AI agent framework that enables developers to build, deploy, and orchestrate autonomous financial agents on Arbitrum — with a working rebalancing agent already live on Arbitrum Sepolia executing 127 trades on Uniswap V3 over 30 days.

---

## Problem / Opportunity

DeFi portfolio management is manual, reactive, and expensive. Even sophisticated traders cannot monitor positions 24/7, react to market conditions in seconds, or maintain disciplined allocation targets without emotional interference. Existing automation tools are either simple bots with hardcoded rules (no reasoning capability) or general-purpose agent frameworks that treat blockchain as an afterthought — lacking portfolio awareness, risk management, and protocol-specific intelligence.

The opportunity for Arbitrum is infrastructure-level: the L2 that provides the best AI agent development environment will capture a disproportionate share of agent-driven TVL and transaction volume. Agents trade continuously, generate consistent protocol fees, and compound activity as more agents are deployed. Meridian makes Arbitrum the default chain for this emerging category.

---

## How Does This Benefit the Arbitrum Ecosystem?

**Immediate protocol activity.** Every Meridian agent on Arbitrum generates persistent transaction volume on Arbitrum's flagship protocols. Our single demo agent produced 127 Uniswap V3 swaps in 30 days. Multi-agent deployments multiply this across Uniswap, Aave, GMX, and other Arbitrum DeFi protocols.

**Developer acquisition pipeline.** Meridian's SDK, tutorials, and documentation feature Arbitrum as the default chain. Developers who discover Meridian discover Arbitrum first. The Strategy DSL lowers the barrier from senior DeFi developer to anyone who can write a config file, expanding the addressable developer audience building on Arbitrum.

**TVL growth.** Autonomous agents represent capital actively deployed inside Arbitrum protocols around the clock. As more developers build agents using Meridian, the aggregate capital managed by agents on Arbitrum grows, increasing protocol TVL and fee generation.

**Competitive positioning.** No other AI agent framework has native Arbitrum DeFi integration at this level. ElizaOS and GOAT do not offer Arbitrum-specific protocol connectors, portfolio-aware reasoning, or pre-execution risk management. Funding Meridian positions Arbitrum as the leading chain for autonomous DeFi agents before competitors establish elsewhere.

**Open-source infrastructure.** All code ships under Apache 2.0 / MIT. The Arbitrum ecosystem retains permanent access to every connector, agent template, and SDK component regardless of Meridian's future trajectory.

---

## Technical Approach

Meridian agents follow a continuous **Sense-Think-Act-Reflect** decision cycle on a configurable tick interval:

1. **Sense** — Read on-chain portfolio state, live prices, gas conditions, and protocol data from Arbitrum via typed viem connectors.
2. **Think** — Send context to an LLM (Claude or GPT-4) with structured output validation (Zod schemas). The model reasons about portfolio drift, evaluates trade candidates, and produces a risk-checked action plan with confidence scores and human-readable justification.
3. **Act** — Execute the plan through protocol-semantic connectors (Uniswap V3 swap router, Aave V3 lending pool, GMX position router) with slippage protection, gas optimization, and MEV protection via Flashbots.
4. **Reflect** — Compare expected vs. actual outcomes, score performance, store results in episodic memory (PostgreSQL + TimescaleDB), and update semantic memory (Qdrant) for improved future reasoning.

**Architecture stack:** TypeScript (ESM), xstate v5 (agent state machine), BullMQ + Redis (tick scheduling), viem (EVM interactions), Foundry (smart contracts), React 18 + Recharts (dashboard), drizzle-orm (database), pnpm monorepo with Turborepo.

**Risk management layer:** Every transaction passes pre-flight validation — position size limits, portfolio exposure checks, gas cost analysis, slippage bounds, contract approval verification, daily loss limits, and pre-execution simulation. Circuit breakers halt trading if anomalies are detected.

**Smart contracts (Solidity, Foundry):** AgentRegistry (on-chain agent identity and staking), PaymentEscrow (agent-to-agent payment settlement), StrategyVault (ERC-4626 tokenized strategy vaults), MeridianGovernance (OpenZeppelin Governor for protocol decisions).

---

## Milestones and Timeline

### Trailblazer ($10K) — 4 Weeks

| Milestone | Week | Deliverable | Evidence | Payment |
|-----------|------|-------------|----------|---------|
| 1 | 2 | Arbitrum chain connector deployed, testnet agent running, GitHub repo public | npm package, Arbiscan txns, GitHub commits | 50% ($5K) |
| 2 | 4 | Developer tutorial published, video live, 100+ testnet transactions | Published tutorial, demo video, Arbiscan verification | 50% ($5K) |

### LTIPP ($75K-$150K) — 3 Months

| Milestone | Month | Deliverable | Evidence | Payment |
|-----------|-------|-------------|----------|---------|
| 1 | 1 | SDK v0.1 + 3 Arbitrum connectors (Uniswap V3, Aave V3, GMX) + reference agent live on testnet | Public GitHub, verified testnet contracts, demo walkthrough | 30% |
| 2 | 2 | Multi-agent orchestration + Strategy DSL + 3 example agents + backtesting with Arbitrum data + 3 agent templates | 4-agent demo video, DSL spec, backtest reports, 100+ testnet txns | 40% |
| 3 | 3 | SDK v1.0 + full docs + community launch + ecosystem impact report | npm package, docs site, tutorial series, impact dashboard | 30% |

All milestones are independently valuable. Payment is gated on publicly verifiable deliverables. If a milestone is not met, subsequent disbursement is held until remediation.

---

## Team

Our core team of 4-6 contributors brings experience across DeFi protocol engineering, distributed systems, smart contract development, and applied machine learning.

- **Core Engineering** — Senior TypeScript and infrastructure engineers with contributions to open-source DeFi projects and blockchain tooling. Built the full Meridian runtime, LLM integration layer, chain connectors, and strategy engine.
- **Smart Contract Engineering** — Solidity developers with audit preparation experience. Built and tested AgentRegistry, PaymentEscrow, StrategyVault (ERC-4626), and MeridianGovernance contracts using Foundry.
- **Developer Experience** — Technical writers responsible for SDK documentation, developer onboarding materials, tutorials, and community engagement.
- **Advisors** — Domain experts in quantitative finance, protocol architecture, and blockchain ecosystem development.

The team is scaling to 8-10 contributors by Phase 4, with grant funding accelerating Arbitrum-specific development hiring.

---

## Budget Breakdown

### Trailblazer ($10K)

| Line Item | Amount | Description |
|-----------|--------|-------------|
| Arbitrum rebalancing agent (production) | $3,500 | Production polish, configurable parameters, deploy-ready packaging |
| Arbitrum chain connector (npm) | $3,000 | Typed Uniswap V3 connector, published as @meridian/connector-arbitrum |
| Developer tutorial + video | $2,000 | Step-by-step guide, 10-min video walkthrough, docs publication |
| Infrastructure | $1,500 | RPC nodes, testnet gas, hosting, CI/CD |

### LTIPP ($100K target)

| Line Item | Amount | Description |
|-----------|--------|-------------|
| SDK development | $25,000 | Full SDK with Arbitrum as default chain in all examples |
| Protocol connectors | $20,000 | Uniswap V3, Aave V3, GMX on Arbitrum — typed, protocol-aware |
| Multi-agent orchestration | $20,000 | Agent-to-agent communication, task delegation, on-chain settlement |
| Strategy DSL + backtesting | $15,000 | Declarative strategy language, Arbitrum historical data backtesting |
| Agent templates | $8,000 | 3 Arbitrum-specific templates (Uniswap LP, Aave yield, GMX hedging) |
| Documentation + tutorials | $5,000 | API reference, 5+ tutorials, 10+ runnable examples |
| Infrastructure | $5,000 | RPC nodes, hosting, CI/CD, monitoring |
| Community + reporting | $2,000 | Ecosystem impact reports, developer outreach |

---

## Demo / Proof Links

| Resource | Link |
|----------|------|
| **GitHub Repository** | github.com/meridian-agents/meridian |
| **Testnet Transactions** | Arbiscan — 127 autonomous Uniswap V3 swaps on Arbitrum Sepolia |
| **Demo Video** | 3-minute Loom showing live Sense-Think-Act-Reflect cycle with on-chain execution |
| **Documentation** | docs.meridianagents.xyz |
| **Website** | meridianagents.xyz |
| **Test Suite** | 208/208 tests passing across 12 test files |

---

## Competitive Advantage on Arbitrum

**We are the only framework with a working agent on Arbitrum.** ElizaOS is a social agent personality framework — blockchain is one of 90+ plugin categories, and it has no native Arbitrum DeFi connectors. GOAT provides a library of 200+ stateless action plugins without portfolio awareness, risk management, or Arbitrum-specific integrations. Neither framework has executed a single autonomous DeFi trade on Arbitrum.

**Meridian is DeFi-native, not DeFi-adjacent.** Our architecture was designed from the ground up for financial reasoning. Every agent maintains persistent portfolio state, evaluates risk before every transaction, and produces auditable reasoning traces. This is not an LLM wrapper with a swap function — it is autonomous financial infrastructure.

**Protocol-semantic connectors, not raw contract calls.** Our Arbitrum connectors understand Uniswap V3 liquidity math, Aave V3 collateral factors, and GMX position mechanics natively. Developers interact with DeFi concepts (add liquidity, optimize yield, hedge exposure), not low-level ABI encodings.

**Proven on Arbitrum.** 127 autonomous rebalances. 99.2% success rate. $8.50 total gas over 30 days. 99.9% uptime. Zero human intervention. These are not projections — they are verified on-chain results that any reviewer can confirm on Arbiscan.

**Arbitrum's gas economics make this viable.** Autonomous agents need low transaction costs to operate profitably. Our 30-day demo cost $8.50 on Arbitrum — the same workload on Ethereum L1 would exceed $500. Arbitrum is the natural home for AI agent infrastructure, and Meridian is building that home.

---

## Additional Notes

- All deliverables are open-source under Apache 2.0 / MIT
- Meridian has no token and no plans for a token launch during the grant period
- Grant funds are used exclusively for engineering, infrastructure, and developer content — no marketing spend, no token incentives
- We are available for technical review calls with the Arbitrum Foundation at any point in the evaluation process
- Monthly ecosystem impact reports will be published to the Arbitrum governance forum for full transparency
