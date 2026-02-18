# Interview Cheat Sheet: Ethereum Foundation (ESP)

**Program:** Ecosystem Support Program (ESP)
**Typical Range:** $50K-$200K for infrastructure grants
**Interview Style:** Technical and values-driven. They care deeply about public goods, decentralization, and long-term Ethereum alignment.

---

## Their Priorities

1. **Public goods infrastructure** — Tools that benefit the entire ecosystem, not a single product. Open source is non-negotiable.
2. **Decentralization** — They want to fund things that make Ethereum more decentralized, not more centralized. Agent frameworks that rely on centralized servers raise flags.
3. **Developer experience** — Reducing barriers for Ethereum developers. SDKs, tooling, documentation.
4. **Ecosystem diversity** — They actively fund projects in underserved areas. AI-DeFi agent infrastructure is relatively greenfield.
5. **Research rigor** — They value projects that contribute publishable research, benchmarks, and open data.
6. **Long-term thinking** — ESP is not about quick ROI. They fund infrastructure that compounds value over 3-5 years.

---

## Recommended Framing

**Lead with public goods, not product.**

"Meridian is public goods infrastructure for the Ethereum DeFi ecosystem. The entire framework is MIT-licensed and open source. Every protocol connector, every agent template, every line of the SDK is freely available. We're not building a product with a proprietary moat — we're building the shared intelligence layer that any Ethereum developer can use to create autonomous DeFi agents."

**Emphasize decentralization of agent infrastructure.**

"Most AI agent solutions centralize decision-making on a single server. Meridian agents communicate peer-to-peer via libp2p. The Agent Registry is on-chain. Strategy execution happens in isolated sandboxes. We're building toward a future where DeFi agent infrastructure is as decentralized as DeFi itself."

**Frame AI as augmenting, not replacing, human participation.**

The Ethereum Foundation values human sovereignty. Frame agents as tools that empower individual users, not as replacements. "Meridian lets a solo developer manage a portfolio with the sophistication of a trading desk. It democratizes access to financial intelligence."

**Reference EIP standards and Ethereum-native tooling.**

Show that you're building on Ethereum's stack, not fighting it. Mention viem (not ethers), ERC-4626 vaults, ERC-721 for agent identity, and compatibility with Ethereum's account abstraction roadmap (ERC-4337).

---

## Names to Know

- **Aya Miyaguchi** — Executive Director of the Ethereum Foundation. Sets strategic direction.
- **Josh Stark** — Leads ESP. Deeply involved in grant evaluation.
- **Danny Ryan** — Core researcher (consensus layer). Influential in technical assessments.
- **Tim Beiko** — EIP editor and AllCoreDevs coordinator. Understands protocol-level integration.
- **Vitalik Buterin** — Obviously. Reference his writings on AI safety and autonomous agents if relevant — he's been thinking about this publicly.

---

## Recent Ethereum News to Reference

- **Dencun upgrade (EIP-4844)** — Blob transactions dramatically reduced L2 costs. Frame this as making agent-heavy strategies economically viable: "EIP-4844 reduced L2 transaction costs by 10-100x. That means an agent running 100 autonomous trades per day on an Ethereum L2 costs pennies, not dollars. The timing for agent infrastructure is now."
- **Account Abstraction (ERC-4337)** — Growing adoption of smart contract wallets. Meridian agents can leverage AA for batched transactions, gas sponsorship, and programmable wallet logic.
- **The Surge / Rollup-centric roadmap** — Ethereum's commitment to scaling through L2s. Frame Meridian's L2-first deployment strategy as aligned with Ethereum's roadmap.
- **AI x Crypto discourse** — Vitalik has written about AI agents interacting with crypto. Reference this as validation of the thesis.

---

## Technical Integration Points

| Component | Ethereum-Specific Detail |
|-----------|-------------------------|
| Chain connector | viem-based, targeting Ethereum mainnet + Sepolia testnet |
| Protocols | Uniswap V3, Aave V3, Lido, Curve, Compound V3, Maker |
| Smart contracts | Deployed on Ethereum (Agent Registry uses ERC-721, Strategy Vault uses ERC-4626) |
| MEV protection | Flashbots Protect integration for private transaction submission |
| Account abstraction | Compatible with ERC-4337 bundlers for advanced wallet operations |
| L2 compatibility | Same connector works on Arbitrum, Optimism, Base (EVM-equivalent) |

---

## Potential Objections and Responses

**"Why not just build on an L2?"**
"We are deploying on L2s for agent execution — that's where the economics make sense for high-frequency strategies. But the core contracts (Agent Registry, governance) benefit from Ethereum mainnet's security and composability. Our architecture is designed for L1 settlement with L2 execution."

**"How does this differ from existing Ethereum developer tooling?"**
"Existing tools — viem, wagmi, ethers — are transaction-level primitives. Meridian operates at the strategy level. A developer using viem still needs to build their own decision logic, risk management, memory, and execution pipeline. Meridian provides all of that out of the box, with viem under the hood."

**"Is this a public good or a product?"**
"The infrastructure is a public good — MIT licensed, no usage fees on the SDK or runtime. The marketplace layer on top is a product, similar to how Ethereum itself is a public good but services built on it are businesses. One funds the other."

---

## One-Liner for This Interview

"Meridian is public goods infrastructure that gives every Ethereum developer the ability to build autonomous DeFi agents — open source, decentralized, and aligned with Ethereum's rollup-centric roadmap."

---

*Internal Use Only | February 2026*
