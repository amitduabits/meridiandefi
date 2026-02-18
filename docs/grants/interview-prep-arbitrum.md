# Interview Cheat Sheet: Arbitrum

**Programs:** Trailblazer Grants, LTIPP (Long Term Incentive Pilot Program), Arbitrum DAO proposals
**Typical Range:** $25K-$250K depending on program track
**Interview Style:** Ecosystem-focused and metrics-driven. They want to see TVL growth, transaction volume, and developer adoption on Arbitrum specifically.

---

## Their Priorities

1. **Native deployment on Arbitrum** — They fund projects that build *on* Arbitrum, not projects that happen to support it as one chain among many. Demonstrate Arbitrum-first commitment.
2. **Protocol activity and TVL growth** — Metrics that make Arbitrum's DeFi ecosystem look healthier: more transactions, more unique addresses, more volume on Arbitrum-native protocols.
3. **Developer acquisition** — Bringing new developers to the Arbitrum ecosystem. SDK adoption, tutorial completion rates, GitHub activity.
4. **Orbit chain ecosystem** — Arbitrum is expanding through Orbit (L3) chains. Projects that support Orbit or work across the Arbitrum stack get extra points.
5. **DeFi depth** — Arbitrum has the deepest DeFi ecosystem among L2s. They want projects that strengthen their DeFi moat: more sophisticated strategies, better tooling, more volume for their flagship protocols.
6. **Transparency and reporting** — DAO governance means everything is public. Detailed milestone reporting, on-chain verification, and community updates are expected.

---

## Recommended Framing

**Lead with your live testnet deployment.**

"We're already live on Arbitrum Sepolia. Our rebalancing agent has executed 100+ autonomous trades through Uniswap V3 on Arbitrum, maintaining less than 2% portfolio drift over 30 days. This isn't a proposal to start building — it's a proposal to scale what's already working."

**Emphasize Arbitrum's DeFi dominance as a strategic fit.**

"Arbitrum has the deepest DeFi liquidity of any L2 — Uniswap V3, Aave V3, GMX, Camelot, Radiant. That depth is exactly what autonomous agents need: deep liquidity for low-slippage execution, diverse protocols for multi-strategy agents, and low gas costs for high-frequency decision cycles. Meridian on Arbitrum isn't just compatible — it's optimized."

**Name their protocols specifically.**

Grant reviewers notice when you name their ecosystem's protocols. For Arbitrum, hit these: **Uniswap V3** (already integrated), **GMX** (perps — unique to Arbitrum's DeFi identity), **Aave V3**, **Camelot** (native DEX), **Radiant** (cross-chain lending), **Pendle** (yield trading).

**Frame agents as persistent protocol users.**

"Every Meridian agent deployed on Arbitrum is a 24/7 protocol user generating swap fees on Uniswap, lending interest on Aave, and trading volume on GMX. One hundred agents running diverse strategies creates more sustained protocol activity than a thousand one-time users."

---

## Names to Know

- **Steven Goldfeder** — CEO of Offchain Labs (Arbitrum's core development team). Computer science background, Princeton PhD.
- **Ed Felten** — Co-founder of Offchain Labs. Former White House Deputy CTO. Deep technical credibility.
- **Arbitrum Foundation** — The entity that manages the ecosystem fund and grant programs.
- **Plurality Labs** — Manages some Arbitrum grant programs (LTIPP administration).
- **Key DAO delegates** — Active governance participants who influence grant approvals. Follow Arbitrum governance forum for current delegate positions.

---

## Recent Arbitrum News to Reference

- **Arbitrum Orbit expansion** — Orbit allows anyone to launch L3 chains on Arbitrum. Frame Meridian as compatible with the broader Arbitrum stack: "Meridian agents can operate on Arbitrum One today and extend to Orbit chains as they launch — same connector, same SDK, broader reach."
- **Arbitrum Stylus** — Allows smart contracts written in Rust, C, and C++ alongside Solidity. Mention awareness: "As Stylus matures, Meridian's contract layer can leverage Rust-based contracts for gas-optimized agent operations."
- **ARB token and DAO governance** — Arbitrum governance is active and well-funded. The DAO treasury is one of the largest in crypto. Frame your grant as a responsible use of DAO funds with milestone-based accountability.
- **DeFi activity metrics** — Arbitrum consistently leads L2s in DeFi TVL. Reference this: "Arbitrum's $X billion in DeFi TVL provides the liquidity depth that autonomous agents need for reliable execution."
- **GMX V2 launch** — GMX is Arbitrum's flagship native protocol. If you can build an agent that interacts with GMX (perpetuals, GLP), that's a strong signal of ecosystem commitment.

---

## Technical Integration Points

| Component | Arbitrum-Specific Detail |
|-----------|------------------------|
| Chain connector | viem-based, Arbitrum One + Sepolia. Already built and deployed. |
| Protocols (live) | Uniswap V3 — swap execution with slippage protection |
| Protocols (roadmap) | GMX V2 (perps agent), Aave V3 (lending optimizer), Camelot (native DEX), Pendle (yield) |
| Gas optimization | Arbitrum's low gas enables high-frequency tick intervals (every 1-5 minutes economically) |
| MEV protection | Flashbots integration; Arbitrum's sequencer ordering also provides partial MEV protection |
| Testnet | Already running on Arbitrum Sepolia with 100+ autonomous transactions |
| Orbit compatibility | Same EVM connector works on Orbit L3 chains |

---

## Potential Objections and Responses

**"You're applying to other chains too. How committed are you to Arbitrum?"**
"Arbitrum is our primary chain — it's where we built first, where we have our live testnet deployment, and where our flagship demo runs. Other chains are on the roadmap precisely because Meridian is multi-chain by design, but Arbitrum has first-mover advantage in our ecosystem: the deepest connector integrations, the most tested agent strategies, and the most documentation examples. This grant would cement that position."

**"How do you generate sustained activity, not just grant-funded transactions?"**
"Meridian agents are autonomous and persistent — once deployed, they run continuously without human intervention. Each agent is a permanent protocol user. The grant funds the infrastructure; the agents themselves generate sustained activity indefinitely. Our 30-day burn-in demonstrates this: 127 rebalances with 99.9% uptime, completely unattended."

**"What about GMX integration?"**
"GMX perpetuals are on our Month 2 roadmap — a delta-neutral agent that harvests funding rates across GMX and Aave. This is one of Arbitrum's unique DeFi opportunities (GMX is Arbitrum-native) and it's exactly the kind of protocol-specific agent that makes Meridian valuable to your ecosystem."

---

## One-Liner for This Interview

"Meridian is already live on Arbitrum with 100+ autonomous trades on Uniswap V3 — this grant scales that to a full SDK, multi-agent orchestration, and GMX integration that turns Arbitrum into the home of autonomous DeFi."

---

*Internal Use Only | February 2026*
