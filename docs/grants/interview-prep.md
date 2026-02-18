# Meridian Grant Interview Prep — Master Guide

**Purpose:** Comprehensive preparation for live grant interviews, panel calls, and Q&A sessions across all target ecosystems.

**Last Updated:** February 2026

---

## Section 1: Likely Questions with Best Answers

### Q1. "Tell us about your project in 2 minutes."

Meridian is the first AI agent framework built from the ground up for decentralized finance. While general-purpose agent tools treat blockchain as one plugin among many, Meridian's entire architecture is DeFi-native. Every agent maintains a live portfolio context, reasons about positions and risk in real time, and executes cross-chain strategies through protocol-semantic connectors that understand liquidity math, collateral factors, and slippage natively.

The core innovation is our Sense-Think-Act-Reflect decision cycle. Agents continuously read on-chain state, send structured context to an LLM for reasoning, execute through typed protocol connectors with pre-flight risk validation, then evaluate outcomes and store them in memory so future decisions improve. This cycle runs on a configurable tick interval — our reference agent ticks every five minutes.

We have working code today. Our rebalancing agent has executed over 100 autonomous trades on Arbitrum Sepolia through Uniswap V3 — maintaining less than 2% portfolio drift over 30 days with 99.9% uptime. The entire decision cycle completes in under 3 seconds. The framework is open source, the SDK is published, and we have 208 passing tests across 12 test files.

Beyond single agents, Meridian supports multi-agent orchestration — agents can discover each other via libp2p, delegate tasks, share signals, and settle payments on-chain. We've demonstrated a 4-agent team where a portfolio manager delegates to a yield scout, risk monitor, and execution specialist. The architecture is designed to scale from one agent managing a personal portfolio to hundreds of specialized agents forming an autonomous DeFi economy.

---

### Q2. "What makes this different from existing AI agent frameworks?"

There are four categories of projects in this space, and we sit in a fundamentally different lane:

**ElizaOS** is social-first. It was built for Twitter bots and Discord interactions that happen to have a blockchain wallet. DeFi is a plugin, not the architecture. There's no portfolio context, no risk management pipeline, no protocol-semantic connectors. An ElizaOS agent can tweet about DeFi — a Meridian agent *does* DeFi.

**GOAT (Great Onchain Agent Toolkit)** provides stateless tool calls — individual functions like "swap token A for token B." There's no persistent memory, no multi-step reasoning, no portfolio awareness. Every call starts from zero. Meridian agents maintain continuous state across decision cycles, learning from past outcomes.

**Virtuals Protocol** is a token launchpad for agent characters. The focus is on creating tradeable agent tokens, not on building agents that actually execute sophisticated financial strategies. Meridian is infrastructure, not speculation.

**What makes Meridian different is that DeFi is the entire point, not an afterthought.** Our architecture was designed around the specific requirements of autonomous finance: risk pre-flight validation on every transaction, circuit breakers that halt trading when anomalies are detected, 3-tier memory (hot Redis state, warm PostgreSQL history, persistent Qdrant vector memory), MEV protection through Flashbots, and protocol connectors that understand the semantics of lending, liquidity provision, and perpetuals — not just raw contract calls.

The simplest way to frame it: Meridian is the financial brain. Others are the social mouth.

---

### Q3. "Why build on [CHAIN] specifically?"

> **Note:** Customize this answer per chain. Use the chain-specific cheat sheets (Files 2-6) for tailored framing.

**Template structure:**

1. **Open with genuine ecosystem alignment** — "[CHAIN] is uniquely positioned for autonomous DeFi agents because [SPECIFIC_TECHNICAL_REASON]."
2. **Name a concrete technical advantage** — transaction speed, cost structure, unique protocol landscape, specific developer tooling
3. **Reference their strategic priorities** — show you've read their grant program documentation and ecosystem roadmap
4. **Explain what you'll build specifically on their chain** — not generic, but protocol-specific agents targeting their flagship DeFi
5. **Close with mutual value** — "Meridian brings persistent, intelligent activity to [CHAIN]'s protocols — not one-time transactions, but 24/7 autonomous agents generating swap fees, lending interest, and bridge volume around the clock."

**Key principle:** Never say "all chains are equal" or "we're building everywhere." Each chain should feel like a deliberate, strategic choice. Reference their specific DEXs, lending protocols, and unique DeFi opportunities by name.

---

### Q4. "What is your team's background?"

> **[TEAM_PLACEHOLDER]** — Customize with actual team details before each interview.

**Recommended structure:**

- **Lead / Architect:** [Name] — [X] years building [relevant domain]. Previously [notable project/company]. Responsible for core runtime, agent state machine, and SDK design.
- **DeFi Engineering:** [Name] — Deep experience with [specific protocols]. Built [specific thing]. Owns chain connectors, protocol adapters, and strategy engine.
- **Smart Contracts:** [Name] — Solidity engineer with [experience]. Contributed to [relevant projects]. Responsible for Agent Registry, Strategy Vault, and Governance contracts.
- **ML / AI:** [Name] — Background in [quantitative finance / ML engineering]. Built [relevant models]. Leads the ML sidecar — trend classification, volatility regime detection, and anomaly models.
- **DevRel / Community:** [Name] — [Experience]. Manages SDK documentation, developer tutorials, and community growth.
- **Advisors:** [Names] — domain experts in [quantitative finance, protocol architecture, ecosystem development].

**Framing tips:**
- Emphasize DeFi-specific experience over generic software engineering
- If team members have contributed to open-source DeFi projects, name them
- If anyone has prior grant experience (received or reviewed), mention it
- Be honest about team size (4-6 core, scaling to 8-10) — small, focused teams are an asset, not a weakness
- If asked about hiring plans, tie them to grant milestones: "Month 3 deliverables fund the expansion to 8 contributors"

---

### Q5. "Show us a demo."

**Response:** "Absolutely. Let me walk you through a live agent running on [CHAIN] testnet right now."

> **Reference the 5-minute walkthrough in Section 2 below.** If time is limited, prioritize Sections 3B-3E (the live Sense-Think-Act-Reflect cycle) — this is the money segment that proves the agent actually works.

**Pre-interview demo checklist:**
- [ ] Agent is running and will tick during the call window
- [ ] Dashboard loaded with current portfolio data
- [ ] Block explorer tab open with recent transaction history
- [ ] Terminal streaming live agent logs
- [ ] SDK code snippet ready to screen-share (the 15-line agent creation)
- [ ] Backup: pre-recorded Loom video in case of live demo failure

**If live demo has issues (the agent doesn't tick during the window):**
"The agent ticks every five minutes, so let me show you the last several cycles in the logs while we wait for the next one. [Show transaction history on block explorer.] Here are 100+ autonomous transactions — each one a complete Sense-Think-Act-Reflect cycle. And here's what the reasoning looks like. [Show a recent THINK phase log with LLM reasoning trace.]"

---

### Q6. "What are your milestones?"

**For Tier 2 grants ($50K-$150K) — 3-month timeline:**

**Month 1 — Foundation (30% disbursement)**
- Core runtime engine + 3 chain connectors deployed
- SDK v0.1 published to npm
- Reference rebalancing agent live on [CHAIN] testnet
- Evidence: Public GitHub repo, verified testnet contracts, 100+ autonomous transactions, recorded demo walkthrough

**Month 2 — Intelligence (40% disbursement)**
- Multi-agent orchestration engine operational (4-agent coordinated demo)
- Strategy DSL v1.0 with 10+ example strategies
- Backtesting engine with [CHAIN] historical data
- 3 example agents (yield rotation, LP management, risk monitoring)
- Evidence: 4-agent demo video, published DSL spec, backtest sample reports

**Month 3 — Developer Experience (30% disbursement)**
- SDK v1.0 with comprehensive API reference
- Full documentation site with 5+ tutorials
- Pre-built agent templates for [CHAIN]'s top 3 protocols
- Community launch + first ecosystem impact report
- Evidence: npm package live, documentation site, SDK install-to-agent under 10 minutes

**Key framing:** "Every milestone produces something independently valuable. If we stopped after Month 1, you'd still have a working agent, open-source connector, and public repo. But we won't stop."

---

### Q7. "How will this become self-sustaining after grant funding?"

Three revenue streams are designed into the architecture:

**1. Protocol Fees (built into smart contracts)**
- The Strategy Marketplace takes a configurable fee (0-2%) on strategy profits when developers monetize their strategies
- The Agent Registry charges a small staking fee for agent registration, creating Sybil resistance and generating protocol revenue
- These fees accrue to the Meridian treasury, governed by token holders

**2. Agent Marketplace (network effects)**
- Developers publish agent strategies, protocol connectors, and agent templates
- Revenue sharing: strategy creators earn 80-100% of subscription/performance fees
- Meridian captures platform fees on marketplace transactions
- As more agents deploy, more developers build, creating a self-reinforcing flywheel

**3. Governance and Token Utility**
- The MERIDIAN governance token manages protocol parameters, treasury allocation, and marketplace curation
- Staking requirements for agent registration create natural token demand
- Agent-to-agent payment settlement through on-chain escrow generates transaction volume

**The grant funds the 0-to-1.** The marketplace, registry, and protocol fees fund the 1-to-100. We're not asking for ongoing subsidy — we're asking for the capital to build infrastructure that generates its own economic activity.

---

### Q8. "What other grants have you applied for?"

**Be honest. Multi-chain is a strength, not a liability.**

"We're applying to multiple ecosystem grant programs because Meridian is inherently multi-chain — that's a core architectural feature, not scope creep. Each chain gets dedicated connectors, protocol adapters, custom agent types for their specific DeFi landscape, and documentation featuring their chain as the primary example.

We're targeting roughly $800K across 8 programs with a realistic expected value of $200K-$300K based on 4-6 approvals. Our priority targets include [name the 2-3 most relevant to THIS interviewer].

Each grant funds genuinely differentiated work. An Arbitrum grant funds Uniswap V3 + GMX + Aave connectors and agents optimized for those protocols. A NEAR grant funds NEAR-native intent resolution and AI-as-frontend integration. A Kadena grant funds Chainweb integration and enterprise-grade agent infrastructure.

We're transparent about this because we think it's actually what you want — an agent framework that works across the DeFi landscape makes your ecosystem more connected, not less. And our milestone-based disbursement means you only pay for delivered work on your chain."

---

### Q9. "What's your open-source strategy?"

"Everything is open source under MIT license from day one. The SDK, the runtime engine, all protocol connectors, the Strategy DSL, the dashboard, the smart contracts — all public on GitHub.

Our philosophy: open-source infrastructure creates ecosystem lock-in through adoption, not licensing. If 500 developers build agents on Meridian, the network effects make the framework more valuable than any proprietary moat ever could.

Specifically:
- **SDK and runtime:** MIT licensed, published to npm as `@meridian/sdk`
- **Smart contracts:** Open source, professionally audited, deployed on multiple chains
- **Protocol connectors:** Published as separate npm packages (`@meridian/connector-[chain]`) so any developer can use them independently
- **Strategy DSL:** Open specification, community-contributed strategies
- **Documentation:** Public docs site, tutorials, and video walkthroughs

What we monetize is the *marketplace layer on top* — strategy curation, premium agent templates, enterprise support channels, and protocol fees on marketplace transactions. The infrastructure is free. The economy built on top of it generates revenue."

---

### Q10. "How will you measure success?"

**Concrete metrics tied to grant milestones:**

| Metric | Month 1 Target | Month 3 Target | Month 6 Target |
|--------|----------------|----------------|----------------|
| Autonomous transactions on [CHAIN] | 500+ | 5,000+ | 50,000+ |
| Agents deployed (testnet + mainnet) | 3 reference agents | 20+ community agents | 100+ |
| SDK downloads (npm) | 100+ | 1,000+ | 5,000+ |
| Developer tutorial completions | 25+ | 200+ | 1,000+ |
| Protocol volume generated | $10K (testnet value) | $100K+ | $1M+ |
| GitHub stars | 100+ | 500+ | 2,000+ |
| Unique contributors | 3-5 core | 10-15 (core + community) | 30+ |
| Documentation pages | 20+ | 50+ | 100+ |

"Every one of these metrics is publicly verifiable — on-chain transactions, npm download counts, GitHub activity, and published impact reports. We commit to monthly reports throughout the grant period. You'll never have to ask how we're doing — the data will be on your dashboard."

---

## Section 2: 5-Minute Demo Walkthrough Script

> Use this for live demo during interview calls. Adjust timing based on available window.

### Minute 0-1: Architecture Overview

**Open with the architecture diagram on screen.**

"Let me start with how Meridian works at the architecture level. The framework has 8 core modules."

Walk through quickly:
1. **Agent Runtime Engine** — xstate v5 state machine managing the lifecycle: IDLE, SENSING, THINKING, ACTING, REFLECTING
2. **LLM Integration** — Claude as primary reasoning provider, GPT-4o fallback, local Ollama for real-time signals
3. **Chain Connectors** — typed, protocol-semantic. Not raw contract calls — connectors that understand liquidity math, collateral ratios, slippage
4. **Strategy Engine** — custom DSL, natural language to strategy compilation, sandboxed execution
5. **Memory** — 3 tiers: Redis (hot market state), PostgreSQL+TimescaleDB (transaction history), Qdrant (vector memory for learning)
6. **Agent Communication** — libp2p mesh, protobuf messages, on-chain payment escrow
7. **Risk Management** — pre-flight validation on every transaction: position size, exposure, gas, slippage, simulation
8. **Dashboard** — React 18 real-time monitoring with portfolio, transactions, risk, and agent health views

"The core loop is Sense-Think-Act-Reflect. Let me show you what that looks like live."

### Minute 1-2: Live Rebalancer Agent — Sense-Think-Act-Reflect

**Switch to terminal showing live agent logs.**

"This agent is running right now on Arbitrum Sepolia. It manages a 3-token portfolio — WETH, USDC, and LINK — targeting a 40/30/30 allocation."

Show the SENSE phase:
```
[SENSE] Reading portfolio state from Arbitrum Sepolia...
[SENSE] WETH: 0.85 (48.2%) | Target: 40.0% | Drift: +8.2%
[SENSE] Drift threshold exceeded. Triggering THINK phase.
```

Show the THINK phase:
```
[THINK] Sending context to Claude API...
[THINK] LLM Reasoning:
  "Portfolio WETH allocation is 48.2%, exceeding the 40% target by 8.2%.
   Recommended action: Sell 0.14 WETH -> USDC via Uniswap V3.
   Confidence: 0.92 | Risk check: PASS"
```

"This is not a hardcoded rule. Claude is reasoning about the portfolio — identifying WETH as the problem, calculating the swap amount, checking gas cost relative to trade size. Confidence: 92%. Passes risk pre-flight."

Show the ACT phase:
```
[ACT] Transaction submitted: 0x7a3f...8b2c
[ACT] Confirmed in block #48,291,037 | Gas used: 184,221
```

"Real transaction. On Arbiscan right now." [Show block explorer tab.]

Show the REFLECT phase:
```
[REFLECT] Expected: ~240.80 USDC | Actual: 239.94 USDC (0.36% slippage)
[REFLECT] New allocation: WETH 40.3% | USDC 29.8% | LINK 29.9%
[REFLECT] Outcome score: 0.95 | Stored to episodic memory.
```

"The agent evaluates its own performance, stores the outcome, and returns to idle. Twelve seconds, start to finish."

### Minute 2-3: Multi-Agent Team

**Switch to multi-agent terminal or dashboard view.**

"Now scale that up. Here are three agents working as a coordinated team."

Show:
- **Portfolio Manager** — the orchestrator, delegates tasks to specialists
- **Yield Scout** — scans lending rates across protocols, reports opportunities
- **Risk Monitor** — watches portfolio exposure, triggers alerts when limits approach

"These agents discover each other through libp2p, communicate via protobuf messages, and can settle payments on-chain through our escrow contract. The Portfolio Manager doesn't just manage a portfolio — it *hires* other agents for specialized intelligence."

Show an agent-to-agent message in the logs if possible.

### Minute 3-4: Dashboard Walkthrough

**Switch to the Meridian dashboard in browser.**

Walk through 4 views quickly:
1. **Portfolio page** — allocation pie chart, drift indicator, target vs actual
2. **Transactions page** — full history of autonomous trades with timestamps, amounts, reasoning
3. **Risk page** — circuit breaker status, position limits, exposure metrics
4. **Agents page** — agent cards showing status (IDLE/SENSING/THINKING/ACTING), uptime, last action

"Everything updates in real time via WebSocket. The dashboard isn't a mockup — it's reading live agent state."

### Minute 4-5: SDK and Strategy DSL

**Switch to code editor.**

Show the 15-line agent creation:
```typescript
import { Meridian } from '@meridian/sdk';

const meridian = new Meridian({
  chains: { arbitrum: { rpcUrl: process.env.ARB_RPC } },
  llm: { provider: 'claude', apiKey: process.env.ANTHROPIC_API_KEY },
});

const agent = meridian.createAgent({
  name: 'My Rebalancer',
  strategy: 'rebalance',
  targets: { WETH: 0.4, USDC: 0.3, LINK: 0.3 },
});

await agent.start(); // That's it.
```

"Fifteen lines. Deploy your own autonomous DeFi agent in ten minutes."

Then show the Strategy DSL:
```
strategy "Yield Rotator" {
  when yield_spread > 2% between aave and compound {
    move 50% of stablecoin_position to higher_yield
    max_gas: 0.01 ETH
    slippage: 0.5%
  }
}
```

"For developers who don't want to write TypeScript — the Strategy DSL lets them define agent behavior in a declarative language. We compile it, validate it at parse time, and execute it in a sandboxed VM."

**Close:** "That's Meridian. Working code, live testnet, open source, and ready for [CHAIN]."

---

## Section 3: Red Flags to AVOID

These are behaviors and phrases that immediately raise concerns for grant reviewers. Avoid them at all costs.

### 1. "We'll figure it out as we go."
**Why it's deadly:** Grant committees fund execution, not exploration. This signals you don't have a plan.
**Instead say:** "We've already solved the hardest technical problems. Here's our milestone-by-milestone delivery plan with verifiable evidence at each stage."

### 2. Aggressive competitor bashing.
**Why it's deadly:** Makes you look insecure. Grant reviewers talk to each other — if you trash ElizaOS in an Arbitrum call, it might get back to people who funded ElizaOS.
**Instead:** Acknowledge the space, differentiate cleanly. "They're solving a different problem. ElizaOS is excellent for social agents. We're purpose-built for financial execution."

### 3. Overselling AI capabilities.
**Why it's deadly:** DeFi grant reviewers are technical. If you claim "our AI never makes mistakes" or "the agent always generates alpha," you've lost credibility.
**Instead:** Be precise. "The agent maintained less than 2% drift over 30 days with a 99.2% success rate. When it does encounter errors, the circuit breaker halts trading and logs the anomaly for review."

### 4. "We need the money to start building."
**Why it's deadly:** Signals zero traction. The best grants go to teams with working code seeking acceleration, not teams seeking permission to begin.
**Instead:** "We've already built the core framework — 208 passing tests, live testnet agent, 100+ autonomous transactions. The grant accelerates our timeline from 12 months to 3 months and lets us dedicate resources to [CHAIN]-specific integration."

### 5. Dodging security questions.
**Why it's deadly:** DeFi means real money. If you can't articulate your security model, you're a liability.
**Instead:** Proactively address it. "Every transaction passes pre-flight validation: position size limits, portfolio exposure checks, gas cost analysis, slippage bounds, contract approval verification, daily loss limits, and simulation before execution. We have circuit breakers that halt trading when anomalies are detected. And our Tier 3 roadmap includes a professional security audit from a top-tier firm."

### 6. "All chains are equal to us."
**Why it's deadly:** Tells the grant committee you have no genuine commitment to their ecosystem. You're a mercenary.
**Instead:** Name their specific protocols, reference their recent ecosystem developments, explain why their chain's architecture is uniquely suited for your use case. Make each chain feel like a deliberate strategic choice.

### 7. Vague revenue models.
**Why it's deadly:** "We'll figure out monetization later" or "token" without specifics signals you'll be back asking for more money.
**Instead:** "Three revenue streams are built into the architecture: protocol fees on the strategy marketplace, staking requirements for the agent registry, and enterprise support tiers. The grant funds the 0-to-1. The marketplace funds the 1-to-100."

### 8. Overpromising on timelines.
**Why it's deadly:** If you say 4 weeks and deliver in 12, you've poisoned the relationship. Grant programs track grantee reliability.
**Instead:** Pad your estimates by 30%. Deliver early and you're a hero. Deliver late and you're another failed grantee.

---

## Section 4: Questions to Ask THEM

Asking smart questions demonstrates strategic thinking and genuine interest in a long-term partnership. Always prepare 2-3 from this list.

### 1. "What does the ideal grantee relationship look like for your program after the grant period ends?"
**Why it's smart:** Signals you're thinking long-term, not extracting a check and disappearing. Opens a conversation about ongoing partnership structures.

### 2. "Are there specific DeFi protocols or use cases on [CHAIN] that your ecosystem team is particularly excited about supporting with AI agent infrastructure?"
**Why it's smart:** Shows you want to align with *their* priorities, not just build what you planned anyway. The answer also gives you valuable intelligence for customizing your deliverables.

### 3. "How does your grant program measure success for infrastructure grants versus application grants? Are there specific metrics your governance body tracks?"
**Why it's smart:** Lets you tailor your impact reporting to exactly what they need to justify the investment internally. Shows you understand that grant programs have their own stakeholders.

### 4. "We've seen a lot of ecosystem activity around [SPECIFIC_RECENT_EVENT — e.g., Arbitrum Orbit chains, NEAR Intents, Kadena's AI fund]. How do you see AI agents fitting into that roadmap?"
**Why it's smart:** Proves you follow their ecosystem closely. Forces them to articulate their AI strategy, which helps you position Meridian as the answer.

### 5. "Are there other grantees building in the AI-DeFi space that you'd recommend we coordinate with to avoid duplication and maximize ecosystem impact?"
**Why it's smart:** Shows collaborative mindset. Grant programs love grantees who make the ecosystem stronger, not just their own project. The answer also maps the competitive landscape.

---

## Section 5: Handling Tough Questions

### "Your agent lost money in backtesting. How do you handle that?"

"Great question — and this is exactly why we built backtesting into the framework rather than just deploying and hoping.

First, loss is inherent to any financial strategy. Rebalancing in a trending market will underperform buy-and-hold. Delta-neutral strategies incur funding costs. The question isn't whether an agent ever loses — it's whether losses are bounded, understood, and within defined risk parameters.

Our approach has three layers:

1. **Pre-deployment:** The backtesting engine tests strategies against historical on-chain data. We publish Sharpe ratio, Sortino ratio, max drawdown, win rate, and equity curves. Developers see the risk profile before deploying any capital.

2. **Runtime risk management:** Every transaction passes pre-flight validation — position size limits, portfolio exposure caps, gas cost checks, slippage bounds, and transaction simulation. Circuit breakers automatically halt trading when daily loss limits are hit or anomalies are detected.

3. **Post-execution reflection:** The REFLECT phase evaluates every trade outcome. If an agent consistently underperforms expectations, the confidence score drops and it becomes more conservative. Memory means the agent learns from bad outcomes.

The honest framing: we're not promising alpha. We're building infrastructure that makes autonomous DeFi execution *safe, observable, and improvable*. The agent that lost 2% in a backtest with a maximum drawdown of 5% is more useful than the manual trader who panics and sells at the bottom."

---

### "How do you prevent agents from being exploited?"

"This is one of our most heavily engineered areas. There are three attack surfaces and we address each one:

**1. Transaction-level exploitation (MEV, sandwich attacks):**
- Integration with Flashbots Protect for MEV-protected transaction submission on Ethereum and Arbitrum
- Configurable slippage tolerance with hard caps — the agent won't execute if slippage exceeds bounds
- Deadline enforcement on all swaps (default: 180 seconds)
- Gas price anomaly detection — if gas spikes abnormally, the agent waits

**2. Strategy-level exploitation (adversarial market manipulation):**
- Circuit breakers that halt trading when market conditions are anomalous (sudden price moves beyond historical norms)
- Position size limits prevent any single trade from being large enough to move the market
- Daily loss limits — if cumulative losses exceed a threshold, the agent stops and alerts
- Cooldown periods after errors — the agent doesn't retry failed transactions immediately

**3. Infrastructure-level exploitation (compromised keys, malicious strategies):**
- User strategies execute in isolated-vm sandboxes — no access to the host process, filesystem, or network
- Agent wallet keys are never exposed to the LLM or strategy code — the runtime handles signing
- Contract-level approvals are scoped and revocable
- The Agent Registry on-chain requires staking, creating economic cost for Sybil attacks

No system is exploit-proof. But we've layered defenses so that exploiting a Meridian agent requires defeating multiple independent safety mechanisms simultaneously."

---

### "What if the LLM hallucinates?"

"This is the most common concern, and it's the right one. Here's our answer: the LLM never touches money directly.

**The architecture has a critical separation:** The LLM produces *structured recommendations* — a JSON object validated by Zod schemas specifying what action to take, with what parameters, and why. The LLM does NOT generate transaction bytecode, does NOT have wallet access, and does NOT execute anything.

Between the LLM recommendation and actual execution, there are four validation layers:

1. **Structured output parsing** — Zod schemas enforce that the LLM output matches the expected shape. If the LLM returns malformed JSON or missing fields, the tick is skipped.

2. **Risk pre-flight validation** — Even if the LLM recommends a valid-looking trade, the risk engine independently checks: Is the position size within limits? Does the portfolio exposure stay within bounds? Is gas cost reasonable? Does slippage exceed tolerance?

3. **Transaction simulation** — Before submitting to the network, the trade is simulated. If simulation fails or produces unexpected results, execution is blocked.

4. **Confidence thresholding** — The LLM provides a confidence score. Below the configurable threshold (default: 0.7), the agent does not act — it logs the recommendation and waits for the next tick.

So if Claude hallucinates and says 'sell everything and buy a meme token,' the structured output validator would reject it (not a valid action type), the risk engine would flag it (exceeds position limits), and simulation would fail (no liquidity). The hallucination never reaches the blockchain.

We chose this architecture specifically because we don't trust LLMs to be right every time. We trust them to be right *most* of the time, and we engineer the system so that when they're wrong, nothing bad happens."

---

### "How do you handle gas costs eating into returns?"

"This is a real concern and one we've measured carefully. Our reference agent on Arbitrum spent 0.003 ETH — roughly $8.50 — in gas over 30 days and 127 rebalances. That's about 7 cents per autonomous decision cycle.

Our approach:
- **Gas-aware reasoning:** The SENSE phase reads current gas prices. The LLM receives gas cost as context and factors it into trade decisions. If gas cost exceeds a configurable percentage of trade value (default: 0.5%), the agent waits.
- **L2-first deployment:** We recommend L2s (Arbitrum, Base, Avalanche C-Chain) for high-frequency agent strategies precisely because gas costs are negligible.
- **Batching:** For multi-token rebalances, the agent can batch multiple swaps into a single transaction through multicall.
- **Threshold tuning:** Drift thresholds are configurable. A tighter threshold means more frequent (and more expensive) rebalances. We help developers find the cost-optimal threshold for their strategy."

---

### "Why should we fund infrastructure instead of an application?"

"Because infrastructure creates applications. Every dollar you spend on a single DeFi application funds one product. Every dollar you spend on Meridian funds the *ability for hundreds of developers to build applications* on your chain.

Consider the math: if 50 developers use Meridian to build agents on [CHAIN], and each agent generates $10K/month in protocol volume, that's $500K/month in persistent, autonomous activity on your chain — from a single infrastructure grant.

We're not asking you to bet on one strategy working. We're asking you to bet on giving your developers a better toolkit. The applications will follow."

---

## Appendix: Pre-Interview Checklist

**24 hours before:**
- [ ] Review the chain-specific cheat sheet for this interview
- [ ] Check their ecosystem's latest news (governance proposals, new protocols, recent hacks)
- [ ] Confirm which grant tier/program track this interview is for
- [ ] Prepare 2-3 questions from Section 4, customized with recent ecosystem events
- [ ] Verify demo environment is running (agent, dashboard, testnet)

**1 hour before:**
- [ ] Start the agent so it has recent transaction history
- [ ] Load the dashboard in browser, verify data is fresh
- [ ] Open block explorer with recent transactions
- [ ] Open terminal with live agent logs
- [ ] Open SDK code snippet in editor
- [ ] Test screen sharing
- [ ] Have backup Loom demo video URL ready

**During the interview:**
- [ ] Lead with working code, not slides
- [ ] When asked about timelines, reference specific milestones (Section 1, Q6)
- [ ] When asked about competition, differentiate cleanly without bashing (Section 1, Q2)
- [ ] When asked about sustainability, hit all three revenue streams (Section 1, Q7)
- [ ] Ask at least one question from Section 4
- [ ] Close with: "We have working code, a clear roadmap, and milestone-based accountability. We're ready to build on [CHAIN]."

---

*Document Version: 1.0 | February 2026 | Meridian Team | Internal Use Only*
