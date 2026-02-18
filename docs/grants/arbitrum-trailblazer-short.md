# Meridian — Arbitrum Trailblazer Grant Application

**Project:** Meridian
**Ask:** $10,000
**Timeline:** 4 weeks
**Status:** Live on Arbitrum Sepolia

---

## What We Built

Meridian is an open-source AI agent framework purpose-built for DeFi. Our autonomous rebalancing agent has been running on Arbitrum Sepolia for 30 days, executing 127 portfolio rebalances on Uniswap V3 with zero human intervention. The results: 99.2% success rate, average portfolio drift held to 1.8% against a 5% threshold, 2.1-second average decision latency, 99.9% uptime, and a total gas cost of $8.50. Every transaction is verifiable on Arbiscan. The agent uses a Sense-Think-Act-Reflect decision cycle powered by LLM reasoning, with pre-execution risk checks, slippage protection, and structured trade justifications for every swap. The full framework includes 208 passing tests across 12 test suites, typed protocol connectors, a strategy DSL, 3-tier memory system, and a monitoring dashboard. No other AI agent framework has native Arbitrum DeFi integration at this level.

## What $10K Delivers

**1. Production Rebalancing Agent for Arbitrum** ($3,500)
Deploy-ready autonomous agent optimized for Arbitrum, with configurable allocations, drift thresholds, and risk parameters. Any developer clones the repo and has their own agent trading on Arbitrum in 30 minutes.

**2. `@meridian/connector-arbitrum` npm Package** ($3,000)
A typed, protocol-aware connector for Uniswap V3 on Arbitrum — open-sourced and published to npm. Arbitrum developers get protocol-semantic abstractions (liquidity math, collateral factors, slippage handling) instead of raw contract calls. Building this from scratch would cost any team $10K-$20K.

**3. Developer Quickstart Tutorial + Video** ($2,000)
Step-by-step guide and 10-minute video taking developers from zero to a running AI agent on Arbitrum. Published on our docs and available for Arbitrum's DevRel team to feature in newsletters, docs, and developer outreach.

**4. Infrastructure costs** ($1,500)
RPC nodes, testnet gas, hosting, and CI/CD for Arbitrum-specific development.

**Total perceived value: $40K-$60K. Actual ask: $10K.**

## Milestones (50/50 Split)

**Milestone 1 — Week 2 (50% / $5,000):**
Arbitrum chain connector deployed. Testnet agent running with 50+ verified transactions. GitHub repo public with documentation.
Evidence: npm package published, Arbiscan transaction history, public GitHub commits.

**Milestone 2 — Week 4 (50% / $5,000):**
Developer tutorial published. Video walkthrough live. 100+ autonomous testnet transactions completed. Community announcement.
Evidence: Published tutorial, live demo video, Arbiscan verification, npm download metrics.

If we do not deliver, payment does not disburse. Zero risk to the Arbitrum Foundation.

## Proof

- **GitHub:** github.com/meridian-agents/meridian (full source, 208 tests passing)
- **Testnet:** 127 autonomous trades on Arbitrum Sepolia via Uniswap V3 Router (Arbiscan-verifiable)
- **Demo:** 3-minute video showing live Sense-Think-Act-Reflect cycle with on-chain execution
- **Docs:** docs.meridianagents.xyz

## Why Arbitrum

Arbitrum's low gas makes autonomous agents economically viable ($8.50 for 30 days of continuous trading). Arbitrum has the deepest L2 DeFi liquidity for real capital deployment at mainnet. Meridian already runs here. ElizaOS and GOAT do not have native Arbitrum DeFi support. This grant makes Arbitrum the default chain in every Meridian tutorial, example, and quickstart — turning Meridian's developer pipeline into an Arbitrum developer acquisition channel.

The agent is already trading. The tooling is ready to ship.
