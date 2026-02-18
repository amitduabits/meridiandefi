# README.md Update — Post-Grant Approval

> Add the following sections to the public GitHub README.md immediately upon grant confirmation.

---

## 1. Badge Line (Top of README, below title)

Add directly under the Meridian title/logo:

```markdown
[![Supported by [CHAIN_NAME] Foundation](https://img.shields.io/badge/Supported%20by-[CHAIN_NAME]%20Foundation-blue?style=for-the-badge&logo=[CHAIN_LOGO_SLUG])](https://[CHAIN_FOUNDATION_URL])
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-208%20passing-brightgreen?style=for-the-badge)]()
```

**Notes:**
- Replace `[CHAIN_LOGO_SLUG]` with the SimpleIcons slug (e.g., `ethereum`, `arbitrum`)
- If the foundation provides an official badge, use theirs instead
- Some foundations (Arbitrum, Optimism) have specific brand guidelines — check before publishing

---

## 2. Grant Acknowledgments Section

Insert after the "Getting Started" section or before "Contributing":

```markdown
## Acknowledgments

Meridian is proudly supported by:

### Backed By

<p align="center">
  <a href="https://[CHAIN_FOUNDATION_URL]">
    <img src="docs/assets/logos/[CHAIN_NAME]-foundation-logo.svg" alt="[CHAIN_NAME] Foundation" height="60" />
  </a>
</p>

This project received a [$AMOUNT] grant from the **[CHAIN_NAME] Foundation** in [DATE] to advance autonomous DeFi agent infrastructure on [CHAIN_NAME].

We're grateful to the [CHAIN_NAME] grants team for their support and belief in agent-driven DeFi.
```

---

## 3. Expanded "Backed By" Section (After Multiple Grants)

Once additional grants are secured, evolve the section:

```markdown
## Backed By

Meridian is supported by leading blockchain foundations building the future of DeFi.

<p align="center">
  <a href="https://[CHAIN_1_URL]">
    <img src="docs/assets/logos/[CHAIN_1]-logo.svg" alt="[CHAIN_1] Foundation" height="50" />
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://[CHAIN_2_URL]">
    <img src="docs/assets/logos/[CHAIN_2]-logo.svg" alt="[CHAIN_2] Foundation" height="50" />
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://[CHAIN_3_URL]">
    <img src="docs/assets/logos/[CHAIN_3]-logo.svg" alt="[CHAIN_3] Foundation" height="50" />
  </a>
</p>
```

---

## 4. Updated Project Stats Line

Update the existing stats/traction line in the README:

```markdown
**19,000+ lines of production code | 208 tests passing | 100+ autonomous trades executed | Funded by [CHAIN_NAME] Foundation**
```

---

## 5. Asset Checklist

Before publishing, ensure these assets are in place:

- [ ] Foundation logo in `docs/assets/logos/` (SVG preferred, PNG fallback)
- [ ] Confirm logo usage is permitted per foundation brand guidelines
- [ ] Badge URL resolves correctly
- [ ] Foundation URL is correct (grants page, not generic homepage)
- [ ] Grant amount is approved for public disclosure (some foundations prefer not to disclose exact amounts — check grant agreement)

---

## 6. Commit Message

```
docs: add [CHAIN_NAME] Foundation grant acknowledgment to README
```
