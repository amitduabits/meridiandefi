# Polygon Grant Addendum — Meridian Framework

**Program:** Polygon Village / Community Grants ($5K--$250K)
**Category:** DeFi Infrastructure / Developer Tooling
**Recommended Ask:** $50K--$100K (Tier 2)
**Priority:** MEDIUM

---

## A) Ecosystem Customization

Polygon's $1B+ commitment to ZK technology and its position as the most widely adopted Ethereum scaling solution create a compelling foundation for Meridian deployment. With Polygon PoS handling millions of daily transactions at sub-cent gas costs, and Polygon zkEVM bringing zero-knowledge verification to EVM execution, the ecosystem offers two distinct deployment modes for autonomous agents: high-frequency operation on PoS for cost-sensitive strategies, and ZK-verified execution on zkEVM for trust-critical institutional strategies. Meridian's EVM connectors -- built on viem with strict TypeScript typing -- are compatible with both Polygon PoS and zkEVM without modification, giving our 19,000-line codebase and 208 passing tests immediate deployment readiness across Polygon's full chain suite.

Polygon's DeFi ecosystem hosts mature implementations of Uniswap V3, Aave V3, Curve, and QuickSwap, all of which Meridian already has connector interfaces for or can extend from existing protocol adapters. The practical result is that Meridian can deliver a production-ready agent framework on Polygon faster than on any non-EVM chain, while the ZK roadmap creates a long-term narrative: agents whose strategy execution is not just logged but mathematically verified. For grant evaluators, this means Meridian simultaneously delivers immediate utility (agents trading on PoS today) and strategic positioning (ZK-verified agent behavior as zkEVM matures). Polygon gets both a working product and a research direction in a single investment.

## B) Why Build on Polygon Specifically

- **Dual deployment: PoS + zkEVM.** Meridian agents can operate on Polygon PoS for high-frequency, low-cost execution and on zkEVM for ZK-verified strategy compliance -- two environments, one codebase, zero changes to agent logic.
- **Sub-cent gas enables democratic access.** Polygon's gas economics make continuous agent operation viable for small portfolios, expanding the addressable market from whales to retail DeFi participants.
- **Mature DeFi protocol coverage.** Polygon hosts Uniswap V3, Aave V3, Curve, and QuickSwap -- protocols Meridian already has connector interfaces for, enabling rapid integration and deployment.

## C) Recommended Funding and Program

**Amount:** $50K--$100K from Polygon Village or Community Grants
**Tier:** Standard (Tier 2) -- SDK with Polygon featured, connectors for Uniswap V3/Polygon + Aave V3/Polygon + QuickSwap, multi-agent orchestration, backtesting with Polygon data, and ZK-verified execution proof-of-concept on zkEVM.
**Milestone structure:** 3-month delivery with monthly disbursement (30/40/30 split).

## D) Key Contact / Channel

- **Polygon Grants Portal:** polygon.technology/village/grants
- **Primary contact:** Polygon Village ecosystem team
- **Engage before applying:** Engage with the Polygon DeFi community on Discord and present Meridian at a Polygon Guild event. Emphasize the dual PoS/zkEVM deployment capability and how the ZK roadmap aligns with Polygon's $1B ZK commitment.

## E) Unique Demo Addition

**Dual-Chain Agent Comparison: PoS vs. zkEVM.** Deploy identical Meridian rebalancing agents on both Polygon PoS and Polygon zkEVM testnets running the same strategy against the same market conditions. Publish a comparison report covering execution latency, gas costs, verification overhead, and portfolio accuracy -- demonstrating Polygon's versatility for different agent deployment requirements.

## F) Pre-Written Application Answers

**Q1: What are you building?**
Meridian is an open-source AI agent framework purpose-built for DeFi. Agents maintain persistent portfolio context, reason about market conditions using LLM-powered analysis, and execute strategies through typed protocol connectors with pre-execution risk simulation. Metrics: 19,000 lines of TypeScript, 208 tests, 100+ autonomous trades on Arbitrum Sepolia, 8 core modules, 4 smart contracts. MIT license.

**Q2: Why Polygon?**
Polygon offers two distinct deployment environments from one EVM-compatible codebase. PoS provides sub-cent gas for high-frequency agent operation accessible to all portfolio sizes. zkEVM delivers ZK-verified execution for institutional-grade trust guarantees. Meridian's viem-based connectors work on both without modification, making Polygon the most versatile deployment target in our pipeline.

**Q3: What DeFi protocols will you support?**
Uniswap V3 (on Polygon), Aave V3 (on Polygon), QuickSwap, and Curve. Our existing Uniswap V3 and Aave V3 connectors require only chain-specific configuration to operate on Polygon -- the protocol interfaces are identical. QuickSwap integration extends our V3-compatible connector.

**Q4: How does this relate to ZK technology?**
On Polygon zkEVM, Meridian agent transactions are included in ZK-proven batches, meaning every swap, lending operation, and portfolio rebalance is mathematically verified as part of the chain's state transition. We will explore extending this to strategy-level verification: proving that an agent operated within its declared parameters, not just that transactions executed correctly.

**Q5: What are your milestones?**
Month 1: Polygon PoS connectors (Uniswap V3, Aave V3, QuickSwap), rebalancing agent on Mumbai testnet, SDK v0.1 with Polygon examples. Month 2: Multi-agent demo, Strategy DSL with Polygon templates, backtesting engine, zkEVM deployment POC. Month 3: SDK v1.0 featuring Polygon, documentation, agent templates, PoS vs. zkEVM comparison report, impact metrics.

**Q6: How will you measure success?**
Autonomous transactions on Polygon testnet/mainnet, portfolio accuracy metrics, gas efficiency comparisons, SDK downloads, developer adoption from Polygon ecosystem, protocol volume generated. Monthly reports with on-chain verification.

**Q7: Is the project open source?**
Yes. MIT license. GitHub: https://github.com/amitduabits/meridiandefi

---

*Last Updated: February 2026*
