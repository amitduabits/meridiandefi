# Sui Grant Addendum — Meridian Framework

**Program:** Sui Foundation Grants ($10K--$250K)
**Category:** DeFi Infrastructure / AI + Move
**Recommended Ask:** $50K--$100K (Tier 2)
**Priority:** MEDIUM

---

## A) Ecosystem Customization

Sui's object-centric data model fundamentally changes how autonomous agents can interact with on-chain state. In EVM chains, agents operate on shared global state through contract calls. On Sui, every asset, position, and configuration is a first-class object with its own identity, ownership, and access control. For Meridian agents, this means each agent can own its portfolio positions as discrete objects, delegate specific objects to sub-agents with granular permissions, and compose strategies by transferring object ownership between specialized agents. This is not a cosmetic difference -- it is an architectural advantage that makes agent-managed DeFi more secure, more composable, and more auditable than anything possible on account-model chains.

Sui's parallel transaction execution and sub-second finality provide the throughput Meridian agents need for high-frequency strategy execution. Our decision cycle -- Sense, Think, Act, Reflect -- currently operates at under 3 seconds on EVM chains. On Sui, with parallel execution of non-conflicting transactions, multiple agents can execute simultaneously without contention, and the object model ensures that agents operating on different portfolio objects never block each other. Combined with Sui's DeFi ecosystem (Cetus for concentrated liquidity, Scallop for lending, Turbos for AMM), the technical foundation exists for Meridian to deliver autonomous agent infrastructure that leverages Sui's unique architecture rather than merely running on it. For the Sui Foundation, this represents infrastructure that showcases the practical advantages of the Move object model for real financial use cases.

## B) Why Build on Sui Specifically

- **Object model enables agent identity and ownership.** Each Meridian agent can own portfolio positions as discrete Sui objects with typed access control. Agents can delegate specific objects to sub-agents, transfer ownership during task handoff, and maintain verifiable on-chain identity -- capabilities the object model provides natively.
- **Parallel execution eliminates agent contention.** Sui's parallel transaction processing means multiple Meridian agents operating on different portfolio objects execute simultaneously without blocking each other, enabling true multi-agent concurrency.
- **Move's type safety complements Meridian's architecture.** Move's resource-oriented type system ensures that agent-managed assets cannot be duplicated, accidentally destroyed, or accessed without proper authorization -- safety guarantees enforced at the language level.

## C) Recommended Funding and Program

**Amount:** $50K--$100K from Sui Foundation Grants
**Tier:** Standard (Tier 2) -- Sui Move connector suite (Cetus, Scallop, Turbos), object-based agent identity system, SDK with Sui examples, multi-agent orchestration using Sui's object ownership model, and backtesting engine.
**Milestone structure:** 3-month delivery with monthly disbursement (30/40/30 split).

## D) Key Contact / Channel

- **Sui Grants Portal:** sui.io/grants
- **Primary contact:** Sui Foundation developer grants team
- **Engage before applying:** Engage in Sui's developer Discord and participate in the DeFi and infrastructure channels. Attend a Sui Builder House event. Frame Meridian as infrastructure that demonstrates the practical superiority of the object model for agent-managed finance -- a narrative the Sui Foundation actively promotes.

## E) Unique Demo Addition

**Object-Owned Agent Portfolio System.** Deploy a Meridian multi-agent portfolio on Sui testnet where each agent owns its positions as discrete Sui objects. Demonstrate object-level delegation: a portfolio manager agent transfers a lending position object to a yield optimizer agent, which manages it independently and returns it with accrued yields. Publish a technical comparison showing how Sui's object model enables agent patterns (ownership transfer, granular delegation, concurrent execution) that require complex workarounds on account-model chains.

## F) Pre-Written Application Answers

**Q1: What are you building?**
Meridian is an open-source AI agent framework purpose-built for DeFi. Agents maintain persistent portfolio context, reason about positions and risk using LLM analysis, and execute strategies through typed protocol connectors with pre-execution risk simulation. Current metrics: 19,000 lines of TypeScript, 208 tests, 100+ autonomous trades on Arbitrum Sepolia, 8 core modules, 4 smart contracts. MIT license.

**Q2: Why Sui?**
Sui's object-centric model maps naturally to agent-owned portfolio management. Each position, asset, and configuration becomes a typed object with ownership semantics that Move enforces at the language level. Parallel execution enables true multi-agent concurrency. These are not features we have to build around -- they are features we build on top of.

**Q3: How will Meridian use Move?**
We will develop Move modules for agent identity (each agent is an object with capability-based permissions), portfolio management (positions as owned objects), and inter-agent coordination (object transfer for task delegation). The Move connector will implement our IDeFiConnector interface, abstracting Cetus, Scallop, and Turbos behind typed protocol-semantic methods.

**Q4: What Sui protocols will you integrate?**
Cetus (concentrated liquidity management), Scallop (lending and borrowing), and Turbos (AMM operations). Each connector provides typed methods for swap, addLiquidity, removeLiquidity, borrow, repay, stake, getPrice, getBalance, getPositions, and simulate.

**Q5: What are your milestones?**
Month 1: Sui Move modules for agent identity, Cetus + Scallop connectors, rebalancing agent on testnet. Month 2: Multi-agent orchestration using object ownership transfer, Strategy DSL with Sui templates, Turbos integration, backtesting engine. Month 3: SDK v1.0 with Sui examples, full documentation, object-model comparison report, agent templates, impact metrics.

**Q6: How does this benefit the Sui ecosystem?**
Meridian demonstrates practical, high-value use cases for Sui's object model that go beyond token transfers. Autonomous agents managing DeFi portfolios as owned objects showcases Move's resource safety, parallel execution, and composability -- a reference implementation that Sui's developer relations can promote as proof of the architecture's advantages.

**Q7: Is the project open source?**
Yes. MIT license. GitHub: https://github.com/amitduabits/meridiandefi. All Sui-specific Move modules and connectors will be published as open-source packages.

---

*Last Updated: February 2026*
