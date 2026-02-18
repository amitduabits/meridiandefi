# Grant Proposal — Pre-Submission Checklist

Use this checklist for every grant application. Complete each phase sequentially. Do not submit until all items in Phases 1-3 are checked.

---

## Phase 1: Research (1-2 days before writing)

### Understand the Grant Program
- [ ] Read the grant program's full documentation, FAQ, and eligibility criteria
- [ ] Identify the program's funding range and confirm it matches our target tier (Tier 1: $5K-$15K, Tier 2: $50K-$150K, Tier 3: $100K-$250K)
- [ ] Note the program's stated priorities (infrastructure, developer tooling, research, ecosystem growth, etc.)
- [ ] Identify the review committee or decision-makers, if publicly listed
- [ ] Find the application deadline and plan submission 2-3 days early (avoid last-day technical issues)

### Study Past Winners
- [ ] Review 5-10 previously funded projects in the same program
- [ ] Note common themes in successful proposals (scope, budget size, milestone structure, deliverable types)
- [ ] Identify any patterns in rejection (over-scoped, under-delivered, poor milestone definition)
- [ ] Check if any AI agent or DeFi infrastructure projects have been funded — study their framing

### Community Engagement
- [ ] Join the grant program's Discord/Telegram if one exists
- [ ] Introduce the project in relevant channels (briefly, not spammy)
- [ ] Ask clarifying questions about the program scope or evaluation criteria if anything is ambiguous
- [ ] Check if the program has office hours or AMA sessions — attend if timing allows
- [ ] Follow the grant program's Twitter/X account and engage with their content

### Competitive Intelligence
- [ ] Check if competing projects (ElizaOS, GOAT, other agent frameworks) have applied to this program
- [ ] If competitors were funded, note what they proposed and how we differentiate
- [ ] If competitors were rejected, understand why and avoid the same pitfalls

---

## Phase 2: Preparation (2-3 days)

### Customize the Master Proposal
- [ ] Copy `master-proposal.md` and rename for the specific program (e.g., `arbitrum-trailblazer-proposal.md`)
- [ ] Replace all `[CHAIN]` placeholders with the target chain name
- [ ] Replace `[DEX]`, `[LENDING]`, `[YIELD]` with the chain's flagship protocols
- [ ] Replace `[AMOUNT]` with the specific ask amount (within the program's range)
- [ ] Replace `[TEAM_PLACEHOLDER]` with actual team information
- [ ] Replace `[ADVISOR_*]` placeholders with real advisor names or remove the section
- [ ] Replace `[ADDRESSES]` with actual deployed contract addresses
- [ ] Adjust milestone deliverables to match the program's priorities
- [ ] Review the value-to-ask ratio — ensure perceived value is 3-5x the ask
- [ ] Adjust budget breakdown percentages if the program has specific allocation requirements
- [ ] Trim or expand sections based on the program's word limits or format requirements

### Prepare Form Answers
- [ ] Draft short-form answers (1-2 sentences) for common application fields:
  - Project name and one-line description
  - Team size and key backgrounds
  - Requested amount and grant tier
  - Expected timeline
  - Previous funding received (if any)
  - Open-source license
- [ ] Draft medium-form answers (1-2 paragraphs) for:
  - Problem being solved
  - How this benefits [CHAIN]'s ecosystem specifically
  - What success looks like at the end of the grant period
  - How the project sustains itself after grant funding
- [ ] Copy relevant metrics from `traction-metrics.md` for any quantitative fields

### Prepare Supporting Materials
- [ ] Ensure GitHub repository is public, clean, and has a polished README
- [ ] Verify all 208 tests are passing (run `pnpm turbo test` and screenshot results)
- [ ] Prepare a 2-3 minute demo video showing:
  - Agent executing autonomous trades on Arbitrum Sepolia
  - Dashboard showing portfolio tracking and agent state
  - Code walkthrough of strategy definition (NL, DSL, TypeScript)
  - Risk management in action (circuit breaker or position limit trigger)
- [ ] Prepare architecture diagram as a standalone image (PNG/SVG) for upload fields
- [ ] Prepare a 1-page project summary (use `01-meridian-one-pager.md` as base, customize for chain)
- [ ] Gather testnet transaction hashes (5-10 representative trades) as proof links

### Internal Review
- [ ] Have at least one team member review the full proposal for clarity and accuracy
- [ ] Verify all metrics match current `traction-metrics.md` values
- [ ] Confirm milestone deliverables are achievable within the stated timeline
- [ ] Check that the budget breakdown is realistic and defensible
- [ ] Verify no confidential information is included (internal costs, margin analysis, etc.)

---

## Phase 3: Application Submission

### Pre-Submit Verification
- [ ] Re-read the application form in full before entering any content
- [ ] Confirm the correct wallet address is listed for fund disbursement (if required)
- [ ] Double-check all links: GitHub repo, demo video, documentation site, social links
- [ ] Verify all uploaded files are the correct versions (proposal PDF, architecture diagram, demo video)
- [ ] Run a final spell-check and grammar review on all text fields
- [ ] Ensure the proposal does not exceed any stated word or character limits

### Submission
- [ ] Submit the application through the official form or portal
- [ ] Take a screenshot of the confirmation page or save the confirmation email
- [ ] Record the submission date, application ID (if provided), and expected review timeline
- [ ] Save a local copy of all submitted materials in `docs/grants/submissions/[program-name]/`

### Post-Submit Verification
- [ ] Confirm receipt by checking the program's dashboard or portal status
- [ ] If no auto-confirmation, email the program contact to verify receipt within 48 hours
- [ ] Add the application to the grant tracking spreadsheet with status, dates, and expected timeline

---

## Phase 4: Post-Submission (Ongoing)

### Follow-Up Protocol

| Timeframe | Action |
|-----------|--------|
| Day 1-3 | Confirm receipt if no auto-confirmation |
| Week 1-2 | Engage in the program's community channels (Discord, governance forum) |
| Week 2-4 | If the program has a public review process, monitor and respond to any questions |
| Week 4+ | If no response, send one polite follow-up email referencing the application ID |
| Ongoing | Continue shipping and updating `traction-metrics.md` — new metrics strengthen the application |

### Community Engagement (During Review Period)
- [ ] Continue contributing to the grant program's ecosystem Discord/forum
- [ ] Share relevant Meridian updates (new features, test results) in appropriate channels
- [ ] If the program hosts community calls or AMAs, attend and participate
- [ ] Do NOT spam or pressure the review committee — maintain professional presence

### Track Status
- [ ] Log the application in the master grant tracker with:
  - Program name and ecosystem
  - Amount requested
  - Date submitted
  - Expected review timeline
  - Contact person (if known)
  - Status (Submitted / Under Review / Interview / Approved / Rejected)
- [ ] Set calendar reminders for follow-up dates
- [ ] If rejected, request feedback and incorporate into future applications

### If Invited to Interview or Follow-Up
- [ ] Prepare a 5-minute live demo (agent running, dashboard, code walkthrough)
- [ ] Update metrics to the latest numbers from `traction-metrics.md`
- [ ] Prepare answers to common follow-up questions:
  - "What happens if the grant funding is less than requested?"
  - "How does this differentiate from [specific competitor]?"
  - "What is your plan for sustainability after the grant?"
  - "Can you show the agent making a trade decision in real-time?"
  - "How do you handle security for agent-managed funds?"
- [ ] Have the full team available for the call (or at minimum, lead engineer + one other)

---

## Quick Reference: Common Grant Program Requirements

| Field | Our Standard Answer |
|-------|---------------------|
| Project name | Meridian |
| One-liner | The autonomous intelligence layer for DeFi — AI agents that execute financial strategies across chains. |
| Category | Developer Tooling / Infrastructure / AI Agents |
| License | Apache 2.0 / MIT (dual-licensed) |
| GitHub | https://github.com/amitduabits/meridiandefi |
| Website | meridianagents.xyz |
| Team size | 4-6 core contributors |
| Stage | Working testnet product (100+ autonomous trades on Arbitrum Sepolia) |
| Chains | Ethereum, Arbitrum (live); [CHAIN] (proposed); Solana, Avalanche, BNB, Base (roadmap) |

---

## File Organization

```
docs/grants/
  master-proposal.md          -- Master template (this stays unchanged)
  proposal-checklist.md       -- This file
  traction-metrics.md         -- Current metrics snapshot (update monthly)
  submissions/
    [program-name]/
      proposal.md             -- Customized proposal for this program
      form-answers.md         -- Copy-paste answers for form fields
      assets/                 -- Screenshots, diagrams, demo video links
      confirmation.png        -- Submission confirmation screenshot
```

---

*Last updated: February 2026*
