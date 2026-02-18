# How We're Funding Open Source With $0 in VC Money

We're building Meridian -- an open-source agent framework for DeFi -- and we're funding it entirely through grants. No VC rounds. No token launch. No "strategic partnerships" that come with strings attached.

This isn't idealism. It's strategy. Here's how the math works, what we've learned about the grant landscape, and a practical playbook for other indie builders trying to do the same thing.

## The Grant Landscape: $700M+ in Addressable Pools

Blockchain ecosystems have a funding problem that works in builders' favor: they have more money than projects to fund. Most L1 and L2 chains maintain ecosystem funds specifically to attract developers. These aren't charity -- they're customer acquisition spend. Every project building on Arbitrum or Optimism or Solana increases the value of that ecosystem.

Here's a rough map of the major pools:

- **Ethereum Foundation** -- Ecosystem Support Program, academic grants, infrastructure grants
- **Arbitrum DAO** -- STIP, LTIPP, and ongoing ecosystem grants (hundreds of millions in ARB)
- **Optimism** -- RetroPGF rounds, Builder Grants, Partner Fund
- **Solana Foundation** -- Developer grants, ecosystem fund
- **Polygon** -- Ecosystem fund, DeFi-specific grants
- **Chainlink** -- BUILD program, SmartCon grants
- **Uniswap Foundation** -- Protocol development, ecosystem projects
- **Aave Grants DAO** -- Integration grants, research grants
- **Compound Grants** -- Protocol development grants
- **Gitcoin** -- Quarterly rounds, protocol-specific rounds
- **Protocol Labs / Filecoin** -- Developer grants

Add in chain-specific accelerators (Celo Camp, Near Grants, Cosmos ecosystem fund) and you're looking at $700M+ in addressable grant capital that refreshes annually. Not all of it is available to any single project. But a meaningful chunk is.

## Our "One Project, Many Facets" Strategy

Here's the insight that changed our approach: a single project like Meridian touches multiple ecosystems and categories. We're not applying for the same grant twenty times. We're applying for twenty different grants that each fund a different genuine facet of the work.

Meridian is simultaneously:

- **An agent framework** (infrastructure grants)
- **A DeFi protocol integration** (Uniswap, Aave, Curve adapter grants)
- **A chain ecosystem tool** (Arbitrum, Optimism, Solana ecosystem grants)
- **An open-source SDK** (Gitcoin, RetroPGF)
- **A developer tool** (developer experience grants)
- **A risk management system** (DeFi safety grants)
- **A multi-agent coordination protocol** (research grants)

Each facet is real. The Uniswap V3 adapter we built for Meridian genuinely benefits the Uniswap ecosystem. The Arbitrum deployment genuinely brings users to Arbitrum. We're not stretching -- we're recognizing that good infrastructure serves many stakeholders.

## The Math

We target 20 grant applications across these different facets. Our assumptions:

- **Hit rate:** 20% (conservative for projects with working demos)
- **Average grant size:** $50K (ranges from $10K Gitcoin rounds to $200K+ ecosystem grants)
- **Expected outcomes:** 4-5 approvals
- **Expected funding:** $200K-$250K

That's enough to fund a small team for 12-18 months. Not luxury. Not starvation. Just enough runway to build the thing properly.

Compare this to VC:

- VC wants 15-20% equity (or token allocation)
- VC wants a token launch timeline
- VC wants board seats or advisory influence
- VC funding takes 3-6 months of pitch meetings

Grants take effort too. But you keep 100% ownership, you have no pressure to launch a token, and the process rewards building over pitching.

## Practical Tips From the Trenches

### Lead With Demo, Not Deck

Every grant application we've submitted includes a link to a working demo or a video of the agent running on testnet. Not a whitepaper. Not a roadmap. A thing that works.

Grant reviewers see hundreds of applications with beautiful slide decks and ambitious roadmaps. Most of them never ship. When your application includes a link to a GitHub repo with 208 passing tests and a video of an agent autonomously rebalancing a portfolio on Arbitrum Sepolia, you stand out immediately.

The bar isn't perfection. It's proof you can execute. A rough demo beats a polished deck every time.

### Milestone-Based Proposals

Structure every proposal around milestones, not lump sums. Grant committees are risk-averse. They'd rather give you $15K for milestone 1 and see results before releasing $35K for milestones 2 and 3.

Our typical proposal structure:

- **Milestone 1 (30% of funds):** Core integration complete, testnet deployment, open-source release
- **Milestone 2 (40% of funds):** Mainnet deployment, documentation, community testing
- **Milestone 3 (30% of funds):** Performance metrics, audit, ecosystem contribution

This de-risks the grant for the committee and gives you natural checkpoints. It also forces you to break the work into concrete deliverables, which is good project management regardless.

### Engage the Community First

Before you apply, become visible in the ecosystem. For Arbitrum grants, be active in the Arbitrum DAO forums. For Uniswap grants, contribute to Uniswap governance discussions. For Gitcoin rounds, have a track record in previous rounds.

Grant reviewers Google you. They check your GitHub contribution history. They look for forum posts. If the first time they hear about your project is the grant application, you've already lost ground to someone who's been building in public for six months.

We spent four weeks engaging in ecosystem forums before submitting our first application. That investment paid for itself in reviewer trust.

### Working Demo > Pitch Deck (Always)

This bears repeating because it's the single most important factor. In six grant applications, the ones that succeeded all had the same thing in common: a working demo that reviewers could see or try.

The ones that didn't succeed were proposals for future work with no existing proof of capability. That's not a coincidence.

If you're reading this and thinking about applying for grants, build something first. Even if it's small. Even if it's rough. Ship code, then ask for money to make it better. Don't ask for money to start.

## Our 60-Day Execution Playbook

Here's the timeline we follow for each grant cycle:

**Days 1-10: Research and Mapping**
- Identify 25-30 potential grants across ecosystems
- Filter to 20 that genuinely fit different facets of the project
- Read previous successful applications (most are public)
- Note deadlines, review timelines, and milestone requirements

**Days 11-25: Application Sprint**
- Write a core narrative document (reusable across applications)
- Customize each application for the specific grant's priorities
- Record demo videos tailored to each ecosystem (same product, different angle)
- Get peer review from other builders in each ecosystem

**Days 26-40: Submission and Follow-Up**
- Submit all applications within a two-week window
- Follow up with grant committee members on forums
- Post updates about development progress publicly
- Respond to reviewer questions within 24 hours

**Days 41-60: Build While Waiting**
- Continue shipping features regardless of grant outcomes
- Document everything publicly (blog posts, tweets, forum updates)
- Each new feature becomes evidence for the next round
- Track results, refine approach for the next cycle

The key is treating grants as an ongoing process, not a one-time event. Each cycle builds on the previous one. Rejected applications get feedback that improves the next submission. Accepted grants generate track record that strengthens future applications.

## What We'd Tell Our Past Selves

Three things:

**Start smaller than you think.** Our first grant was $5,000 from a small ecosystem fund. It wasn't life-changing money. But it was our first external validation, and it gave us a track record to reference in every subsequent application.

**Apply broadly, commit specifically.** Cast a wide net in terms of ecosystems and grant types. But make each application specific and genuine. "We want to build Meridian adapters for Uniswap V3" is better than "We want to build a DeFi agent framework" even though both are true. Specificity shows you've thought about the reviewer's ecosystem.

**Document everything publicly.** Every trade your agent executes on testnet, every test that passes, every architecture decision -- put it on Twitter, on your blog, on the ecosystem forums. Public building creates ambient trust. When a grant reviewer Googles your project, the search results should tell a story of consistent, visible progress.

## The Bigger Picture

We're not opposed to raising venture capital. If the right opportunity comes along -- aligned investors who understand open-source infrastructure timelines -- we'd consider it. But we're not dependent on it. And that independence changes everything about how you build.

When you're grant-funded, you build for users. When you're VC-funded, you build for exits. Those incentives diverge more than most people admit.

Meridian is MIT licensed. The code is open. The agents are autonomous. And the funding model reflects the same values as the project: decentralized, transparent, and accountable to the community that uses it.

If you're building open source in crypto and thinking about grants, reach out. We're happy to share specific application templates, reviewer contacts, and lessons learned. The grant ecosystem works better when builders help each other navigate it.

Share your grant journey: [@meridianagents](https://twitter.com/meridianagents)
