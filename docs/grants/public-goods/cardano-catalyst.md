# Cardano Project Catalyst — Meridian Application

## Fund Information

**Project Catalyst**
Requested Amount: $50,000
Category: Developer Tools / Cross-Chain Infrastructure
Voting: Community-driven (ADA holders vote on proposals)

---

## Proposal Title

**Meridian: Bringing Autonomous DeFi Agents to Cardano**

---

## Problem Statement

Cardano's DeFi ecosystem is growing, but developers who want to build autonomous agents — bots that monitor markets, execute trades, manage positions, and adapt over time — must build everything from scratch. There is no open-source framework that handles the complexity of agent infrastructure (runtime management, risk controls, strategy execution, monitoring) for Cardano.

Meanwhile, EVM-based chains have a growing ecosystem of agent tools. If Cardano does not have equivalent infrastructure, developers will build elsewhere, and Cardano DeFi will miss the autonomous agent wave that is reshaping how decentralized finance operates.

---

## Our Solution

Meridian is a complete, open-source framework for building autonomous DeFi agents. It already works on EVM chains and Solana. We propose to extend Meridian with full Cardano support, so that any developer can build, test, and deploy autonomous agents on Cardano with the same ease as on Ethereum.

**What Meridian provides:**

- **Agent runtime** — A structured decision cycle (Sense-Think-Act-Reflect) with state machine management, so agents behave predictably and safely
- **Chain connectors** — Plug-in adapters for DeFi protocols. We will build Cardano-specific connectors for SundaeSwap, Minswap, and Liqwid
- **Risk management** — Built-in safety: position limits, circuit breakers, loss limits, and simulation-before-execution. Every agent is safe by default
- **Strategy engine** — Write trading strategies in simple language, backtest them against historical data, then deploy with confidence
- **Monitoring dashboard** — See what your agents are doing in real time: portfolio, trades, health, and risk metrics
- **Multi-agent coordination** — Agents can communicate and coordinate with each other without a central server

**What already exists (you are not funding promises):**

- 19,000+ lines of tested TypeScript code
- 208 tests passing across 12 test suites
- 100+ autonomous transactions executed on testnet
- Working connectors for Uniswap, Aave, Jupiter, Curve, Lido
- MIT license — completely free and open source
- GitHub: [github.com/amitduabits/meridiandefi](https://github.com/amitduabits/meridiandefi)

---

## How the Cardano Community Benefits

### For Developers
- Build autonomous DeFi agents on Cardano without starting from scratch
- Use TypeScript — the most popular web development language — no Haskell or Plutus knowledge required for the agent layer
- Fork working examples and modify them for your needs

### For Cardano DeFi
- Autonomous agents bring continuous liquidity management to Cardano DEXes
- Automated rebalancing and arbitrage tighten spreads and deepen liquidity for all users
- More sophisticated DeFi strategies become possible, attracting capital and users to Cardano

### For the Ecosystem
- Open-source infrastructure that any Cardano project can integrate
- Safety-first design reduces the risk of agent-caused incidents
- Cross-chain capability means Cardano agents can interact with agents on other chains, expanding Cardano's reach

---

## Deliverables and Timeline

### Milestone 1: Cardano Chain Connector (Month 1-2) — $15,000

| Deliverable | Description | Acceptance Criteria |
|-------------|-------------|-------------------|
| Cardano connector module | Implements `IDeFiConnector` interface for Cardano | All interface methods implemented and tested |
| cardano-js-sdk integration | Connect to Cardano nodes, read UTXOs, submit transactions | Successfully query balances and submit transactions on preview testnet |
| SundaeSwap adapter | Swap functionality through SundaeSwap | Execute test swaps on preview testnet |
| Unit tests | Comprehensive tests for all Cardano connector functionality | Minimum 30 new tests, all passing |

### Milestone 2: Protocol Adapters (Month 3-4) — $15,000

| Deliverable | Description | Acceptance Criteria |
|-------------|-------------|-------------------|
| Minswap adapter | Swap and liquidity operations through Minswap | Execute test swaps and LP operations on preview testnet |
| Liqwid adapter | Lending and borrowing through Liqwid | Execute test deposits and borrows on preview testnet |
| Cardano-specific risk rules | Risk management adapted for UTXO model and Cardano fee structure | Risk pre-flight validator handles Cardano transactions correctly |
| Integration tests | End-to-end tests for agent workflows on Cardano | Run complete Sense-Think-Act-Reflect cycle on Cardano testnet |

### Milestone 3: Examples, Docs, and Polish (Month 5-6) — $20,000

| Deliverable | Description | Acceptance Criteria |
|-------------|-------------|-------------------|
| Cardano DCA bot example | Working example: dollar-cost averaging agent on Cardano | Fully functional, documented, ready to fork |
| Cardano yield optimizer example | Working example: automated yield optimization across Cardano DeFi | Fully functional, documented, ready to fork |
| Dashboard Cardano support | Monitoring dashboard displays Cardano agent data | Portfolio, transactions, and health for Cardano agents |
| Documentation | Setup guide, API reference, tutorials for Cardano integration | Published on docs site, reviewed by community member |
| Community demo | Live demo of Meridian agents on Cardano testnet | Recorded video + live session |

---

## Budget Breakdown

| Item | Amount | Details |
|------|--------|---------|
| Development (Cardano connector + adapters) | $30,000 | 4 months of development work |
| Testing and QA | $8,000 | Comprehensive test suite, testnet validation |
| Documentation and examples | $7,000 | Tutorials, guides, example applications |
| Community engagement | $3,000 | Demo sessions, forum engagement, video content |
| Infrastructure | $2,000 | Testnet nodes, CI/CD, cloud hosting for demos |
| **Total** | **$50,000** | |

---

## Why Vote for This Proposal

**1. You are funding proven work, not promises.** Meridian already exists with 19,000 lines of code and 208 passing tests. We are extending a working system to Cardano, not starting from scratch.

**2. Every Cardano developer benefits.** MIT license means anyone can use, modify, and build on Meridian. This is permanent public infrastructure for Cardano.

**3. Safety is built in.** DeFi agents without safety controls are dangerous. Meridian's risk management — circuit breakers, position limits, simulation-before-execution — protects users by default.

**4. Cross-chain brings value to Cardano.** Agents that work across Cardano, Ethereum, and Solana expand Cardano's reach and connect its DeFi ecosystem to the broader market.

**5. Clear, measurable deliverables.** Three milestones with specific acceptance criteria. You can verify every deliverable on-chain and in the open-source repository.

---

## Team

The Meridian team designed and built the complete agent framework:
- Full-stack TypeScript and smart contract development
- Multi-chain DeFi protocol integration experience
- Risk management and financial systems engineering
- Open-source development and community building

---

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Cardano protocol API changes | Medium | Use official cardano-js-sdk; maintain adapter abstraction layer |
| DeFi protocol changes (SundaeSwap, Minswap) | Medium | Protocol adapters are modular and independently updatable |
| Development delays | Low | Core framework already complete; only Cardano-specific work needed |
| Insufficient community adoption | Medium | Provide working examples, video tutorials, and direct community support |

---

## Application Checklist

- [ ] Submit proposal on Project Catalyst platform
- [ ] Complete ideascale profile with team information
- [ ] Record 3-minute pitch video
- [ ] Engage with community on Catalyst forums
- [ ] Respond to community advisor reviews
- [ ] Prepare demo materials for voter evaluation
- [ ] Set up milestone reporting plan for funded project
