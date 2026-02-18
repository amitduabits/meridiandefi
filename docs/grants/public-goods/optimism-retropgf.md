# Optimism RetroPGF — Meridian Application

## Overview

Optimism's Retroactive Public Goods Funding (RetroPGF) rewards projects for *past impact* — not promises. This application documents measurable contributions Meridian has already made to the public good, with particular emphasis on benefits to the Optimism Superchain ecosystem.

---

## Project Summary

**Meridian** is an open-source, MIT-licensed framework for building autonomous DeFi agents. It provides the complete infrastructure stack — runtime engine, chain connectors, strategy engine, risk management, and monitoring — so that any developer can build, test, and deploy reliable DeFi agents without assembling the stack from scratch.

- **GitHub:** [github.com/amitduabits/meridiandefi](https://github.com/amitduabits/meridiandefi)
- **License:** MIT
- **Status:** Production-ready framework with testnet validation

---

## Measurable Past Impact

### Development Metrics

| Metric | Evidence | Verification |
|--------|----------|--------------|
| Lines of code | 19,000+ TypeScript | GitHub repository, `cloc` output |
| Test suite | 208 tests across 12 suites, 100% passing | `pnpm turbo test` CI output |
| Autonomous transactions | 100+ testnet trades executed | Transaction logs, testnet explorer |
| Core modules | 8 production-grade modules | Repository structure, package.json files |
| Protocol adapters | Uniswap V3, Aave V3, Jupiter, Curve, Lido | Source code in `packages/sdk/src/chains/` |
| Smart contracts | 4 Foundry-tested contracts | `forge test --gas-report` output |
| Documentation | Architecture docs, API reference, examples | `docs/` directory, inline JSDoc |

### Open-Source Contribution Summary

**What we built and released for free:**

1. **Agent Runtime Engine** — A state-machine-based (xstate v5) runtime for DeFi agents with tick-based scheduling, structured logging, and lifecycle management. No equivalent open-source implementation existed for DeFi-specific agents.

2. **Multi-Chain Connector Abstraction** — A unified interface (`IDeFiConnector`) supporting swap, liquidity, lending, staking, and bridging operations across EVM and Solana. Developers write once, deploy anywhere.

3. **Risk Management Framework** — Pre-flight transaction validation, circuit breakers, position limits, MEV protection integration, and daily loss limits. These safety patterns are encoded as reusable infrastructure rather than proprietary knowledge.

4. **Strategy Engine with Backtesting** — A custom DSL parser (peggy), sandboxed execution (isolated-vm), and DuckDB-backed backtesting. Developers can write, test, and validate strategies before risking any capital.

5. **Agent-to-Agent Communication** — libp2p-based peer-to-peer messaging with GossipSub and Kademlia DHT, enabling multi-agent coordination without centralized servers.

6. **Monitoring Dashboard** — React-based real-time dashboard with portfolio tracking, risk visualization, agent health monitoring, and transaction history.

7. **Example Implementations** — Working examples (DeFi rebalancer, multi-agent portfolio) that serve as educational resources and starting points for new developers.

### Developer Adoption Evidence

- Framework enables developers to build autonomous DeFi agents with TypeScript knowledge alone — no smart contract or ML expertise required
- Example implementations demonstrate end-to-end agent workflows that developers can fork and modify
- Comprehensive test suite serves as living documentation for expected behavior

---

## How Meridian Benefits the Optimism Superchain

### Direct Benefits

**1. OP Mainnet and Superchain Agent Infrastructure**

Meridian's EVM chain connectors support Optimism natively. Agents built with Meridian can operate on OP Mainnet, Base, and other Superchain networks through the same unified interface. This drives transaction volume and protocol usage across the Superchain.

**2. Increased DeFi Composability on Optimism**

Autonomous agents increase the efficiency of DeFi protocols by providing continuous liquidity management, automated rebalancing, and cross-protocol arbitrage. This benefits all Optimism DeFi users through tighter spreads, deeper liquidity, and more efficient markets.

**3. Lower Barrier to Building on Optimism**

Developers who want to build autonomous DeFi applications on Optimism face a steep learning curve. Meridian eliminates the need to build agent infrastructure from scratch, making Optimism a more accessible platform for a new class of DeFi applications.

**4. Safety Infrastructure for the Ecosystem**

Meridian's risk management layer — circuit breakers, position limits, simulation-before-execution — reduces the likelihood of agent-caused incidents on Optimism. Safer agents mean a more stable ecosystem for all users.

### Superchain-Specific Integration Points

- Native support for OP Mainnet RPC endpoints and contract addresses
- Gas estimation optimized for L2 fee structure (L1 data fee + L2 execution fee)
- Cross-chain bridging support for Superchain interoperability
- Dashboard monitoring compatible with OP block explorer APIs

---

## Evidence Format for Impact Claims

Each claim below follows the format: **Claim -> Evidence -> Verification Method**

| # | Claim | Evidence | How to Verify |
|---|-------|----------|---------------|
| 1 | 19K+ lines of open-source code | GitHub repository | Run `cloc` on repository |
| 2 | 208 passing tests | CI pipeline output | Run `pnpm turbo test` |
| 3 | 100+ autonomous testnet transactions | Transaction logs | Review testnet explorer records |
| 4 | 8 production modules | Package structure | Inspect `packages/` directory |
| 5 | Multi-chain support including Optimism | Chain connector source code | Review `packages/sdk/src/chains/` |
| 6 | MIT license — fully open | LICENSE file | Check repository root |
| 7 | Risk management prevents unsafe trades | Pre-flight validator tests | Review test suite for risk module |
| 8 | Working dashboard for monitoring | React application source | Run `pnpm --filter @meridian/dashboard dev` |
| 9 | Smart contracts tested with Foundry | Test results and gas reports | Run `forge test --gas-report` |
| 10 | Agent-to-agent communication protocol | libp2p implementation | Review proto/ and sdk/src/communication/ |

---

## Impact Categories

Based on Optimism's RetroPGF categories, Meridian qualifies under:

- **Developer Ecosystem** — Framework that enables new categories of DeFi applications
- **Infrastructure** — Reusable agent runtime, chain connectors, and risk management
- **Open Source** — MIT-licensed, fully public codebase with comprehensive tests

---

## Requested Allocation Rationale

Meridian's impact is proportional to the infrastructure it provides. Comparable open-source DeFi infrastructure projects (protocol SDKs, developer frameworks, testing tools) have received RetroPGF allocations in the range of 50,000-150,000 OP in previous rounds.

We believe Meridian's contribution — a complete, tested, multi-chain agent framework with novel risk management and agent coordination capabilities — represents significant public goods value to the Optimism ecosystem.

---

## Application Checklist

- [ ] Attest project on the Optimism attestation platform
- [ ] Ensure all GitHub metrics are current and verifiable
- [ ] Prepare testnet transaction evidence with explorer links
- [ ] Collect developer testimonials or usage evidence
- [ ] Write concise impact summary (under 500 words) for voter review
- [ ] Submit before RetroPGF round deadline
- [ ] Engage with badgeholders through legitimate channels (forums, governance calls)
