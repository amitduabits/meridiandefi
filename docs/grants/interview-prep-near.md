# Interview Cheat Sheet: NEAR Protocol

**Program:** NEAR AI Agent Fund ($20M), NEAR Foundation grants, NEAR Horizon accelerator
**Typical Range:** $50K-$300K from the AI Agent Fund
**Interview Style:** Product-oriented and vision-driven. NEAR thinks in terms of user experience, abstraction, and mainstream adoption. They want AI agents that make blockchain invisible to end users.

---

## Their Priorities

1. **AI as the frontend** — NEAR's strategic thesis is that AI agents will become the primary interface between users and blockchain. They call this "AI as frontend." This is the single most important framing for a NEAR interview.
2. **Chain abstraction** — NEAR is building toward a world where users don't know or care what chain they're on. Their infrastructure (NEAR Intents, FastAuth, multi-chain signatures) abstracts away chain complexity.
3. **User experience** — NEAR has always been the "UX chain." Named accounts (alice.near), gasless transactions, key management — everything is about removing friction. Your project should extend this ethos.
4. **NEAR Intents** — Their new architecture for cross-chain execution. Users express *intent* ("I want to swap ETH for USDC at the best rate") and the network resolves it. Meridian agents as intent resolvers is a powerful narrative.
5. **Developer onboarding** — NEAR wants more developers building in their ecosystem. SDKs and tooling that lower barriers are highly valued.
6. **Real-world AI integration** — NEAR has made AI a core strategic pillar, not an afterthought. They're funding AI projects at scale and want to be known as the "AI chain."

---

## Recommended Framing

**Lead with "AI as frontend" alignment.**

"NEAR's vision of AI as the frontend is exactly what Meridian enables. Instead of a user navigating DEX interfaces, managing gas tokens, and monitoring positions manually, they tell a Meridian agent their intent: 'Maintain a 60/40 portfolio across stablecoins and ETH.' The agent handles everything — price discovery, execution, risk management, rebalancing — autonomously. The user never touches a swap interface. That's AI as the frontend, realized."

**Connect to NEAR Intents architecture.**

"NEAR Intents let users express what they want without specifying how to do it. Meridian agents are natural intent resolvers — they receive a high-level goal (an intent) and autonomously determine the optimal execution path across protocols and chains. We see Meridian agents plugging directly into the NEAR Intents framework as specialized resolvers for complex DeFi intents that require multi-step reasoning."

**Emphasize chain abstraction.**

"Meridian is inherently multi-chain — our agents execute across Ethereum, Arbitrum, Solana, and more through unified protocol connectors. On NEAR, this means agents can leverage NEAR's chain signatures to execute cross-chain strategies where NEAR is the coordination layer. A single agent on NEAR can manage positions across multiple chains without the user managing bridges, gas tokens, or separate wallets."

**Frame agents as UX innovation, not just infrastructure.**

NEAR doesn't want "another DeFi tool." They want products that make blockchain accessible to normal people. "Meridian agents replace the most confusing part of DeFi — the execution layer — with autonomous intelligence. A user's interaction model goes from 'learn 15 DeFi interfaces' to 'describe your goal in plain English.'"

---

## Names to Know

- **Illia Polosukhin** — Co-founder of NEAR. Also co-author of the "Attention Is All You Need" paper (the Transformer architecture that underpins GPT and Claude). This is enormous credibility for AI-blockchain convergence. Reference it respectfully: "NEAR has a unique position — co-founded by one of the creators of the Transformer architecture. That heritage means AI isn't a marketing angle for NEAR; it's in the DNA."
- **Marieke Flament** — CEO of the NEAR Foundation. Oversees ecosystem funding and strategic direction.
- **Nate Geier** — CEO of Mintbase, active in NEAR AI ecosystem. Connected to AI agent development on NEAR.
- **NEAR AI team** — NEAR has a dedicated AI research team working on agent infrastructure. Acknowledge their work and frame Meridian as complementary, not competitive.
- **Proximity Labs** — DeFi-focused grants and development on NEAR. May be involved in DeFi-AI grant evaluations.

---

## Recent NEAR News to Reference

- **$20M AI Agent Fund** — Announced to fund AI agent projects building on NEAR. Frame this directly: "The $20M AI Agent Fund signals that NEAR is the most committed chain to AI agent infrastructure. Meridian is purpose-built to deliver on that vision."
- **NEAR Intents** — NEAR's intent-centric architecture for cross-chain transactions. This is their flagship technical initiative. Frame Meridian agents as intent resolvers: "Meridian agents can serve as specialized DeFi intent resolvers within the NEAR Intents framework — receiving complex financial intents and executing optimal strategies across protocols."
- **Chain Signatures (multi-chain)** — NEAR's MPC-based system for signing transactions on other chains from a NEAR account. Frame this as an agent capability: "NEAR's chain signatures let a Meridian agent on NEAR execute strategies on Ethereum, Arbitrum, and Solana without maintaining separate wallets on each chain."
- **FastAuth** — Email-based account creation on NEAR. Relevant for agent UX: "Combine FastAuth with Meridian and a new user can go from email signup to running an autonomous DeFi agent in under 5 minutes — no wallet extensions, no seed phrases."
- **NEAR AI assistant** — NEAR is building their own AI assistant. Position Meridian as complementary: "NEAR's AI assistant handles general interactions. Meridian handles specialized financial execution. They're complementary layers in NEAR's AI stack."
- **Illia's "AI as Frontend" presentations** — Illia has been publicly speaking about AI agents as the future of blockchain interfaces. Reference his talks as validation of your thesis.

---

## Technical Integration Points

| Component | NEAR-Specific Detail |
|-----------|---------------------|
| Chain connector | New build: NEAR SDK (near-api-js) + NEAR JSON-RPC integration |
| Smart contracts | Rust-based NEAR contracts (near-sdk-rs) for Agent Registry and Strategy Vault |
| Protocols | Ref Finance (DEX), Burrow (lending), Meta Pool (liquid staking), Orderly Network (perps) |
| Intents integration | Meridian agents as DeFi intent resolvers — receive intent, reason about optimal execution, return result |
| Chain signatures | Leverage NEAR's MPC signatures for cross-chain agent execution from a single NEAR account |
| Account model | NEAR's named accounts (meridian.near, agent-1.meridian.near) enable human-readable agent identity |
| Storage staking | NEAR's storage model requires staking for state — budget for agent state storage costs |

---

## Potential Objections and Responses

**"NEAR is building its own AI tools. How does Meridian fit without overlapping?"**
"NEAR's AI team is building general-purpose AI infrastructure — assistants, model serving, inference. Meridian is domain-specific: autonomous DeFi execution with portfolio context, risk management, and protocol-semantic connectors. We're the financial specialist in NEAR's AI stack. Think of it this way: NEAR AI builds the brain; Meridian trains it for finance."

**"Your demo is on Arbitrum, not NEAR. How committed are you to our ecosystem?"**
"Our Arbitrum deployment proves the core technology works — 100+ autonomous trades, 99.9% uptime, live testnet agent. The NEAR integration is the next priority because NEAR's architecture is uniquely aligned with what Meridian does. NEAR Intents, chain signatures, and the AI-as-frontend thesis are not available on Arbitrum. Building on NEAR unlocks capabilities that don't exist elsewhere."

**"NEAR's DeFi ecosystem is smaller than Ethereum's. Can agents find enough opportunity?"**
"NEAR's DeFi protocols — Ref Finance, Burrow, Meta Pool, Orderly — provide the core primitives agents need: swapping, lending, staking, and perpetuals. What's more important than ecosystem size is the unique opportunity NEAR offers: intent-based execution and cross-chain reach through chain signatures. A Meridian agent on NEAR can manage positions across every major chain from a single NEAR account. That's a capability no other chain offers."

**"How would Meridian integrate with NEAR Intents specifically?"**
"A NEAR Intent expresses a user's goal — 'swap 1000 USDC for ETH at the best rate across three chains.' A Meridian agent can serve as a specialized intent resolver: it receives the intent, reasons about optimal execution (which DEX, which chain, what timing, what slippage tolerance), executes through protocol connectors, and returns the result. The agent brings LLM-powered reasoning to intent resolution, handling complex intents that simple routing algorithms can't optimize."

---

## One-Liner for This Interview

"Meridian is the financial execution layer for NEAR's AI-as-frontend vision — autonomous agents that resolve complex DeFi intents with LLM reasoning, multi-chain reach through chain signatures, and the UX simplicity NEAR is known for."

---

*Internal Use Only | February 2026*
