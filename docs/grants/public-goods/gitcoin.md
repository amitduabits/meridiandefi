# Gitcoin Grants — Meridian Application

## Recommended Round

**GG Infrastructure + DeFi + Open Source**

Meridian sits at the intersection of infrastructure (agent framework), DeFi (protocol connectors), and open-source tooling. Apply to all three matching rounds if eligible — Gitcoin allows multi-round participation, and each round has its own matching pool.

---

## Profile Description (200 Words)

Meridian is an open-source, MIT-licensed framework that enables developers to build autonomous agents for decentralized finance. Rather than requiring deep expertise in both smart contracts and machine learning, Meridian provides a structured runtime where agents follow a disciplined Sense-Think-Act-Reflect decision cycle — observing on-chain data, reasoning about opportunities, executing transactions, and learning from outcomes.

The framework ships with production-grade components: multi-chain connectors for EVM and Solana ecosystems, protocol adapters for Uniswap, Aave, Jupiter, and Curve, a strategy engine with backtesting, tiered memory (hot/warm/knowledge), risk management with circuit breakers and position limits, and agent-to-agent communication via libp2p.

At 19,000+ lines of TypeScript, 208 passing tests, and over 100 autonomous testnet transactions, Meridian is not a prototype — it is working infrastructure. Any developer with TypeScript experience can build, test, and deploy autonomous DeFi agents without starting from scratch.

We believe autonomous agent infrastructure should be a public good. The barriers to building reliable, safe DeFi agents are too high for individual developers. Meridian lowers those barriers for everyone, permanently and freely.

---

## Impact Statement

### How Meridian Benefits the Broader Web3 Ecosystem

**1. Lowering the Barrier to Autonomous DeFi**

Building a reliable DeFi agent today requires expertise across smart contracts, off-chain infrastructure, risk management, and machine learning. Most developers cannot assemble this stack alone. Meridian provides a complete, tested foundation so that builders can focus on strategy and innovation rather than infrastructure plumbing.

**2. Safety as a Public Good**

DeFi agent failures cause real financial harm. Meridian's risk management layer — pre-flight validators, circuit breakers, position limits, MEV protection, daily loss limits — encodes hard-won safety lessons into reusable infrastructure. Every agent built on Meridian inherits these protections by default.

**3. Multi-Chain Interoperability**

Meridian's chain connector abstraction means agents can operate across EVM chains and Solana through a single interface. This reduces fragmentation and encourages cross-chain composability — a benefit to the entire ecosystem, not just Meridian users.

**4. Open Knowledge Base**

All decision logs, strategy patterns, and agent communication protocols are open and documented. The framework contributes to collective understanding of how autonomous systems should operate in adversarial financial environments.

**5. Enabling the Next Wave of DeFi Innovation**

Agent-driven DeFi — automated rebalancing, cross-protocol arbitrage, intelligent liquidation protection — represents the next evolution of decentralized finance. Meridian ensures this evolution is accessible, not gated behind proprietary systems.

---

## Social Proof Elements

| Metric | Value |
|--------|-------|
| Codebase size | 19,000+ lines of TypeScript |
| Test coverage | 208 tests, 12 test suites, all passing |
| Testnet transactions | 100+ autonomous trades executed |
| Architecture | 8 core modules, full monorepo |
| License | MIT — fully open source |
| Protocol integrations | Uniswap V3, Aave V3, Jupiter, Curve, Lido |
| Chain support | EVM (Ethereum, Optimism, Arbitrum, Base) + Solana |
| Smart contracts | 4 Foundry-tested contracts (Registry, Escrow, Vault, Governance) |
| GitHub | [github.com/amitduabits/meridiandefi](https://github.com/amitduabits/meridiandefi) |

---

## Community Strategy to Maximize Quadratic Matching

Quadratic funding rewards breadth of support over depth. The goal is to maximize the *number* of unique contributors, not the dollar amount per contributor.

### Pre-Round Preparation (2-4 Weeks Before)

1. **Developer testimonials** — Collect short quotes from developers who have used Meridian or its components. Real voices outperform marketing copy.
2. **Impact thread** — Publish a detailed Twitter/X thread walking through Meridian's architecture, with visuals from the dashboard and code snippets. Pin it.
3. **Demo video** — Record a 3-minute video showing an agent being configured, backtested, and deployed on testnet. Post on YouTube and embed in the Gitcoin profile.

### During the Round

4. **Daily engagement** — Share one specific technical detail per day: a module, a test result, an agent decision log. Each post should link back to the Gitcoin grant page.
5. **Developer Discord outreach** — Post in DeFi developer communities (not spam — genuine engagement showing how Meridian solves real problems).
6. **Contributor recognition** — Thank every donor publicly and immediately. People contribute again when they feel seen.
7. **Cross-pollination** — Identify complementary grants (other DeFi tools, agent frameworks, open-source infrastructure) and signal-boost them. The community notices generosity.

### Post-Round

8. **Transparency report** — Publish exactly how funds were used. This builds trust for future rounds.
9. **Milestone updates** — Ship visible progress tied to the grant, and share it publicly with attribution to Gitcoin supporters.

### Quadratic Matching Math

- 100 contributors at $1 each generates significantly more matching than 1 contributor at $100
- Target: 200+ unique contributors per round
- Every contributor counts equally in the matching formula — focus on reach, not whale donations

---

## Application Checklist

- [ ] Gitcoin Passport score above threshold (verify before round opens)
- [ ] Project profile complete with logo, banner, description, and links
- [ ] GitHub repository linked and public
- [ ] At least 3 team member profiles connected
- [ ] Demo video uploaded and embedded
- [ ] Social accounts linked (Twitter/X, Discord)
- [ ] Apply to all eligible matching rounds
- [ ] Prepare social content calendar for the round duration
- [ ] Set up contribution tracking to thank donors in real-time
