# Interview Cheat Sheet: Avalanche

**Programs:** Retro9000, Blizzard Fund, Avalanche Foundation grants, Codebase incubator
**Typical Range:** $25K-$200K (Retro9000 retroactive); $50K-$500K (Blizzard Fund)
**Interview Style:** Performance-oriented and subnet-aware. Avalanche evaluates on technical merit, ecosystem contribution, and understanding of their unique multi-chain (subnet) architecture.

---

## Their Priorities

1. **Subnet (now "Avalanche L1") ecosystem** — Avalanche's major differentiator is app-specific chains (subnets/L1s). Projects that leverage or enable subnet deployment get strong preference.
2. **DeFi leadership** — Avalanche was an early DeFi hub (DeFi Summer 2.0). They want to maintain and grow their DeFi position. Agents that drive protocol activity are directly aligned.
3. **Institutional DeFi** — Avalanche has made institutional finance a strategic focus (Spruce, Evergreen subnets). Enterprise-grade infrastructure resonates strongly.
4. **Performance metrics** — Avalanche is fast (sub-second finality on C-Chain). They want projects that showcase and leverage this performance.
5. **Retro9000 model** — Retroactive grants reward projects that have already delivered. If applying to Retro9000, lead with what you've built, not what you plan.
6. **AVAX utility** — Projects that create demand for AVAX (gas, staking, burning) align with token holder interests. The 2024 AVAX burn mechanism means transaction volume directly reduces supply.

---

## Recommended Framing

**Lead with subnet opportunity.**

"Avalanche's subnet architecture is uniquely valuable for AI agent infrastructure. Imagine a dedicated Meridian subnet — an app-specific chain optimized for agent operations: custom gas tokens, configurable block times matched to agent tick intervals, and isolated execution so agent activity doesn't compete with DeFi users for blockspace. No other chain offers this level of customization for autonomous agent networks."

**Emphasize sub-second finality for agent performance.**

"Agent decision cycles need fast, reliable finality. On Ethereum mainnet, an agent waits 12+ seconds for block confirmation. On Avalanche C-Chain, finality is sub-second. That means a Meridian agent can complete a full Sense-Think-Act-Reflect cycle — including on-chain execution and confirmation — in under 3 seconds. Faster finality means agents can react to market opportunities before they close."

**Connect to institutional DeFi narrative.**

"Avalanche has positioned itself as the institutional DeFi chain with Spruce, Evergreen subnets, and partnerships with traditional finance. Meridian brings the intelligence layer that institutions need: autonomous portfolio management with full audit trails, risk controls, circuit breakers, and backtested strategy validation. An institution deploying capital through Meridian agents on Avalanche gets the compliance-ready infrastructure they require."

**Reference the AVAX burn mechanism.**

"Every Meridian agent running on Avalanche C-Chain generates transactions. Under the AVAX burn mechanism, those transaction fees are permanently burned. One hundred agents running diverse strategies create a continuous stream of burns — aligning Meridian's growth directly with AVAX tokenomics. More agents, more burns, more value accrual."

---

## Names to Know

- **Emin Gun Sirer** — Founder and CEO of Ava Labs. Cornell professor, creator of Avalanche consensus. Highly technical — expect rigorous technical questions if he's in the room.
- **John Wu** — President of Ava Labs. Business and strategy lead. Focuses on institutional partnerships and ecosystem growth.
- **Luigi D'Onorio DeMeo** — Head of DeFi and developer relations at Ava Labs. Likely involved in grant evaluations for DeFi projects.
- **Kevin Sekniqi** — Co-founder and COO of Ava Labs. Protocol design and research background.
- **Avalanche Foundation** — The entity managing ecosystem grants, distinct from Ava Labs (the development company).

---

## Recent Avalanche News to Reference

- **Avalanche9000 upgrade** — Major protocol upgrade reducing subnet deployment costs by 99.8% and introducing per-transaction fees on subnets. Frame this: "Avalanche9000 makes subnet deployment economically viable for any project. A dedicated Meridian agent subnet was cost-prohibitive before — now it's a realistic Month 4-6 deliverable."
- **Retro9000 grants** — $40M+ retroactive grant program rewarding builders who ship on Avalanche. If applying here, emphasize already-delivered work: "We've already built the SDK, runtime engine, and protocol connectors. Retro9000 rewards the work that's already done."
- **Institutional focus (Spruce, Evergreen)** — Avalanche's permissioned subnets for institutional DeFi. Frame Meridian as the intelligence layer: "Spruce and Evergreen provide the regulated infrastructure. Meridian provides the autonomous portfolio intelligence institutions need to actually use it."
- **Teleporter (cross-subnet messaging)** — Avalanche's native cross-chain messaging protocol. Frame for multi-agent communication: "Teleporter enables Meridian agents on different subnets to coordinate — an agent on the DeFi subnet communicates with an agent on an institutional subnet through native Avalanche messaging."
- **C-Chain DeFi ecosystem** — Trader Joe (DEX), Benqi (lending), GMX (perps on Avalanche), Platypus, Yield Yak. Name these protocols specifically when discussing agent strategies.

---

## Technical Integration Points

| Component | Avalanche-Specific Detail |
|-----------|--------------------------|
| Chain connector | viem-based, targeting Avalanche C-Chain (EVM compatible) + Fuji testnet |
| Protocols | Trader Joe (DEX — concentrated liquidity), Benqi (lending + liquid staking), Aave V3, GMX, Yield Yak (yield aggregation) |
| Subnet potential | Dedicated Meridian agent subnet with custom gas token and optimized block times |
| Finality | Sub-second finality enables aggressive tick intervals (30-60 second cycles) |
| Cross-subnet | Teleporter integration for multi-agent coordination across subnets |
| AVAX burn | Agent transaction fees burn AVAX, aligning with tokenomics |
| Institutional | Compatible with Evergreen subnet architecture for permissioned agent deployment |

---

## Potential Objections and Responses

**"How does Meridian leverage Avalanche's specific advantages over just being EVM-compatible?"**

"Three ways. First, sub-second finality means our agents can run tighter tick intervals — reacting to opportunities in seconds, not minutes. Second, the subnet architecture opens a possibility no other chain offers: a dedicated agent-optimized chain with custom gas economics and block timing tuned for autonomous operations. Third, Teleporter gives us native cross-subnet messaging for multi-agent coordination, which on other chains requires third-party bridges or custom infrastructure."

**"The Avalanche DeFi ecosystem has shrunk from its peak. Is there enough activity?"**

"Avalanche's DeFi ecosystem may be smaller than its 2021 peak, but the protocols that remain — Trader Joe, Benqi, Aave V3, GMX — are battle-tested and liquid. More importantly, autonomous agents *create* activity. A Meridian agent generating 50+ trades per day on Trader Joe is a persistent source of volume that doesn't depend on market sentiment. We help rebuild the activity flywheel from the infrastructure side."

**"What would a Meridian subnet actually look like?"**

"A dedicated Meridian subnet on Avalanche would have: configurable block times matched to common agent tick intervals (15-60 seconds), a custom gas token (MRDN or AVAX — depending on validator economics), agent-optimized state management (pre-loaded protocol state for faster SENSE phase), and Teleporter integration for cross-chain execution on C-Chain. Post-Avalanche9000, the deployment cost for this is under $1/month in validator costs, making it economically viable from day one."

**"Are you applying for Retro9000 or the Blizzard Fund?"**

For **Retro9000**: "We're applying retroactively for the core SDK, runtime engine, and chain connector infrastructure we've already built and deployed on testnet. The code is public, the tests pass, the agent is running. Retro9000 rewards delivered work, and we've delivered."

For **Blizzard Fund**: "We're applying for a forward-looking partnership to build Avalanche-native agent infrastructure: dedicated protocol connectors for Trader Joe, Benqi, and GMX, a subnet architecture exploration, and developer documentation featuring Avalanche as the primary chain."

---

## One-Liner for This Interview

"Meridian brings autonomous DeFi intelligence to Avalanche — leveraging sub-second finality for real-time agent execution, subnet architecture for dedicated agent infrastructure, and persistent protocol activity that burns AVAX with every decision cycle."

---

*Internal Use Only | February 2026*
