# Taiko Grant Addendum — Meridian Framework

**Program:** Taiko Ecosystem Fund ($25M)
**Category:** AI + DeFi Infrastructure
**Recommended Ask:** $50K--$150K (Tier 2)
**Priority:** MEDIUM

---

## A) Ecosystem Customization

Taiko is the only Type 1 (Ethereum-equivalent) ZK-rollup, which means every smart contract, every tool, and every piece of infrastructure from Ethereum mainnet works on Taiko without modification. Meridian's EVM chain connectors -- built on viem with typed protocol interfaces for Uniswap V3, Aave V3, and Curve -- deploy to Taiko identically to how they deploy on Ethereum L1. This is not a theoretical claim: our 19,000-line TypeScript codebase, 208 passing tests, and 100+ autonomous trades on Arbitrum Sepolia are proof that Meridian's infrastructure is production-ready for any EVM-equivalent environment. Taiko's decentralized, permissionless proving architecture means Meridian agents can operate with the same trust guarantees as Ethereum mainnet while benefiting from L2 throughput and cost structure.

What makes the Taiko-Meridian combination uniquely powerful is the intersection of ZK verification and autonomous agent execution. Meridian's Sense-Think-Act-Reflect decision cycle generates a complete audit trail of every trade decision -- the market data sensed, the reasoning applied, the action taken, and the outcome evaluated. On Taiko, this decision trail can be anchored to ZK-verified state transitions, creating cryptographic proof that an agent operated within its declared strategy parameters. This is the foundation for trustless, verifiable autonomous finance: agents whose behavior is not just logged but mathematically proven.

## B) Why Build on Taiko Specifically

- **Zero-friction EVM compatibility.** Meridian's existing Ethereum and Arbitrum connectors work on Taiko without a single line of code changed. No language translation, no adapter layers, no compromises -- genuine Ethereum equivalence means day-one deployment readiness.
- **ZK-verified agent behavior.** Taiko's proving system enables a future where agent strategy execution is not just auditable but cryptographically verifiable, positioning Meridian as the first framework to offer ZK-proven autonomous trading.
- **Aligned incentive timing.** Taiko's $25M ecosystem fund is actively deploying capital into DeFi infrastructure and AI-adjacent projects. Meridian is precisely the kind of protocol-level infrastructure that drives sustained on-chain activity and developer adoption.

## C) Recommended Funding and Program

**Amount:** $50K--$150K from the Taiko Grants Program
**Tier:** Standard (Tier 2) -- SDK, multi-agent orchestration, chain-specific connectors, backtesting with Taiko data, and developer templates for Taiko's top protocols.
**Milestone structure:** 3-month delivery with monthly disbursement (30/40/30 split), on-chain verification at each stage.

## D) Key Contact / Channel

- **Taiko Grants Portal:** grants.taiko.xyz
- **Primary contact:** Taiko Labs ecosystem team via Discord (#grants channel)
- **Engage before applying:** Post an introduction in Taiko's governance forum outlining the Meridian framework and requesting feedback from the grants committee. Reference Taiko's Ethereum-equivalence positioning explicitly.

## E) Unique Demo Addition

**ZK-Verified Strategy Execution Proof-of-Concept.** Deploy a Meridian rebalancing agent on Taiko testnet that generates a verifiable execution trace -- every trade decision anchored to ZK-proven state. Publish a short technical write-up showing how Taiko's proving architecture enables trustless verification of agent behavior, positioning Taiko as the first chain where autonomous DeFi agents can be cryptographically audited.

## F) Pre-Written Application Answers

**Q1: What are you building?**
Meridian is an open-source AI agent framework purpose-built for decentralized finance. Agents follow a Sense-Think-Act-Reflect decision cycle, reasoning about portfolio positions, risk parameters, and market conditions in real time. The framework includes 8 core modules, 4 auditable smart contracts, and typed protocol connectors for major DeFi protocols. We have 19,000 lines of production code, 208 tests, and 100+ autonomous trades executed on Arbitrum Sepolia.

**Q2: Why Taiko?**
Taiko's Type 1 Ethereum equivalence means Meridian's entire EVM infrastructure -- connectors, contracts, SDK -- deploys without modification. No other ZK-rollup offers this level of compatibility. Additionally, Taiko's ZK proving architecture creates a unique opportunity for cryptographically verified agent execution, a capability no other chain can offer natively.

**Q3: What is your competitive advantage?**
Meridian is DeFi-native, not DeFi-adjacent. Competitors like ElizaOS focus on social agents, GOAT provides stateless blockchain actions, and Virtuals operates as a token launchpad. Meridian is the only framework where every agent maintains persistent portfolio context, executes through protocol-semantic connectors, and passes pre-flight risk checks before every transaction.

**Q4: What milestones will you deliver?**
Month 1: Taiko chain connector deployed, rebalancing agent live on testnet, SDK v0.1 with Taiko examples. Month 2: Multi-agent orchestration demo, Strategy DSL with Taiko-specific templates, backtesting engine with Taiko historical data. Month 3: SDK v1.0, full documentation featuring Taiko prominently, agent templates for Taiko's top protocols, published impact report.

**Q5: How does this benefit the Taiko ecosystem?**
Meridian brings persistent, intelligent on-chain activity to Taiko -- agents that generate swap volume, lending activity, and protocol fees 24/7. The open-source SDK makes Taiko the default chain for AI agent developers, driving developer adoption. Every Meridian agent deployed on Taiko is a permanent user of the ecosystem.

**Q6: What is your team background?**
4-6 core contributors with senior engineering experience in DeFi protocols, infrastructure, and ML systems. Prior contributions to open-source blockchain tooling. Smart contract engineers with audit preparation experience. Scaling to 8-10 contributors by Phase 4.

**Q7: Is the project open source?**
Yes. MIT license. GitHub: https://github.com/amitduabits/meridiandefi

**Q8: How will you measure success?**
Number of autonomous transactions on Taiko testnet/mainnet, SDK downloads, developer signups, protocol volume generated by Meridian agents, and community growth. Monthly impact reports with on-chain verification provided throughout the grant period.

---

*Last Updated: February 2026*
