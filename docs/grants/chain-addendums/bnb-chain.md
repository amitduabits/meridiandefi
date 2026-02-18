# BNB Chain Grant Addendum — Meridian Framework

**Program:** BNB Chain Builder Grants (up to $200K)
**Category:** AI / DePIN / DeFi Infrastructure
**Recommended Ask:** $75K--$150K (Tier 2/3)
**Priority:** MEDIUM

---

## A) Ecosystem Customization

BNB Chain's position as the highest-throughput EVM chain by daily active addresses creates a unique opportunity for Meridian. With over 1 million daily active wallets and a DeFi ecosystem spanning PancakeSwap, Venus Protocol, Alpaca Finance, and Biswap, BNB Chain has the user density and protocol depth that autonomous agents need to generate meaningful activity. Meridian's EVM connectors -- built on viem with TypeScript-strict typing -- are natively compatible with BSC, meaning our existing infrastructure (19,000 lines of code, 208 tests, 100+ autonomous trades on Arbitrum Sepolia) deploys to BNB Chain with minimal connector customization. The dedicated PM model that BNB Chain assigns to funded projects aligns well with our milestone-based delivery approach, ensuring tight feedback loops between our engineering team and BNB Chain's ecosystem priorities.

What distinguishes the BNB Chain opportunity is scale of addressable users. Meridian's Strategy DSL and natural-language strategy interface lower the barrier from "senior DeFi developer" to "anyone who can describe a strategy in plain English." On BNB Chain, where the user base skews toward accessibility and practical DeFi use cases rather than technical complexity, this accessibility multiplier is particularly powerful. A Meridian agent managing a PancakeSwap yield farming strategy or a Venus lending optimization can be configured by users who have never written a line of code -- they describe what they want, the LLM translates it to a validated strategy, and the agent executes with pre-flight risk checks on every transaction. For BNB Chain, this means converting its massive user base into autonomous DeFi participants.

## B) Why Build on BNB Chain Specifically

- **Largest EVM user base.** BNB Chain's million-plus daily active addresses represent the largest addressable market for autonomous agent deployment. More users means more strategies deployed, more transactions generated, and more protocol fees earned.
- **Low gas costs enable continuous operation.** BSC's gas economics make tick-based agent execution economically viable even for smaller portfolio sizes, democratizing access to autonomous DeFi strategies beyond whale-only territory.
- **Dedicated project management.** BNB Chain's grant program assigns a dedicated PM to funded projects, providing structured support that accelerates integration with ecosystem protocols and surfaces co-marketing opportunities.

## C) Recommended Funding and Program

**Amount:** $75K--$150K from BNB Chain Builder Grants
**Tier:** Standard/Premium -- SDK with BNB Chain featured, connectors for PancakeSwap V3 + Venus + Alpaca Finance, multi-agent orchestration, backtesting, and agent templates tailored to BSC's top yield protocols.
**Milestone structure:** 3-month delivery with monthly disbursement and dedicated PM check-ins.

## D) Key Contact / Channel

- **BNB Chain Grants Portal:** bnbchain.org/en/developers/developer-programs
- **Primary contact:** BNB Chain Labs developer relations team
- **Engage before applying:** Join the BNB Chain Builder Discord and attend a Builder Spotlight call. Frame Meridian as infrastructure that converts BNB Chain's massive user base into autonomous DeFi participants. Emphasize the AI/DePIN category alignment.

## E) Unique Demo Addition

**Mass-Market Agent Dashboard for BSC.** Deploy a simplified Meridian interface on BNB Chain testnet where non-technical users can describe a DeFi strategy in natural language (e.g., "farm CAKE-BNB on PancakeSwap and auto-compound every 4 hours"), preview the agent's plan with risk assessment, and launch it with one click. Demonstrate how BNB Chain's low gas costs make autonomous strategies accessible to users with portfolios as small as $100.

## F) Pre-Written Application Answers

**Q1: What is your project?**
Meridian is an open-source AI agent framework built for decentralized finance. Agents follow a Sense-Think-Act-Reflect cycle, maintaining persistent portfolio context and executing strategies through typed protocol connectors. Current metrics: 19,000 lines of TypeScript, 208 tests, 100+ autonomous trades on Arbitrum Sepolia, 8 core modules, 4 smart contracts. MIT license. GitHub: https://github.com/amitduabits/meridiandefi

**Q2: Why BNB Chain?**
BNB Chain has the largest EVM user base by daily active addresses, and its low gas costs make continuous agent operation economically viable for portfolios of all sizes. Meridian's accessibility features -- natural language strategy input, Strategy DSL, visual dashboard -- align with BSC's user base, which prioritizes practical DeFi utility over technical complexity.

**Q3: What protocols will you integrate?**
PancakeSwap V3 (DEX, concentrated liquidity, yield farming), Venus Protocol (lending, borrowing, collateral optimization), and Alpaca Finance (leveraged yield farming). Each connector implements our typed IDeFiConnector interface with protocol-semantic methods.

**Q4: How does this fit the AI/DePIN category?**
Meridian agents are autonomous software entities that consume compute resources, make decisions using LLM reasoning, and interact with on-chain infrastructure continuously. The multi-agent orchestration module enables agent-to-agent task delegation with on-chain payment settlement -- a decentralized network of specialized autonomous agents coordinating DeFi strategy execution.

**Q5: What milestones will you deliver?**
Month 1: PancakeSwap V3 + Venus connectors, rebalancing agent on BSC testnet, SDK v0.1 with BNB Chain examples. Month 2: Multi-agent demo, Strategy DSL with BSC templates, natural language strategy interface, backtesting engine. Month 3: SDK v1.0 featuring BNB Chain, documentation, agent templates for PancakeSwap/Venus/Alpaca, impact report.

**Q6: What is your team?**
4-6 core contributors with senior experience in DeFi protocols, infrastructure engineering, and ML systems. Smart contract engineers with audit preparation experience. Scaling to 8-10 by Phase 4.

**Q7: How much are you requesting?**
$75K-$150K. Allocation: 40% engineering (connectors, agent types, NL interface), 25% SDK and documentation, 20% testing and security, 15% developer relations and ecosystem engagement.

**Q8: How will you measure impact?**
Autonomous transactions on BSC testnet/mainnet, unique agents deployed, protocol volume generated, SDK downloads from BSC developers, user adoption of natural language strategy interface. Monthly reports with on-chain verification.

---

*Last Updated: February 2026*
