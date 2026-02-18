# Starknet Grant Addendum — Meridian Framework

**Program:** Starknet Foundation Grants (up to $1M)
**Category:** DeFi Infrastructure / ZK-Native Agent Execution
**Recommended Ask:** $100K--$250K (Tier 3)
**Priority:** HIGH

---

## A) Ecosystem Customization

Starknet's zk-STARK proving system and Cairo programming language represent the most mathematically rigorous execution environment in blockchain. For Meridian, this means something no other chain can offer: the ability to write agent strategies in Cairo, compile them to provable programs, and generate cryptographic proofs that every trade decision, every risk check, and every portfolio rebalance was executed exactly as the strategy specified. This is not incremental improvement over existing agent frameworks -- it is a category change from "auditable agents" to "provably correct agents." Meridian's 100+ autonomous trades on Arbitrum Sepolia demonstrate that our Sense-Think-Act-Reflect architecture produces consistent, reliable agent behavior. On Starknet, that behavior becomes mathematically verifiable.

The Starknet DeFi ecosystem -- Ekubo for concentrated liquidity, zkLend for lending, AVNU for aggregation, and Nostra for money markets -- provides the protocol substrate that Meridian agents need to execute meaningful strategies. Cairo's type system and deterministic execution model align with Meridian's architecture philosophy: every input is validated, every output is typed, every state transition is explicit. Our Strategy DSL, currently parsed via PEG grammar and executed in isolated sandboxes, can be extended to target Cairo compilation, producing strategies that are both human-readable and zero-knowledge provable. For the Starknet Foundation, funding Meridian means funding the first framework where autonomous DeFi agents are not just intelligent but provably trustworthy -- a capability that positions Starknet as the definitive chain for institutional-grade autonomous finance.

## B) Why Build on Starknet Specifically

- **Provably correct agent execution.** Starknet's zk-STARK system can prove that an agent executed its strategy exactly as declared. This is the highest standard of trustless verification available in blockchain -- agents whose behavior is mathematically guaranteed, not just logged.
- **Cairo-native strategy compilation.** Meridian's Strategy DSL can compile to Cairo, producing provable strategy programs that run natively in Starknet's execution environment. No other chain offers a path from human-readable strategy to zero-knowledge proof of execution.
- **Largest ZK grant capacity.** Starknet Foundation grants scale up to $1M, with a track record of funding ambitious infrastructure projects. The funding range matches the scope required for deep Cairo integration, security review, and production deployment.

## C) Recommended Funding and Program

**Amount:** $100K--$250K from Starknet Foundation Grants
**Tier:** Premium (Tier 3) -- Cairo-native strategy modules, Starknet DeFi connectors (Ekubo, zkLend, AVNU, Nostra), ZK-proven strategy execution proof-of-concept, multi-agent orchestration, ML integration, security review, and SDK with Starknet as a primary featured chain.
**Milestone structure:** 6-month engagement with monthly disbursement (15/20/20/15/15/15 split) and quarterly independent review.

## D) Key Contact / Channel

- **Starknet Grants Portal:** starknet.io/grants
- **Primary contact:** Starknet Foundation grants committee
- **Engage before applying:** Publish a technical post on the Starknet community forum outlining the Cairo strategy compilation thesis. Attend StarkWare Sessions or a Starknet community call. Connect with the Starknet DeFi working group. This is a high-priority, high-value application that requires pre-submission technical credibility.

## E) Unique Demo Addition

**Cairo-Compiled Provable Strategy Execution.** Develop a Meridian strategy written in the Strategy DSL, compiled to Cairo, and executed on Starknet testnet with a generated zk-STARK proof that the strategy was followed exactly. Publish the full pipeline: DSL source, Cairo compilation output, execution trace, and verification proof. This demonstrates the first end-to-end path from human-readable DeFi strategy to zero-knowledge proven execution -- a capability unique to Starknet.

## F) Pre-Written Application Answers

**Q1: What are you building?**
Meridian is an open-source AI agent framework purpose-built for DeFi. Agents follow a Sense-Think-Act-Reflect decision cycle with persistent portfolio context, LLM-powered reasoning, protocol-semantic connectors, and pre-execution risk simulation. The framework includes 8 core modules, 4 smart contracts, 19,000 lines of production TypeScript, 208 passing tests, and 100+ autonomous trades on Arbitrum Sepolia. MIT license. GitHub: https://github.com/amitduabits/meridiandefi

**Q2: Why Starknet?**
Starknet is the only chain where agent strategy execution can be zero-knowledge proven. Cairo's deterministic execution model and zk-STARK proving system enable a pipeline from human-readable strategy (our DSL) to mathematically verified execution -- the highest standard of trustless autonomous finance. No other chain offers this capability at the protocol level.

**Q3: What is the Cairo integration plan?**
Phase 1: Starknet DeFi connectors in TypeScript (Ekubo, zkLend, AVNU, Nostra) for immediate agent deployment. Phase 2: Cairo modules for core agent operations (risk checks, portfolio rebalancing logic, position management). Phase 3: Strategy DSL-to-Cairo compiler that produces provable strategy programs, with zk-STARK verification of execution correctness.

**Q4: What Starknet protocols will you integrate?**
Ekubo (concentrated liquidity, AMM operations), zkLend (lending, borrowing, collateral management), AVNU (DEX aggregation, optimal routing), and Nostra (money markets, yield strategies). Each connector implements typed protocol-semantic methods.

**Q5: What are your milestones?**
Months 1-2: Starknet connectors (Ekubo, zkLend, AVNU), rebalancing agent on testnet, Cairo module prototypes. Months 3-4: Multi-agent orchestration, Strategy DSL with Starknet templates, Cairo strategy compilation POC, ML model integration. Months 5-6: ZK-proven execution demo, SDK v1.0 featuring Starknet, security review, Nostra integration, comprehensive impact assessment.

**Q6: How does provable execution change DeFi agents?**
Current agent frameworks require trust: users trust that the agent code matches its description, that it was not modified, and that it executed correctly. On Starknet, trust is replaced by proof. A zk-STARK proves that the agent followed its declared strategy for every single transaction. This transforms autonomous DeFi from "trust the developer" to "verify the math."

**Q7: What is your team's Cairo experience?**
Our team includes engineers with experience in typed language design, formal verification concepts, and compiler development. We will deepen Cairo-specific expertise during the grant period and engage with Starknet's developer community for review and feedback on our Cairo modules.

**Q8: How will you measure success?**
Autonomous transactions on Starknet testnet/mainnet, Cairo module correctness (formal property testing), zk-STARK proof generation and verification benchmarks, SDK downloads, developer adoption, protocol volume generated. Monthly reports with on-chain verification and quarterly comprehensive reviews.

---

*Last Updated: February 2026*
