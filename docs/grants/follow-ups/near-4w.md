# NEAR — 4-Week Follow-Up

**Program:** NEAR Foundation Grants / NEAR Horizon / DevHub
**Contact Channel:** NEAR DevHub / near.org/grants / NEAR Discord
**Submitted:** [SUBMISSION_DATE]

---

**Subject:** Meridian x NEAR — Chain Abstraction for Autonomous Agents + Milestone Update

---

Hi [CONTACT_NAME / NEAR Grants Team],

I'm sharing a substantial update on Meridian since our grant application on [SUBMISSION_DATE]. Over the past month, we've deepened our NEAR integration research and continued shipping infrastructure that aligns with NEAR's chain abstraction vision.

**Major Milestones:**

1. **NEAR Connector Architecture Complete:** We've designed the full NEAR chain connector leveraging `near-api-js` for native NEAR interactions and Aurora's EVM compatibility for access to Ethereum-native DeFi protocols. A single Meridian agent can compose strategies across NEAR-native and Aurora-based protocols seamlessly — chain abstraction in practice.

2. **Access Key Permission Model:** We've architected agent identity on NEAR using the platform's native access key system. Each agent receives function call access keys scoped to specific DeFi contracts, while full access keys remain in secure offline storage. This is more granular and secure than EVM's unlimited approval model.

3. **Multi-Shard Awareness:** Our connector design accounts for NEAR's Nightshade sharding. Agents understand cross-shard transaction finality and can optimize execution timing for operations that span multiple shards, reducing latency for complex multi-step strategies.

4. **Core Framework Validated:** 100+ autonomous trades on EVM testnets with zero failures, proving the agent runtime, risk management, and decision cycle that will power NEAR operations.

**Updated Metrics:**

| Metric | At Submission | Current |
|--------|--------------|---------|
| Codebase | [X] LOC | 19,000+ LOC |
| Tests Passing | [X] | 208 |
| Autonomous Trades | [X] | 100+ (zero failures) |
| Chain Architectures | EVM | EVM + NEAR (in development) |
| Agent Strategies | [X] | 5 (DCA, Rebalancer, Arb, Yield, Liquidation) |

**Ecosystem Validation:**

[If applicable:] We've received [approval / strong interest] from [Arbitrum / Ethereum ESP / other] grant programs. This confirms demand for autonomous agent infrastructure across the blockchain ecosystem. NEAR's chain abstraction layer makes it the ideal coordination point — agents that operate across chains need a home that thinks beyond single-chain silos.

**NEAR-Specific Deliverables (with grant support):**

- **Month 1:** NEAR chain connector — native NEAR transactions, access key management, account creation for agents, Aurora bridge integration
- **Month 2:** Protocol adapters for Ref Finance, Burrow, Meta Pool, and Aurora-based DEXs. Cross-protocol strategy composition across NEAR-native and Aurora DeFi.
- **Month 3:** Agent deployment toolkit for NEAR — CLI commands, BOS component for dashboard access, developer documentation with NEAR-specific examples
- **Month 4:** Multi-agent coordination on NEAR — leveraging NEAR's account model for agent-to-agent communication, cross-chain strategy execution via chain signatures

**Why NEAR:**

NEAR's vision of chain abstraction isn't just a feature — it's a fundamental rethinking of how users and applications interact with blockchain. Meridian embodies this same philosophy for DeFi agents: abstract away the complexity, let the agent focus on the strategy. The combination of NEAR's account model, sharded throughput, chain signatures, and Aurora compatibility creates the most versatile runtime for autonomous agents in DeFi.

We're also excited about the potential to distribute our monitoring dashboard through BOS, making agent management accessible directly through the NEAR ecosystem's decentralized frontend infrastructure.

I'd love to schedule a **15-minute demo and technical discussion** with your team. Seeing agents execute autonomously — and discussing how NEAR's architecture enables capabilities impossible on other chains — would be the most effective use of your time.

- **GitHub:** https://github.com/amitduabits/meridiandefi
- **Website:** meridianagents.xyz

Thank you for NEAR's commitment to supporting innovative builders. We're eager to contribute to the ecosystem's growth.

Best regards,
[YOUR_NAME]
Meridian
[YOUR_EMAIL]
[YOUR_TELEGRAM]

---

## NEAR-Specific Notes

- At 4 weeks, consider reaching out through NEAR Horizon mentors for warm introductions
- NEAR DevHub has regular calls — attending and presenting builds visibility
- Chain signatures and multi-chain accounts are NEAR's latest technical direction — reference if relevant
- NEAR values real builder activity — consider deploying a simple agent on NEAR testnet before this follow-up
- BOS integration angle is compelling for dashboard distribution
- If NEAR Foundation doesn't respond, NEAR DevHub grants may be a faster path
- Proximity Labs and other NEAR ecosystem funds are alternative funding sources
- Position Meridian as driving recurring on-chain activity, not a one-time deployment
