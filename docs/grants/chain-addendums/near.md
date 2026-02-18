# NEAR Protocol Grant Addendum — Meridian Framework

**Program:** NEAR AI Agent Fund ($20M)
**Category:** AI Agent Infrastructure (Core Alignment)
**Recommended Ask:** $100K--$200K (Tier 2/3)
**Priority:** HIGH

---

## A) Ecosystem Customization

NEAR Protocol has made a strategic commitment that no other Layer 1 has matched: positioning the entire chain as infrastructure for autonomous AI agents. The $20M AI Agent Fund is not a side initiative -- it reflects NEAR's core thesis that the next generation of on-chain activity will be driven by agents, not humans clicking buttons. Meridian is the DeFi-specific realization of that thesis. Our framework provides the intelligence layer that turns NEAR's chain-level agent infrastructure into a functioning autonomous financial ecosystem. With 19,000 lines of production code, 208 passing tests, 100+ autonomous trades on Arbitrum Sepolia, and a complete Sense-Think-Act-Reflect decision architecture, Meridian delivers what the NEAR AI Agent Fund was created to fund: production-grade agent infrastructure that generates persistent, intelligent on-chain activity.

The alignment between NEAR's vision and Meridian's architecture runs deeper than surface-level "AI + blockchain" overlap. NEAR's account model -- human-readable names, multi-key access control, and contract-based accounts -- is structurally suited for agent identity management. Each Meridian agent can own a NEAR account with granular key permissions: a function-call access key for DeFi protocol interactions, a separate key for agent-to-agent communication, and a full-access key held in secure custody. NEAR's named accounts (e.g., `rebalancer.meridian.near`) provide legible on-chain identity for agents, making it possible to build reputation systems, permission hierarchies, and accountability structures that are impossible on chains where agents are anonymous addresses. Combined with Ref Finance for DEX operations and Burrow for lending, NEAR offers a complete DeFi substrate for Meridian's multi-agent orchestration engine.

## B) Why Build on NEAR Specifically

- **Maximum strategic alignment.** NEAR has committed $20M specifically to AI agent infrastructure. Meridian is not adapting a general-purpose tool to fit NEAR's narrative -- our entire framework was built for exactly the use case NEAR is funding. This is the highest alignment-per-dollar opportunity in our pipeline.
- **Account model enables agent identity.** NEAR's named accounts, multi-key access control, and contract-based accounts solve the agent identity problem that every other chain forces developers to work around. Each Meridian agent gets a legible, permissioned on-chain identity.
- **Chain-level commitment to agents.** NEAR's roadmap includes chain abstraction, account aggregation, and intent-based transactions -- all features that directly benefit autonomous agent operations. Building on NEAR means building on a chain that is actively optimizing for our use case.

## C) Recommended Funding and Program

**Amount:** $100K--$200K from the NEAR AI Agent Fund
**Tier:** Premium (Tier 3) -- Full NEAR integration including account-based agent identity, connectors for Ref Finance + Burrow + Meta Pool, multi-agent orchestration with NEAR-native payment settlement, ML-powered market analysis, custom agent types for NEAR DeFi, and SDK with NEAR as the primary featured chain.
**Milestone structure:** 6-month engagement with monthly disbursement (15/20/20/15/15/15 split) and quarterly independent review.

## D) Key Contact / Channel

- **NEAR AI Agent Fund:** near.org/ecosystem/ai
- **Primary contact:** NEAR Foundation AI grants team
- **Engage before applying:** Publish a post on the NEAR governance forum (gov.near.org) outlining the Meridian-NEAR integration thesis. Attend NEAR's AI Agent community calls. Connect with the NEAR Foundation's AI leads directly. This is a high-priority application that warrants pre-submission relationship building.

## E) Unique Demo Addition

**NEAR-Native Agent Identity and Reputation System.** Deploy a Meridian multi-agent portfolio on NEAR testnet where each agent has a named account (`scout.meridian.near`, `risk.meridian.near`, `executor.meridian.near`), granular key permissions for different operations, and an on-chain reputation score based on historical performance. Demonstrate how NEAR's account model enables verifiable agent identity, permissioned coordination, and transparent accountability -- capabilities that are structurally impossible on anonymous-address chains.

## F) Pre-Written Application Answers

**Q1: What are you building?**
Meridian is an open-source AI agent framework purpose-built for decentralized finance. Agents follow a Sense-Think-Act-Reflect decision cycle with persistent portfolio context, LLM-powered reasoning, and typed protocol connectors. The framework includes 8 core modules (runtime engine, LLM integration, chain connectors, strategy engine, memory system, agent communication, risk management, monitoring dashboard), 4 smart contracts, 19,000 lines of TypeScript, and 208 passing tests. We have executed 100+ autonomous trades on Arbitrum Sepolia. MIT license.

**Q2: Why is NEAR the right chain for Meridian?**
NEAR's account model is the only L1 architecture that natively supports agent identity -- named accounts, multi-key permissions, and contract-based access control solve problems that every other chain forces developers to engineer around. NEAR's strategic commitment to AI agents through the $20M fund and chain-level roadmap (chain abstraction, intent-based transactions) means we are building on a chain that is actively optimizing for autonomous agent workloads.

**Q3: How does Meridian differ from other AI agent projects?**
Meridian is DeFi-native. ElizaOS targets social agents, GOAT provides stateless blockchain actions, Virtuals is a token launchpad. Meridian is the only framework where every agent maintains persistent financial state, reasons about portfolio risk in real time, executes through protocol-semantic connectors, and coordinates with other agents via P2P communication with on-chain payment settlement.

**Q4: What NEAR protocols will you integrate?**
Ref Finance (DEX operations, AMM liquidity management), Burrow (lending, borrowing, collateral optimization), and Meta Pool (liquid staking, stNEAR yield strategies). Each connector implements our typed IDeFiConnector interface.

**Q5: What is your 6-month roadmap for NEAR?**
Months 1-2: NEAR chain connector, Ref Finance + Burrow integration, agent identity system using NEAR accounts, rebalancing agent on testnet. Months 3-4: Multi-agent orchestration with NEAR-native payment, Strategy DSL with NEAR templates, ML model integration, custom agent types. Months 5-6: SDK v1.0 featuring NEAR, security review, strategy marketplace on NEAR, developer sub-program, comprehensive impact assessment.

**Q6: How does multi-agent coordination work on NEAR?**
Meridian agents communicate via libp2p (off-chain signaling) and settle payments on-chain using NEAR's native token transfers. Agent-to-agent task delegation -- for example, a portfolio manager agent delegating yield scouting to a specialist agent -- is coordinated off-chain for speed and settled on-chain for accountability. NEAR's named accounts make these interactions human-readable and auditable.

**Q7: What metrics will you report?**
Agents deployed on NEAR, autonomous transactions, protocol volume generated through Ref/Burrow/Meta Pool, unique developer signups, SDK downloads, agent reputation scores, and ecosystem contribution. Monthly on-chain verified reports and quarterly comprehensive impact assessments.

**Q8: Is the project open source?**
Yes. MIT license. GitHub: https://github.com/amitduabits/meridiandefi. All NEAR-specific connectors, agent identity modules, and documentation will be published as open-source packages.

---

*Last Updated: February 2026*
