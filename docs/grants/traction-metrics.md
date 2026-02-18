# Meridian — Traction Metrics Snapshot

**Last Updated:** February 2026
**Update Frequency:** Monthly (first week of each month)

Use this document as the single source of truth for all grant applications, pitch materials, and public communications. Copy metrics directly from the tables below into application forms.

---

## Codebase Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Total lines of code | ~19,000 | TypeScript + Solidity |
| TypeScript files | 127 | Across sdk, server, dashboard, examples |
| Solidity files | 12 | Contracts + test files |
| Test files | 12 | vitest (TypeScript) + Foundry (Solidity) |
| Tests passing | 208 / 208 | 100% pass rate |
| Packages in monorepo | 6 | sdk, contracts, dashboard, server, proto, ml |
| Example agents | 2 | defi-rebalancer, multi-agent-portfolio |
| Build system | Turborepo + pnpm workspaces | All packages build and type-check clean |
| Language split | ~85% TypeScript, ~10% Solidity, ~5% Python | ML sidecar in Python |

**Copy-paste version:**
> 19,000 lines of production code across 127 TypeScript files and 12 Solidity files, with 208 tests passing across 12 test files. Monorepo with 6 packages, all building and type-checking clean.

---

## Performance Metrics (Testnet)

| Metric | Value | Conditions |
|--------|-------|------------|
| Autonomous trades executed | 100+ | Arbitrum Sepolia, Uniswap V3, zero human intervention |
| Continuous operation | 30 days | Uninterrupted testnet burn-in period |
| Agent uptime | 99.9% | Across 30-day test period |
| Allocation accuracy | ±2% | Drift from target portfolio weights |
| Decision latency | <3 seconds | Full Sense --> Think --> Act --> Reflect cycle |
| LLM reasoning | Every trade | Human-readable justification logged per decision |
| Chain | Arbitrum Sepolia | Ethereum L2 testnet |
| Primary DEX | Uniswap V3 | Protocol-aware typed connector |
| Crash recovery | Automatic | Agent resumes from last known state after restart |

**Copy-paste version:**
> 100+ autonomous trades executed on Arbitrum Sepolia with zero human intervention. 30-day continuous operation at 99.9% uptime. Portfolio maintained within ±2% of target allocation. Decision latency under 3 seconds per full reasoning cycle. Every trade includes LLM-generated human-readable justification.

---

## Architecture Metrics

| Metric | Value | Details |
|--------|-------|---------|
| Core modules | 8 of 8 built | Runtime, LLM, Chains, Strategy, Memory, Comms, Risk, Dashboard |
| Smart contracts | 4 | AgentRegistry (ERC-721), PaymentEscrow, StrategyVault (ERC-4626), MeridianGovernance (Governor) |
| LLM providers | 3 | Claude (primary), GPT-4o (fallback), Ollama/Llama 3.1 (local) |
| Memory tiers | 3 | Redis (hot), PostgreSQL + TimescaleDB (warm), Qdrant (semantic) |
| Chain connectors | 2 live | Ethereum, Arbitrum; 4 on roadmap (Solana, Avalanche, BNB, Base) |
| Protocol integrations | 2 live | Uniswap V3, Aave V3; 3 on roadmap (Jupiter, Raydium, Curve) |
| Strategy input modes | 3 | Natural language, Strategy DSL (Peggy parser), raw TypeScript |
| Risk checks per transaction | 7 | Position size, exposure, gas, slippage, contract approval, daily loss, simulation |
| Agent state machine | xstate v5 | IDLE --> SENSING --> THINKING --> ACTING --> REFLECTING --> IDLE |
| Agent communication | libp2p | GossipSub + Kademlia DHT, protobuf messages, on-chain payment escrow |
| MEV protection | Flashbots | Transaction privacy for execution |

**Copy-paste version:**
> 8 core modules fully built: Agent Runtime (xstate v5), LLM Integration (Claude/GPT-4/Ollama), Chain Connectors (viem-based, protocol-aware), Strategy Engine (NL + DSL + TypeScript), 3-Tier Memory (Redis/Postgres/Qdrant), Agent-to-Agent Communication (libp2p), Risk Management (7-check pre-flight validation), and Monitoring Dashboard (React 18). 4 smart contracts deployed: AgentRegistry (ERC-721), PaymentEscrow, StrategyVault (ERC-4626), MeridianGovernance (OpenZeppelin Governor).

---

## Technology Stack

| Category | Technology |
|----------|-----------|
| Runtime | Node.js 20+, TypeScript 5.4+ (strict mode, ESM) |
| State machine | xstate v5 |
| Job queue | BullMQ + Redis 7 |
| EVM client | viem (primary), ethers v6 (compatibility) |
| Solana client | @solana/web3.js v2, @coral-xyz/anchor |
| LLM SDK | @anthropic-ai/sdk, openai, ollama-js |
| Database | PostgreSQL 16 + TimescaleDB (drizzle-orm) |
| Vector DB | Qdrant |
| Contracts | Solidity 0.8.24+, Foundry, OpenZeppelin v5 |
| Frontend | React 18, Vite, Tailwind v4, Radix UI, Recharts, TanStack Query |
| API | tRPC (end-to-end type-safe) |
| P2P | libp2p, protobuf-ts |
| Build | Turborepo, pnpm workspaces |
| Testing | vitest, Foundry Test |
| Auth | SIWE (Sign-In With Ethereum) |

---

## Community & Open Source

| Metric | Value |
|--------|-------|
| GitHub | https://github.com/amitduabits/meridiandefi |
| License | Apache 2.0 / MIT (dual-licensed) |
| Open source | 100% of code is public |
| Website | meridianagents.xyz |
| Documentation | docs.meridianagents.xyz |
| Twitter/X | @meridiandefi |
| Discord | discord.gg/meridian |

---

## Competitive Positioning

| Capability | Meridian | ElizaOS | GOAT |
|-----------|----------|---------|------|
| DeFi-native architecture | Yes | No (social-first) | No (action library) |
| Persistent financial state | Yes | No | No |
| Pre-execution risk management | Yes (7 checks) | No | No |
| Strategy DSL | Yes | No | No |
| Multi-agent coordination | Yes (libp2p + on-chain) | Limited | No |
| Cross-chain execution | Yes (unified routing) | Plugin-dependent | Plugin-dependent |
| Backtesting | Yes | No | No |
| On-chain smart contracts | Yes (4 contracts) | No | No |

**One-liner positioning:**
> ElizaOS builds social agents that can touch the blockchain. GOAT gives agents hands. Meridian gives agents a financial brain.

---

## Grant Pipeline Summary

| Program | Ecosystem | Ask Range | Status |
|---------|-----------|-----------|--------|
| Ethereum Foundation ESP | Ethereum | $50K-$100K | Submitted |
| Arbitrum Trailblazer | Arbitrum | $50K-$150K | Submitted |
| NEAR AI Agent Fund | NEAR | $50K-$150K | Submitted |
| Kadena AI Grants | Kadena | $50K-$150K | Preparing |
| Solana Foundation | Solana | $50K-$100K | Preparing |
| Avalanche Blizzard Fund | Avalanche | $50K-$150K | Preparing |
| Uniswap Foundation | Uniswap | $25K-$50K | Preparing |
| Optimism RetroPGF | Optimism | Variable | Planned |

**Pipeline total:** ~$797K across 8 programs
**Mathematical EV:** $200K-$300K (4-6 approvals at 30-50% hit rate)

---

## Monthly Update Template

When updating this document, replace the values above and add the following changelog entry:

```
### [Month Year] Update
- Lines of code: [X] (delta: +[Y])
- Tests: [X] passing / [Y] total
- Autonomous trades: [X] cumulative
- New chain connectors: [list]
- New protocol integrations: [list]
- Grant status changes: [list]
- SDK downloads (if published): [X]
- Developer signups: [X]
- Community size: Discord [X], Twitter [X]
```

### February 2026 (Baseline)
- Lines of code: ~19,000
- Tests: 208 / 208 passing
- Autonomous trades: 100+ on Arbitrum Sepolia
- Modules complete: 8 / 8
- Smart contracts: 4 deployed to Arbitrum Sepolia
- Grant applications: 3 submitted, 5 preparing

---

*This document is the single source of truth for all quantitative claims in grant applications, pitch decks, and public communications. All values must be verifiable via the public GitHub repository or on-chain data. Do not include projected or aspirational metrics — only report what has been built and measured.*
