# NEAR — 2-Week Follow-Up

**Program:** NEAR Foundation Grants / NEAR Horizon / DevHub
**Contact Channel:** NEAR DevHub / near.org/grants / NEAR Discord
**Submitted:** [SUBMISSION_DATE]

---

**Subject:** Meridian — NEAR Grant Follow-Up + Chain Abstraction Progress

---

Hi [CONTACT_NAME / NEAR Grants Team],

I'm following up on Meridian's grant application submitted on [SUBMISSION_DATE]. Meridian is an open-source autonomous agent framework for DeFi, and NEAR's chain abstraction vision aligns perfectly with what we're building.

Since submitting, we've made progress relevant to the NEAR ecosystem:

- **Chain Abstraction Alignment:** Meridian's architecture is inherently multi-chain — agents abstract away chain-specific details behind a unified `IDeFiConnector` interface. This mirrors NEAR's chain abstraction thesis. A Meridian agent doesn't think in terms of chains; it thinks in terms of opportunities, risk, and execution — exactly the UX that chain abstraction enables.
- **NEAR Connector Research:** We've begun designing our NEAR connector using `near-api-js` and Aurora's EVM compatibility layer. Agents will be able to operate natively on NEAR while also accessing Aurora's EVM DeFi through a single unified interface.
- **Production-Grade Foundation:** 100+ autonomous trades on EVM testnets, 19,000+ LOC, 208 passing tests, full TypeScript SDK with strict typing. This battle-tested infrastructure is what we're bringing to NEAR.
- **Account Model Fit:** NEAR's named accounts and access keys map elegantly to agent identity and permission management. We're designing agents to leverage NEAR's account model for fine-grained capability control — function call access keys for specific DeFi operations, with full access keys held securely offline.

NEAR's focus on usability, chain abstraction, and developer experience makes it a natural home for autonomous agent infrastructure. We want to make deploying a DeFi agent on NEAR as simple as deploying a smart contract.

Would your team be open to a **15-minute demo**? I can show our agents in action and walk through our NEAR integration architecture.

We've received interest from EVM-focused grant programs, but NEAR's differentiated architecture and chain abstraction roadmap present a uniquely compelling opportunity for agent infrastructure.

- **GitHub:** https://github.com/amitduabits/meridiandefi
- **Website:** meridianagents.xyz

Looking forward to connecting.

Best regards,
[YOUR_NAME]
Meridian
[YOUR_EMAIL]
[YOUR_TELEGRAM]

---

## NEAR-Specific Notes

- Lead with **chain abstraction** — it's NEAR's core narrative and strategic priority
- Mention Aurora compatibility if planning EVM support on NEAR
- NEAR values UX and developer experience — position Meridian as a DX improvement
- Reference NEAR's account model as an advantage for agent identity
- NEAR Horizon and DevHub are the primary grant channels — know which you applied to
- NEAR community is active on Telegram and the NEAR governance forum
- Consider mentioning NEAR's BOS (Blockchain Operating System) if relevant to dashboard distribution
- Sharding (Nightshade) enables high-throughput agent operations — mention if relevant
