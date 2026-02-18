# Public Goods Grants — Meridian

## Overview

This directory contains grant applications for public goods funding programs. Unlike ecosystem grants (which evaluate product-market fit and revenue potential), public goods grants evaluate **impact** — how the project benefits the broader ecosystem, permanently and freely.

Meridian qualifies as a public good because it is:
- **Open source** (MIT license) — anyone can use, modify, and distribute
- **Infrastructure** — other projects build on top of it
- **Non-excludable** — benefits accrue to all ecosystem participants, not just Meridian users
- **Safety-focused** — risk management patterns benefit everyone, including users of agents built by others

---

## Grant Opportunities

| Program | Focus | Amount | Priority | Deadline |
|---------|-------|--------|----------|----------|
| [Gitcoin Grants](./gitcoin.md) | Community-funded public goods (quadratic matching) | Variable (matching pool) | High | Quarterly rounds |
| [Optimism RetroPGF](./optimism-retropgf.md) | Retroactive funding for past impact | 50K-150K OP | High | Annual rounds |
| [Protocol Labs Research](./protocol-labs.md) | Decentralized systems research | $50K-$200K | Medium | Rolling |
| [Cardano Catalyst](./cardano-catalyst.md) | Community-voted project funding | $25K-$75K | Medium | Fund cycles |
| [Ethereum Academic](./ethereum-academic.md) | Academic research advancing Ethereum | $50K-$200K | High | Rolling / Waves |

### Priority Rationale

- **Gitcoin (High):** Low barrier to entry, builds community, quadratic matching amplifies small contributions. Apply every round.
- **Optimism RetroPGF (High):** Rewards existing work — Meridian already has measurable impact. Strong alignment with Superchain.
- **Ethereum Academic (High):** Largest potential funding, strongest alignment with Meridian's research contributions. Requires academic partnerships.
- **Protocol Labs (Medium):** Good fit for research angle, but competitive and requires strong academic framing.
- **Cardano Catalyst (Medium):** Community-voted, requires Cardano-specific development. Good for expanding multi-chain reach.

---

## Common Themes Across Applications

Every application in this directory shares these core narratives, adapted to each program's evaluation criteria:

### 1. Infrastructure That Lowers Barriers

Meridian provides the complete stack for autonomous DeFi agents — runtime, chain connectors, risk management, strategy engine, monitoring — so that individual developers do not need to build it themselves. This is infrastructure work that benefits everyone.

**Evidence:** 19,000+ lines of TypeScript, 8 core modules, 5 protocol adapters, multi-chain support.

### 2. Safety as a Public Good

DeFi agent failures cause real financial harm. Meridian's risk management layer — pre-flight validators, circuit breakers, position limits, MEV protection, daily loss limits — encodes safety patterns into reusable infrastructure. Every agent built on Meridian inherits these protections.

**Evidence:** 208 tests validating safety invariants, comprehensive risk module with formal bounds.

### 3. Proven, Not Promised

Meridian is not a whitepaper or a prototype. It is working software with tests, testnet transactions, and documented architecture. Public goods funding should go to projects that have already demonstrated commitment and capability.

**Evidence:** 100+ autonomous testnet transactions, complete monorepo, passing test suite.

### 4. Permanent and Free

MIT license means Meridian's contributions are permanent. The code cannot be made proprietary. Any developer, anywhere, forever, can use this infrastructure.

**Evidence:** MIT LICENSE file in repository root, public GitHub repository.

---

## Impact-First Framing Guidelines

When writing or adapting these applications, follow these principles:

### Frame Around Impact, Not Product

- Wrong: "Meridian is a platform that helps developers build DeFi bots"
- Right: "Meridian provides open infrastructure that lowers the barrier to autonomous DeFi for all developers"

### Quantify Everything

- Lines of code, tests passing, transactions executed, protocols integrated
- Avoid vague claims ("significant impact") — use numbers ("19,000 lines, 208 tests, 100+ transactions")

### Show, Do Not Tell

- Link to the repository, not a pitch deck
- Reference test results, not roadmap slides
- Point to working code, not architecture diagrams

### Emphasize Non-Excludability

- MIT license means the benefits cannot be captured
- Infrastructure patterns are available to competitors and collaborators equally
- Safety improvements benefit all ecosystem participants

### Acknowledge What Exists

- Every application should clearly state what has already been built
- Distinguish between "funding past impact" (RetroPGF) and "funding future work" (Catalyst, Academic)
- For future-work grants, explain how existing infrastructure de-risks the proposal

### Adapt to the Audience

| Program | Audience | Adapt By |
|---------|----------|----------|
| Gitcoin | Community contributors | Emphasize developer benefit, social proof, accessibility |
| Optimism RetroPGF | Badgeholders | Quantify past impact, Superchain alignment, evidence format |
| Protocol Labs | Research committee | Academic framing, literature references, formal methods |
| Cardano Catalyst | ADA holders (voters) | Simple language, clear deliverables, Cardano-specific benefits |
| Ethereum Academic | Academic reviewers | Methodology, expected publications, formal rigor |

---

## File Index

| File | Program | Status |
|------|---------|--------|
| [`gitcoin.md`](./gitcoin.md) | Gitcoin Grants | Draft |
| [`optimism-retropgf.md`](./optimism-retropgf.md) | Optimism RetroPGF | Draft |
| [`protocol-labs.md`](./protocol-labs.md) | Protocol Labs Research Grant | Draft |
| [`cardano-catalyst.md`](./cardano-catalyst.md) | Cardano Project Catalyst | Draft |
| [`ethereum-academic.md`](./ethereum-academic.md) | Ethereum Academic Grant | Draft |

---

## Next Steps

1. **Finalize team information** — Add PI names, contact details, and CVs to all applications
2. **Establish academic partnerships** — Required for Ethereum Academic and Protocol Labs grants
3. **Collect social proof** — Developer testimonials, usage metrics, community engagement data
4. **Track deadlines** — Monitor each program's application windows and round schedules
5. **Prepare supplementary materials** — Demo videos, pitch decks, executive summaries as needed
6. **Community engagement** — Begin building relationships in each program's community before applying
