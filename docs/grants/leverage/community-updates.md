# Community Update Templates — Post Grant Approval

> Short-form messages for Discord, Telegram, Reddit, and developer communities.
> Adjust tone per platform. Post within 48 hours of the Twitter announcement.

---

## 1. Funded Chain's Community (Discord/Telegram)

> Post in the [CHAIN_NAME] ecosystem Discord (general or grants channel, per their rules).

```
Hey [CHAIN_NAME] community,

We're excited to share that Meridian has received a grant from the [CHAIN_NAME]
Foundation to build autonomous DeFi agent infrastructure for the ecosystem.

Meridian is an open-source framework (MIT license) that lets developers build
intelligent agents that can monitor markets, manage risk, and execute DeFi
strategies autonomously. We've been building for months — 19K+ lines of code,
208 tests passing, 100+ autonomous trades executed — and now we're bringing
it natively to [CHAIN_NAME].

What we're building for [CHAIN_NAME]:
  - Native protocol adapters for [CHAIN_NAME] DeFi (swaps, lending, staking)
  - On-chain Agent Registry contract on [CHAIN_NAME]
  - Strategy Vault for transparent agent performance tracking
  - Developer templates and quickstart guides

We're looking for early feedback from [CHAIN_NAME] developers and DeFi users.
If you're interested in autonomous DeFi strategies or agent infrastructure,
we'd love to connect.

GitHub: github.com/amitduabits/meridiandefi
Twitter: @MeridianAgents

Happy to answer any questions here.
```

---

## 2. Other Chains' Communities (Positioning)

> Post in ecosystem Discords where you have pending or planned applications.
> Frame as "coming soon" — do not mention pending grant applications.

```
Sharing a project update that might interest [TARGET_CHAIN] builders:

Meridian — an open-source framework for autonomous DeFi agents — just received
a grant from the [CHAIN_NAME] Foundation to develop core agent infrastructure.

While our first funded integration is on [CHAIN_NAME], Meridian is multi-chain
by design. We already have protocol adapters for Uniswap V3, Aave V3, Jupiter,
Curve, and Lido, and our architecture supports any EVM chain and Solana.

We're planning [TARGET_CHAIN] integration as part of our roadmap and would love
to hear from developers here about which protocols and use cases matter most
to the [TARGET_CHAIN] community.

If you're interested in DeFi automation, agent frameworks, or want to contribute,
check us out:

GitHub: github.com/amitduabits/meridiandefi
Twitter: @MeridianAgents

Feedback and ideas welcome.
```

---

## 3. Crypto Twitter Engagement

> Standalone tweets and reply templates for engaging with the broader community.

### Standalone Tweet (not part of announcement thread)

```
Milestone unlocked: Meridian is now funded by the [CHAIN_NAME] Foundation.

19K lines of code. 208 tests. 100+ autonomous trades. Open source.

Building the agent framework DeFi deserves.

github.com/amitduabits/meridiandefi
```

### Reply Template (when someone asks "what is Meridian?")

```
Meridian is an open-source framework for building autonomous DeFi agents.

Agents follow a Sense > Think > Act > Reflect loop — monitoring markets,
reasoning about opportunities, executing trades, and learning from outcomes.

Built-in risk management, multi-chain support, and strategy backtesting.

Recently funded by [CHAIN_NAME] Foundation. MIT licensed.
```

### Quote Tweet Template (when sharing foundation's content)

```
Proud to be part of the [CHAIN_NAME] ecosystem. We're using this grant to
bring production-grade agent infrastructure to [CHAIN_NAME] DeFi.

Autonomous agents that manage risk, execute strategies, and operate
transparently — all open source.
```

---

## 4. Developer Communities

### Reddit (r/ethdev, r/cryptocurrency, r/defi)

> Title format for a text post. Follow subreddit rules — no overt shilling.

```
Title: Open-source framework for autonomous DeFi agents — just received a
foundation grant, sharing our approach

---

We've been building Meridian, an open-source (MIT) framework for creating
autonomous agents that operate in DeFi. We recently received a grant from
the [CHAIN_NAME] Foundation, and wanted to share what we've built with the
developer community.

**The problem:** Building reliable DeFi automation is hard. You need market
monitoring, risk management, transaction simulation, MEV protection, and
strategy logic — all working together. Most teams end up building custom
bots from scratch every time.

**Our approach:** Meridian provides a modular framework where agents follow
a state machine lifecycle (Sense > Think > Act > Reflect). The core modules:

- Agent Runtime Engine (xstate v5 state machine, tick-based scheduling)
- Chain Connectors (viem for EVM, @solana/web3.js for Solana)
- Strategy Engine (custom DSL + natural language strategy definition)
- Risk Management (pre-flight validation, circuit breakers, position limits)
- Memory System (Redis hot cache, PostgreSQL history, vector DB for learning)
- Monitoring Dashboard (React, real-time agent visibility)

**Tech stack:** TypeScript + Solidity + Python. 19K+ LOC, 208 tests,
100+ autonomous trades executed.

**What we'd love feedback on:**
- Are there DeFi use cases you think agents should handle but current
  tools don't support?
- What risk management features matter most to you?
- Would you use a strategy DSL, or prefer pure TypeScript for strategy logic?

Repo: github.com/amitduabits/meridiandefi

Happy to answer technical questions or discuss the architecture.
```

### HackerNews

> Short, technical, no hype. HN readers will visit the repo.

```
Title: Show HN: Meridian – Open-source framework for autonomous DeFi agents (TypeScript/Solidity)

---

Meridian is a framework for building autonomous agents that operate across
DeFi protocols. Recently received a foundation grant; sharing for technical
feedback.

Architecture: agents run a state machine (xstate v5) with a
Sense > Think > Act > Reflect cycle. Chain connectors abstract protocol
differences (Uniswap, Aave, Jupiter, etc.). Risk management runs pre-flight
checks on every transaction. Strategy engine supports a custom DSL and
natural language definition.

Stack: TypeScript (runtime), Solidity (contracts), Python (ML sidecar).
19K LOC, 208 tests, MIT licensed.

Repo: github.com/amitduabits/meridiandefi

Looking for feedback on the architecture and DeFi-specific agent patterns.
```

### Dev.to

> Slightly longer, more narrative, can include code snippets.

```
Title: Building Autonomous DeFi Agents: Our Open-Source Framework (Now Foundation-Funded)

---

We just received a grant from the [CHAIN_NAME] Foundation to continue building
Meridian — an open-source framework for autonomous DeFi agents. Here's a look
at what we've built and where we're headed.

[Include 2-3 paragraphs from the blog post, adapted for a developer audience]

[Include a code snippet showing agent configuration or strategy definition]

The full source is at github.com/amitduabits/meridiandefi. We'd love
contributions, feedback, and ideas from the dev community.

Tags: #defi #typescript #opensource #blockchain #agents
```

---

## Posting Schedule

| Platform | Timing | Notes |
|----------|--------|-------|
| Funded chain's Discord | Day 1 (same day as Twitter thread) | Follow their posting guidelines |
| Other chains' Discords | Day 2-3 | Space out, one per day |
| Reddit (r/ethdev) | Day 2 | Post in the morning, respond to comments promptly |
| Reddit (r/defi) | Day 3 | Different angle than r/ethdev |
| HackerNews | Day 3-4 | Post at 9-10am EST for visibility |
| Dev.to | Day 5-7 | Longer form, can be more detailed |
| Standalone tweets | Ongoing | 2-3 per week referencing the grant naturally |

---

## Engagement Rules

- **Always respond** to comments and questions on every platform
- **Never argue** with skeptics — address concerns factually, then move on
- **Link to the repo** in every post — let the code speak for itself
- **Don't spam** — one post per community, then engage in comments
- **Be genuine** — communities detect marketing language instantly
- **Add value** — if someone asks a DeFi agent question, answer it even if it's not about Meridian
- **No price talk** — Meridian has no token; keep discussion on technology and infrastructure
