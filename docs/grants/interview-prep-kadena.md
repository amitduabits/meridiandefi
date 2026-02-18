# Interview Cheat Sheet: Kadena

**Program:** Kadena AI Fund ($25M dedicated to AI projects), general ecosystem grants
**Typical Range:** $50K-$500K from the AI fund (larger allocations than most programs)
**Interview Style:** Enterprise-focused, technically rigorous. Kadena's heritage is JP Morgan blockchain (Juno/JPM Coin). They value security, formal verification, and institutional-grade infrastructure.

---

## Their Priorities

1. **AI integration** — The $25M AI fund exists specifically to bring AI projects to Kadena. This is not a generic grant — they are actively seeking AI-native projects. Lean into the AI angle harder than with any other chain.
2. **Enterprise and institutional credibility** — Kadena was founded by former JP Morgan blockchain engineers. They position themselves as the enterprise-grade Layer 1. Frame Meridian as institutional-quality infrastructure.
3. **Pact smart contract ecosystem** — Kadena uses Pact (a Turing-incomplete, formally verifiable smart contract language), not Solidity. This is both a technical challenge and a differentiation opportunity.
4. **Chainweb proof-of-work** — Kadena's multi-chain braided PoW architecture is unique. Understanding and leveraging Chainweb shows genuine technical commitment.
5. **EVM compatibility** — Kadena is adding EVM compatibility to broaden developer access. This is a strategic inflection point — EVM-compatible tools that work on Kadena are extremely valuable to them right now.
6. **Developer ecosystem growth** — Kadena's developer community is smaller than Ethereum's or Solana's. Any project that brings developers to Kadena is disproportionately valuable.

---

## Recommended Framing

**Lead with AI fund alignment.**

"Meridian is exactly the kind of project the Kadena AI Fund was created for — a production-grade AI agent framework that brings autonomous financial intelligence to Kadena's DeFi ecosystem. We're not bolting AI onto a generic tool. We're building the infrastructure that makes Kadena the home of intelligent, autonomous DeFi agents."

**Emphasize enterprise-grade quality.**

"Kadena's heritage is building blockchain infrastructure for JP Morgan — the highest bar for financial technology. Meridian meets that bar: every transaction passes pre-flight risk validation, circuit breakers halt trading on anomalies, strategies are backtested against historical data before deployment, and our contract architecture is designed for professional security audits. This isn't a hackathon project — it's institutional-grade agent infrastructure."

**Acknowledge Pact and show willingness to build native.**

"We're aware that Kadena's smart contract layer uses Pact, which is fundamentally different from Solidity — and that's actually an advantage. Pact's formal verification properties mean Meridian's on-chain contracts on Kadena would have stronger security guarantees than on any EVM chain. We're prepared to port our Agent Registry and Strategy Vault contracts to Pact, and with Kadena's emerging EVM compatibility, our existing Solidity contracts can serve as a bridge for developers coming from other ecosystems."

**Frame the AI fund as a first-mover opportunity.**

"The $25M AI fund positions Kadena as one of the most serious chains about AI integration. Meridian as a Kadena-native agent framework gives developers a reason to build AI-powered DeFi on Kadena specifically — not just because the fund exists, but because the tooling makes it practical."

---

## Names to Know

- **Stuart Popejoy** — Co-founder and CEO of Kadena. Former JP Morgan blockchain lead. Created the Pact language. Technical and business leader.
- **Will Martino** — Co-founder of Kadena. Former lead of JP Morgan's blockchain Center of Excellence (Juno project). Quantitative background.
- **Francesco Melpignano** — CEO of Kadena Eco (the ecosystem development arm). Manages partnerships, grants, and ecosystem growth.
- **Randy Daal** — Head of BD/partnerships at Kadena Eco. Likely involved in AI fund evaluations.
- **Kadena Eco** — The separate entity managing ecosystem development, grants, and the AI fund. Distinct from the core Kadena engineering team.

---

## Recent Kadena News to Reference

- **$25M AI Fund announcement** — This is Kadena's flagship initiative for 2025-2026. Reference it directly: "We were excited to see Kadena commit $25M specifically to AI projects. That level of commitment signals that Kadena is serious about becoming a leader in AI-blockchain convergence."
- **EVM compatibility development** — Kadena is actively building EVM support. Frame this as a perfect entry point: "Kadena's EVM compatibility layer means Meridian's existing Solidity contracts and EVM connectors can deploy on Kadena with minimal adaptation, while we simultaneously build Pact-native contracts for deeper integration."
- **Chainweb performance** — Kadena's multi-chain PoW architecture supports high throughput with predictable block times. Frame this as agent-friendly: "Chainweb's multi-chain architecture means Meridian agents can parallelize transactions across chains for higher throughput — a unique capability no single-chain architecture offers."
- **Marmalade NFT standard** — Kadena's NFT framework. Less relevant for DeFi agents but shows ecosystem awareness if it comes up.
- **Enterprise positioning** — Kadena has been positioning for institutional DeFi. Frame Meridian as the missing piece: "Institutions need autonomous portfolio management with audit trails, risk controls, and formal verification. Kadena's Pact contracts provide the security guarantees. Meridian provides the intelligence layer."

---

## Technical Integration Points

| Component | Kadena-Specific Detail |
|-----------|----------------------|
| Chain connector | New build required: Kadena JS SDK + Chainweb API integration |
| Smart contracts | Dual approach: Pact-native for core contracts (leveraging formal verification), EVM-compatible Solidity for bridge |
| Protocols | Kadena DeFi is earlier-stage: Kaddex (DEX), Kadena Mining Club, emerging lending protocols |
| Architecture fit | Chainweb's 20 parallel chains enable transaction parallelization for multi-agent strategies |
| Pact advantage | Turing-incomplete language eliminates re-entrancy attacks by design — agent contracts are inherently safer |
| EVM bridge | Meridian's existing EVM connector can target Kadena's EVM layer, lowering integration cost |
| Enterprise features | Audit trail logging, formal verification of strategy constraints, compliance-ready reporting |

---

## Potential Objections and Responses

**"Kadena's DeFi ecosystem is smaller than Ethereum's or Arbitrum's. Is there enough for agents to do?"**
"That's exactly the opportunity. Kadena's DeFi ecosystem is growing, and autonomous agents are the most efficient way to bootstrap protocol activity. A dozen Meridian agents running yield optimization, liquidity management, and rebalancing strategies generate persistent volume that helps Kadena's DEXs and lending protocols reach critical mass. We're not waiting for the ecosystem to be mature — we're building tools that help it mature faster."

**"Can you work with Pact? Your stack is Solidity."**
"Our smart contract layer is currently Solidity, and with Kadena's EVM compatibility, that deploys directly. In parallel, we'll build Pact-native versions of our core contracts — Agent Registry and Strategy Vault — specifically to leverage Pact's formal verification. The Pact versions would actually have stronger security properties than our Solidity originals. We see this as an upgrade, not a compromise."

**"How is this different from building a trading bot on Kadena?"**
"A trading bot executes predefined rules. A Meridian agent *reasons*. It reads market context, sends that context to an LLM for analysis, evaluates multiple possible actions with confidence scores, validates through risk checks, and then executes — and it learns from the outcome. It's the difference between a thermostat and a building management system that anticipates weather, occupancy, and energy prices."

---

## One-Liner for This Interview

"Meridian brings institutional-grade AI agent infrastructure to Kadena — leveraging Pact's formal verification for contract security and Chainweb's parallel architecture for agent throughput, directly aligned with the $25M AI Fund's mission."

---

*Internal Use Only | February 2026*
