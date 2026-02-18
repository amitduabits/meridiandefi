# Meridian Twitter Strategy

**Handle:** @MeridianAgents
**GitHub:** https://github.com/amitduabits/meridiandefi
**Sites:** meridianagents.xyz / meridianai.ai

---

## 1. Launch Thread (10 tweets)

### Tweet 1 — Hook

> I built an AI agent that executed 100+ autonomous DeFi trades while I slept.
>
> No buttons. No alerts. No approvals.
>
> Here's what happened

### Tweet 2 — The Problem

> DeFi is a full-time job.
>
> You're watching dashboards at 3am. Manually rotating yield. Missing arb windows because you were eating lunch.
>
> The entire point of programmable money was to NOT do this. But every "bot" out there still needs you babysitting it.

### Tweet 3 — The Solution

> So I built Meridian — an open-source framework for autonomous DeFi agents.
>
> Not a bot. Not a script. An agent with a decision loop:
>
> Sense (read chain state) -> Think (LLM reasoning) -> Act (execute tx) -> Reflect (learn from outcome)
>
> Every 30 seconds. Completely autonomous.

### Tweet 4 — Live Demo

> Here's what happened on Arbitrum Sepolia:
>
> - Agent read on-chain balances via viem
> - Computed portfolio drift against target allocations
> - Claude reasoned about whether to rebalance
> - Executed swaps through Uniswap V3
> - Logged every decision with full reasoning chain
>
> 100+ trades. Zero human intervention.

### Tweet 5 — Architecture

> Under the hood:
>
> ```
> xstate v5 state machine
>    -> BullMQ tick scheduler
>    -> LLM reasoning (Claude/GPT-4o)
>    -> viem chain execution
>    -> Circuit breaker protection
> ```
>
> Every transaction passes 7 risk checks before execution. Position size, exposure, gas, slippage, daily loss limits, simulation.
>
> If any check fails, the agent holds.

### Tweet 6 — How It's Different

> Looked at every agent framework out there before building this:
>
> - ElizaOS: Built for social agents. Twitter bots, Discord bots. Not DeFi-native.
> - GOAT: Stateless tool calls. No memory, no lifecycle, no risk management.
> - Virtuals: Token-first. Framework is an afterthought.
>
> Meridian is DeFi-first. Protocol-aware connectors that understand Uniswap V3 concentrated liquidity, not just generic "swap" wrappers.

### Tweet 7 — Multi-Chain

> Chain connectors for EVM (viem) and Solana (@solana/web3.js).
>
> Protocol adapters: Uniswap V3, Aave V3, Jupiter, Curve, Lido.
>
> Each adapter implements a standard interface — swap, addLiquidity, borrow, stake, bridge — so agents work across protocols without rewriting logic.
>
> Add a new chain in one file.

### Tweet 8 — Agent Collaboration

> One agent is useful. Multiple agents coordinating is powerful.
>
> Our multi-agent demo: 3 agents manage a portfolio together.
>
> 1. Analyst scans markets, emits trade signals
> 2. Risk Manager evaluates each signal against limits
> 3. Executor plans and executes approved trades
>
> They communicate via libp2p. Discover each other via DHT. Payments between agents settled via on-chain escrow (ERC-20, Solidity).

### Tweet 9 — Open Source

> Full TypeScript SDK. 208 tests passing. 4 Solidity contracts (Foundry). React dashboard. tRPC server. Strategy DSL with backtesting.
>
> MIT license. Monorepo. pnpm + Turborepo.
>
> Not a whitepaper. Not a pitch deck. Working code.
>
> github.com/amitduabits/meridiandefi

### Tweet 10 — CTA

> If you're building autonomous agents for DeFi — or want to — this is the foundation.
>
> Star the repo: github.com/amitduabits/meridiandefi
>
> Follow @MeridianAgents for build updates.
>
> DM me if you want to build on this. Looking for early contributors who care about this space.

---

## 2. Build-in-Public Tweets (10 standalone)

### BIP 1 — Agent Runtime

> The agent runtime is a tick-based event loop built on xstate v5.
>
> Every tick: Sense -> Think -> Act -> Reflect
>
> The state machine handles the lifecycle:
> ```
> IDLE -> SENSING -> THINKING -> ACTING -> REFLECTING -> IDLE
> ERROR -> COOLDOWN -> IDLE
> ```
>
> No polling hacks. No cron jobs. Proper state management with deterministic transitions.
>
> Building @MeridianAgents in the open.

### BIP 2 — Transaction Simulation

> Every transaction gets simulated before execution.
>
> The risk module runs 7 independent pre-flight checks:
>
> 1. Position size vs limit
> 2. Portfolio exposure after trade
> 3. Gas cost as % of trade value
> 4. Estimated slippage vs tolerance
> 5. Daily loss accumulation
> 6. Trade count limit
> 7. Open position limit
>
> Each check produces a risk score. If the composite score is too high, the agent holds. No exceptions.

### BIP 3 — Protocol-Aware Connectors

> Most agent frameworks treat DeFi as a black box. "Call this contract with these params."
>
> Meridian connectors understand protocols.
>
> The Uniswap V3 adapter knows about concentrated liquidity ranges, tick spacing, and fee tiers. It doesn't just swap — it can add liquidity to a specific price range.
>
> ```typescript
> interface IDeFiConnector {
>   swap(): Promise<TxResult>
>   addLiquidity(): Promise<TxResult>
>   removeLiquidity(): Promise<TxResult>
>   borrow(): Promise<TxResult>
>   repay(): Promise<TxResult>
>   stake(): Promise<TxResult>
>   bridge(): Promise<TxResult>
>   simulate(): Promise<SimulationResult>
> }
> ```
>
> Every protocol adapter implements this. Agents are protocol-agnostic.

### BIP 4 — LLM Reasoning with Structured Output

> Agents don't just call an LLM and hope for the best.
>
> Every LLM response is parsed through a Zod schema:
>
> ```typescript
> const TradeDecisionSchema = z.object({
>   action: z.enum(["SWAP", "HOLD", "REBALANCE"]),
>   params: z.record(z.unknown()),
>   confidence: z.number().min(0).max(1),
>   reasoning: z.string(),
> });
> ```
>
> If the LLM returns garbage, the schema rejects it. The agent holds instead of executing a malformed trade.
>
> Claude primary. GPT-4o fallback. Ollama for local signals.

### BIP 5 — 100 Trades Milestone

> Hit 100 autonomous trades on Arbitrum Sepolia.
>
> The rebalancer agent ran for hours. Read on-chain balances. Computed drift. Reasoned with Claude about whether to rebalance. Executed swaps through Uniswap V3.
>
> Every trade has a full decision log: what the agent saw, what it thought, what it did, and why.
>
> Not a single manual approval.
>
> Next: multi-chain execution.

### BIP 6 — Strategy DSL

> Define agent behavior in 10 lines, not 1000.
>
> ```typescript
> const strategy = builder.fromCode({
>   triggers: [{
>     type: "PORTFOLIO_DRIFT",
>     params: { threshold: 0.05, tokens: ["ETH", "USDC", "WBTC"] }
>   }],
>   actions: [{
>     type: "REBALANCE",
>     params: { protocol: "uniswap-v3" },
>     chainId: 42161,
>   }],
>   constraints: {
>     maxPositionPct: 50,
>     stopLossPct: -10,
>     maxDailyTrades: 20,
>   }
> });
> ```
>
> Triggers: price thresholds, RSI signals, time intervals, portfolio drift, gas conditions.
> Actions: swap, add liquidity, borrow, stake, bridge, rebalance.
> Constraints: enforced by the risk module. Not suggestions — hard limits.

### BIP 7 — Circuit Breakers

> Your autonomous agent needs a kill switch.
>
> Meridian has 6 circuit breaker types:
>
> - PORTFOLIO_DRAWDOWN (30 min cooldown)
> - FLASH_CRASH (15 min)
> - GAS_SPIKE (5 min)
> - RPC_FAILURE (2 min)
> - ORACLE_STALE (5 min)
> - CONTRACT_ANOMALY (1 hour)
>
> ```
> CLOSED --(trip)--> OPEN --(cooldown)--> HALF_OPEN --(probes pass)--> CLOSED
> ```
>
> When a breaker trips, ALL agent actions are vetoed instantly. Risk score = 100. No trades until the breaker fully resets through successful probes.
>
> Borrowed this pattern from distributed systems. Works perfectly for DeFi.

### BIP 8 — Agent-to-Agent Payment Escrow

> Agents need to pay each other.
>
> Built a Solidity escrow contract (PaymentEscrow.sol):
>
> - Client agent creates escrow with ERC-20 deposit
> - Provider agent completes the task
> - Client releases payment, or provider claims after deadline
> - Dispute resolution via arbiter with configurable fee split
>
> ```
> Created -> Released (by client)
>         -> Claimed (by provider, after deadline)
>         -> Disputed -> Settled (by arbiter)
> ```
>
> On-chain. Trustless. Built for agent economies.

### BIP 9 — Dashboard Demo

> Built a real-time monitoring dashboard for autonomous agents.
>
> React 18 + Vite + Tailwind v4 + Recharts + tRPC
>
> Pages:
> - Portfolio: live allocation, equity curve, drift tracking
> - Agents: status, cycle count, state machine visualization
> - Transactions: every trade with reasoning chain
> - Risk: circuit breaker status, exposure heat map
> - Health: system metrics, RPC latency, LLM cost tracking
>
> Auth: Sign-In With Ethereum (SIWE). Connect wallet, verify signature, see your agents.
>
> Not a mock. Wired to the tRPC server with WebSocket subscriptions.

### BIP 10 — SDK Developer Experience

> Create an autonomous DeFi agent in 5 lines of TypeScript:
>
> ```typescript
> import { Meridian } from "@meridian/sdk";
>
> const meridian = new Meridian();
> const agent = meridian.createAgent({
>   name: "My DeFi Agent",
>   capabilities: ["SWAP", "PORTFOLIO_MANAGEMENT"],
>   chains: [42161],
> }, { eventBus, sense, think, act, memory });
>
> agent.setStrategy(strategy);
> await agent.start();
> ```
>
> Plug in your own sense/think/act/memory providers. Or use the built-in ones.
>
> Claude for reasoning. viem for chain execution. Redis for hot state. Postgres for history. Qdrant for semantic memory.
>
> npm install @meridian/sdk

---

## 3. Reply Templates

### Template 1 — "How is this different from ElizaOS?"

> Good question. Different design goals entirely.
>
> ElizaOS is built for social agents — Twitter bots, Discord bots, character-driven interactions. Great at that.
>
> Meridian is built for DeFi execution. The agent has a tick-based decision loop (Sense -> Think -> Act -> Reflect), protocol-aware chain connectors, 7-check risk validation on every transaction, circuit breakers, and a strategy DSL.
>
> ElizaOS doesn't have pre-flight transaction simulation. Meridian doesn't have Twitter integration.
>
> Different tools for different problems.

### Template 2 — "Does it have a token?"

> No token. No plans for one right now.
>
> The governance contracts are built (full OpenZeppelin Governor with timelock), so if the community wants one later, the infrastructure exists. But we're focused on making the framework useful first.
>
> The agent registry is an ERC-721 — agents get an on-chain identity for capability discovery and reputation. That's the only on-chain identity layer.
>
> Working code > tokenomics.

### Template 3 — "Isn't AI in DeFi dangerous?"

> It can be. That's why risk management isn't optional in Meridian — it has veto power over every action.
>
> Every transaction passes 7 pre-flight checks. Circuit breakers trip automatically on drawdown, flash crashes, gas spikes, oracle failures.
>
> The strategy engine enforces hard limits: max position size, daily loss caps, slippage tolerance. These aren't LLM suggestions — they're deterministic checks. No LLM calls, no I/O, same input = same output.
>
> The LLM decides *what* to do. The risk module decides *if* it's allowed.

### Template 4 — "What chains?"

> EVM chains via viem (Ethereum, Arbitrum, Base, Optimism, Polygon — any EVM).
> Solana via @solana/web3.js v2 + Anchor.
>
> Protocol adapters currently: Uniswap V3, Aave V3, Jupiter, Curve, Lido.
>
> The chain connector interface is standardized — swap, addLiquidity, borrow, stake, bridge — so adding a new chain or protocol is one adapter file.
>
> Live demo runs on Arbitrum Sepolia. Mainnet-ready architecture.

### Template 5 — "How do I build with it?"

> Quickest path:
>
> ```bash
> git clone https://github.com/amitduabits/meridiandefi
> cd meridiandefi && pnpm install
> pnpm turbo build
> ```
>
> Run the rebalancer demo:
> ```bash
> cp examples/defi-rebalancer/.env.example .env
> # Add your Arbitrum Sepolia RPC + Anthropic key
> pnpm --filter defi-rebalancer start
> ```
>
> The SDK gives you primitives: Agent, EventBus, StrategyBuilder, RiskManager, LLMGateway, chain connectors.
>
> Plug in your own sense/think/act providers, or use the built-ins. Full docs at the repo.

### Template 6 — "What can agents actually do?"

> Today, with working code:
>
> - Autonomous portfolio rebalancing across tokens on any EVM chain
> - Multi-agent collaboration: analyst + risk manager + executor as a team
> - LLM-driven trade reasoning with structured Zod output parsing
> - Backtesting strategies against historical OHLCV data
> - On-chain agent registration (ERC-721) with capability discovery
> - Payment escrow between agents (Solidity, ERC-20)
> - Strategy vaults (ERC-4626) where depositors pool capital and agents execute
>
> Planned: cross-chain arbitrage, liquidation protection, yield optimization across lending protocols, MEV-aware execution via Flashbots.

---

## 4. Pinned Tweet

> Meridian: open-source framework for autonomous DeFi agents.
>
> Sense -> Think -> Act -> Reflect. Every chain, every protocol.
>
> 100+ live trades on Arbitrum. xstate v5 runtime. LLM reasoning. 7-check risk validation. Circuit breakers. Strategy DSL.
>
> MIT licensed. TypeScript SDK.
>
> github.com/amitduabits/meridiandefi

---

## 5. Posting Strategy (3-Week Calendar)

### Week 1 — Launch (Days 1-7)

| Day | Content | Time (UTC) | Notes |
|-----|---------|------------|-------|
| Mon | **Launch thread** (10 tweets) | 15:00 | Pin tweet #1. Quote-tweet the thread from main account. |
| Tue | BIP 1: Agent runtime tick loop | 14:00 | Include state machine diagram |
| Wed | BIP 2: Transaction simulation | 15:00 | Emphasize risk-first approach |
| Thu | BIP 3: Protocol-aware connectors | 14:00 | Code snippet of IDeFiConnector |
| Fri | BIP 4: LLM structured output | 15:00 | Show Zod schema, contrast with raw LLM calls |
| Sat | BIP 5: 100 trades milestone | 13:00 | Include screenshot/logs from testnet |
| Sun | BIP 6: Strategy DSL | 14:00 | "10 lines not 1000" — strong hook |

**Daily actions during Week 1:**
- Reply to 5-10 tweets in AI/DeFi conversations (don't shill — add value, mention Meridian only when relevant)
- Engage with anyone who interacts with the launch thread
- DM 3-5 builders who show interest
- Post 1-2 replies using the templates when relevant questions come up organically

### Week 2 — Depth (Days 8-14)

| Day | Content | Time (UTC) | Notes |
|-----|---------|------------|-------|
| Tue | BIP 7: Circuit breakers | 14:00 | "Your AI agent needs a kill switch" |
| Thu | BIP 8: Agent-to-agent escrow | 15:00 | Solidity code snippet |
| Sat | BIP 9: Dashboard demo | 13:00 | Include screenshot or short video |

**Daily actions during Week 2:**
- Engage in 3-5 AI agent or DeFi infrastructure threads daily
- Reply to "what agent framework should I use" questions with Template 1 framing
- Quote-tweet interesting DeFi or AI agent projects with genuine commentary
- Share one "micro-insight" per day as a standalone reply in a relevant thread (e.g., "We found that circuit breakers from distributed systems map perfectly to DeFi risk — here's why")

### Week 3+ — Cadence (Ongoing)

| Schedule | Content |
|----------|---------|
| Monday | Technical deep-dive or build update |
| Wednesday | Engagement / quote-tweet / reply thread |
| Friday | Demo, milestone, or community highlight |

**Ongoing actions:**
- 3 tweets per week minimum
- Reply to relevant threads daily (10 min/day)
- Engage with everyone who replies to Meridian content
- Share GitHub activity: PRs merged, issues closed, contributor highlights

### Target Accounts to Engage With

**AI Agent Ecosystem:**
- @shawmakesmagic (ElizaOS creator — respectful competitive framing)
- @0xKofi (DeFi data, agent ecosystem tracking)
- @ai16zdao (AI agent ecosystem fund)
- @virtikitten / @Virtuals_IO (Virtuals — complementary, not combative)
- @ABORTEDJEET (GOAT framework discussions)

**DeFi Infrastructure:**
- @haabordi (Uniswap-adjacent, DeFi infra)
- @euler_mab / Euler Finance (lending protocol integration opportunity)
- @aabordi (Arbitrum DeFi discussions)
- @arbitrum (Arbitrum ecosystem — testnet demo runs here)
- @AaveAave (Aave — protocol adapter exists)

**Builder/Dev Community:**
- @t3dotgg (TypeScript ecosystem, build-in-public culture)
- @maabordi (dev tooling discussions)
- @stabordi (open source DeFi discussions)
- People tweeting about xstate, viem, tRPC, Foundry — our exact stack

**Crypto AI Thought Leaders:**
- People discussing autonomous agents, on-chain AI, agent economies
- Search: "AI agent DeFi", "autonomous trading", "agent framework", "on-chain AI"
- Crypto AI newsletters and curators

### Content Principles

1. **Builder voice, not marketer voice.** "I built this" > "We're excited to announce." Show the terminal. Show the code. Show the logs.

2. **Technical but accessible.** A senior dev should learn something. A DeFi user should understand the value. Lead with the "what it does" then show "how it works."

3. **Respect the competition.** Never trash other frameworks. Different tools for different problems. Meridian is DeFi-first — that's the positioning.

4. **Show, don't tell.** Code snippets > adjectives. Testnet tx hashes > promises. Dashboard screenshots > feature lists.

5. **Engage genuinely.** Reply to interesting threads even when Meridian isn't relevant. Build reputation as someone who knows DeFi infra deeply, not just someone promoting a project.

6. **No hype language.** No "revolutionary." No "game-changing." No "the future of." Let the work speak. If someone calls it that, retweet them.

### Metrics to Track (Weekly)

| Metric | Week 1 Target | Week 2 Target | Week 3+ Target |
|--------|---------------|---------------|----------------|
| Followers | +100-200 | +50-100 | +30-50/week |
| Launch thread impressions | 10k+ | — | — |
| GitHub stars | +50-100 | +20-30 | +10-20/week |
| DMs from builders | 5-10 | 3-5 | 2-3/week |
| Replies/engagements per tweet | 5-10 | 3-5 | 3-5 |

### Hashtags (Use Sparingly)

Use 0-1 per tweet. Never more than 2. These perform best in crypto/dev Twitter:

- #BuildInPublic (for build updates)
- #DeFi (for protocol-related content)
- #OpenSource (for repo announcements)

Avoid: #AI #Web3 #Crypto (too broad, low signal).
