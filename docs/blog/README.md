# Meridian Blog — Publishing Schedule & Strategy

## Content Calendar

| # | Title | Target Length | Status | Publish Date |
|---|-------|-------------|--------|-------------|
| 01 | Why DeFi Needs AI Agents (And Why Existing Frameworks Fail) | 1,500 words | Draft | Week 1 |
| 02 | Building a DeFi Portfolio Agent in 50 Lines of TypeScript | 1,200 words | Draft | Week 2 |
| 03 | How We're Funding Open Source With $0 in VC Money | 1,000 words | Draft | Week 3 |

**Cadence:** One post per week. Publish on Tuesdays at 9 AM UTC (peak developer engagement window across US and EU timezones).

## Publishing Platforms

### Primary
- **Medium** (medium.com/@meridianagents) — Largest reach for crypto/dev content. Publish here first for indexing priority.
- **dev.to** — Strong developer community. Cross-post 24 hours after Medium for unique content signals.
- **Hashnode** — Technical audience, good SEO, supports custom domains. Cross-post 48 hours after Medium.

### Secondary
- **Project blog** (blog.meridianagents.xyz) — Canonical versions. Publish simultaneously with Medium. All cross-posts link back here as the canonical URL.
- **Mirror.xyz** — Web3-native audience. Good for the grants post (03) specifically.

### Syndication
- **Hacker News** — Submit posts 01 and 02 (technical content performs well). Submit at 8 AM ET for maximum visibility.
- **Reddit** — r/ethereum, r/defi, r/cryptocurrency for post 01. r/typescript, r/webdev for post 02. r/opensource for post 03.
- **Farcaster** — Thread summaries of each post. Web3-native audience.

## Cross-Posting Strategy

1. **Day 0 (Tuesday):** Publish on project blog (canonical URL) and Medium simultaneously.
2. **Day 1 (Wednesday):** Cross-post to dev.to with canonical URL pointing to project blog.
3. **Day 2 (Thursday):** Cross-post to Hashnode with canonical URL pointing to project blog.
4. **Day 3 (Friday):** Submit to Hacker News and relevant Reddit communities (if applicable for that post).

Always set the `canonical_url` meta tag on cross-posted versions to avoid SEO penalties for duplicate content. Medium, dev.to, and Hashnode all support canonical URL configuration.

## SEO Considerations

### Target Keywords Per Post

**Post 01:**
- Primary: "DeFi AI agents", "autonomous DeFi agents"
- Secondary: "DeFi agent framework", "AI trading agents crypto"
- Long-tail: "why DeFi needs AI agents", "DeFi agent framework comparison"

**Post 02:**
- Primary: "build DeFi agent TypeScript", "DeFi trading bot tutorial"
- Secondary: "Meridian SDK tutorial", "autonomous agent tutorial"
- Long-tail: "how to build a DeFi portfolio agent", "TypeScript DeFi agent example"

**Post 03:**
- Primary: "blockchain grants open source", "crypto grants funding"
- Secondary: "open source funding strategy", "DeFi grants guide"
- Long-tail: "how to fund open source with blockchain grants", "crypto grant application tips"

### On-Page SEO Checklist
- [ ] Title includes primary keyword
- [ ] First paragraph includes primary keyword naturally
- [ ] H2 headings include secondary keywords where natural
- [ ] Code blocks are properly formatted (improves time-on-page)
- [ ] Internal links between posts where relevant
- [ ] External links to GitHub repo, docs, Twitter
- [ ] Alt text on any images (N/A for current drafts)
- [ ] Meta description under 160 characters

### Technical SEO
- Project blog uses static site generation (fast load times)
- All pages have proper Open Graph and Twitter Card meta tags
- Structured data (Article schema) on all blog posts
- Sitemap.xml includes blog posts

## Promotion Plan Per Post

### Post 01: "Why DeFi Needs AI Agents"

**Target audience:** DeFi developers, crypto builders, protocol teams

**Promotion channels:**
- Twitter thread: 8-tweet summary of the three failure scenarios + architecture overview. Pin to profile.
- DeFi-focused Telegram groups: share with brief context (not spammy, add value to discussion).
- Arbitrum/Optimism/Solana Discord channels: post in #ecosystem or #builders channels.
- Quote-tweet relevant conversations about DeFi automation, agent frameworks, or AI in crypto.
- Tag competing frameworks respectfully -- engage in comparison discussion if they respond.

**Goal:** Establish problem awareness and position Meridian as the DeFi-native solution.

### Post 02: "Building a DeFi Portfolio Agent in 50 Lines"

**Target audience:** Developers who want to build. Higher intent than post 01.

**Promotion channels:**
- Twitter thread: post the 50-line code snippet as an image, link to full tutorial.
- dev.to and Hashnode communities: engage in comments, answer questions.
- Hacker News: submit with title focused on the technical angle, not the project name.
- Reddit r/typescript and r/webdev: "Show HN"-style post with the code.
- YouTube: record a 10-minute screencast walking through the code (optional, high-effort).
- GitHub: link from repo README to this tutorial.

**Goal:** Convert interested developers into users who clone the repo and try the examples.

### Post 03: "Funding Open Source With Grants"

**Target audience:** Indie builders, open-source maintainers, crypto founders

**Promotion channels:**
- Twitter thread: focus on the math ($700M+ addressable, 20x20% strategy).
- Indie Hackers: cross-post or summarize.
- r/opensource and r/cryptocurrency: frame around the broader funding model, not just Meridian.
- Mirror.xyz: web3-native audience particularly interested in funding models.
- Ecosystem-specific forums (Arbitrum DAO, Optimism forum): reference as context when applying for grants.
- Podcast outreach: pitch the "funding open source with grants" angle to crypto/indie podcasts.

**Goal:** Build community goodwill, attract potential collaborators, create content referenced in future grant applications.

## Metrics to Track

- **Pageviews** per platform per post
- **GitHub stars/clones** in the 7 days following each post
- **Referral traffic** from each platform to the repo
- **Hacker News ranking** (if submitted)
- **Twitter impressions and engagement rate** per promotion thread
- **Cross-post performance** comparison (Medium vs dev.to vs Hashnode)
- **Time on page** (indicates whether people actually read vs bounce)
- **Comments and discussions** generated per platform

## Future Content Pipeline

| Topic | Type | Priority |
|-------|------|----------|
| Multi-Agent DeFi: When Your Agents Start Talking to Each Other | Technical deep-dive | High |
| Circuit Breakers for DeFi Agents: How We Prevent Catastrophic Losses | Architecture post | High |
| From Natural Language to On-Chain Execution: The Meridian Strategy DSL | Tutorial | Medium |
| Backtesting DeFi Strategies With Historical Data | Tutorial | Medium |
| MEV Protection for Autonomous Agents | Technical deep-dive | Medium |
| Agent Memory Architecture: Redis + Postgres + Qdrant | Architecture post | Low |
| Running Meridian Agents on Solana | Tutorial | Low (post-Solana adapter) |
