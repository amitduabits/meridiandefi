# Pending Application Update Email — Post First Grant

> Send this email to ALL pending grant applications within 48 hours of confirmation.
> Customize the chain-specific hook section for each recipient.

---

## Email Template

```
Subject: Meridian Update — Funded by [CHAIN_NAME] Foundation

Hi [CONTACT_NAME],

I wanted to share a quick update regarding our [TARGET_CHAIN] grants application.

We've just been awarded a [$AMOUNT] grant from the [CHAIN_NAME] Foundation to
advance Meridian — our open-source framework for autonomous DeFi agents. We're
excited to have this validation of our technical approach and roadmap.

Here's what's new since we submitted:

  - [CHAIN_NAME] Foundation grant confirmed ([$AMOUNT], [DATE])
  - Test suite expanded to 208 passing tests across 12 test suites
  - 100+ autonomous trades executed (testnet + mainnet)
  - 19,000+ lines of production code across TypeScript, Solidity, and Python
  - 5 protocol adapters live: Uniswap V3, Aave V3, Jupiter, Curve, Lido
  - 3 auditable smart contracts: Agent Registry, Payment Escrow, Strategy Vault

The [CHAIN_NAME] grant funds core framework infrastructure — the runtime engine,
risk management system, and strategy engine that power agents on every chain.
What we're asking [TARGET_CHAIN] for is specifically targeted at [TARGET_CHAIN]
ecosystem integration:

[CHAIN_SPECIFIC_HOOK — see below]

We'd love to bring the same quality of agent infrastructure to [TARGET_CHAIN]
that [CHAIN_NAME] has invested in. Happy to provide updated materials, a demo,
or jump on a call at your convenience.

Thank you for your continued consideration.

Best,
[NAME]
Meridian
@MeridianAgents | github.com/amitduabits/meridiandefi
```

---

## Chain-Specific Hooks

Replace `[CHAIN_SPECIFIC_HOOK]` with the appropriate section below:

### Arbitrum

```
  - Native Arbitrum chain connector with Uniswap V3, GMX, and Camelot adapters
  - Agent Registry contract deployed to Arbitrum One (low-cost on-chain registration)
  - High-frequency strategy execution leveraging Arbitrum's throughput
  - Orbit chain support in our roadmap for app-specific agent networks
```

### Optimism (OP Grants / RetroPGF)

```
  - OP Stack chain connector supporting Velodrome, Synthetix, and Aave V3
  - Agent framework as public good infrastructure — MIT licensed, composable
  - Superchain compatibility for agents operating across OP Stack chains
  - Alignment with Optimism's vision of scalable, permissionless infrastructure
```

### Base

```
  - Base-native protocol adapters (Aerodrome, Moonwell, Compound V3)
  - Onboarding-focused agent templates for developers new to DeFi automation
  - Coinbase Smart Wallet integration for agent key management
  - Consumer-friendly strategies (DCA, auto-rebalance) deployed on Base
```

### Ethereum (ESP)

```
  - Core EVM reference implementation powering all L2 adapters
  - Flashbots integration for MEV-protected agent transactions on mainnet
  - ERC-4626 Strategy Vault standard for transparent agent performance
  - Research contribution: agent coordination patterns for DeFi composability
```

### Polygon

```
  - Polygon PoS + zkEVM dual chain support
  - QuickSwap, Aave V3 on Polygon, and Balancer protocol adapters
  - Low-cost execution environment ideal for agent learning and iteration
  - Integration with Polygon ID for agent identity and reputation
```

### Avalanche

```
  - Avalanche C-Chain connector with Trader Joe, Benqi, and Platypus adapters
  - Subnet-aware agent routing for specialized DeFi environments
  - High-throughput execution leveraging Avalanche's sub-second finality
  - Multiverse incentive alignment for agent-powered Subnets
```

### Solana

```
  - @solana/web3.js v2 + Anchor integration for native Solana agent execution
  - Jupiter aggregator for optimal swap routing
  - Marinade, Jito, and Drift protocol adapters
  - Parallel transaction execution leveraging Solana's architecture
```

---

## Timing and Follow-Up

| Action | Timing |
|--------|--------|
| Send update email | Within 48 hours of grant confirmation |
| Follow up if no response | 5 business days after update email |
| Second follow up | 10 business days (brief, 2-3 sentences) |
| Final follow up | 20 business days (offer to resubmit if needed) |

---

## Follow-Up Template (5 days, no response)

```
Subject: Re: Meridian Update — Funded by [CHAIN_NAME] Foundation

Hi [CONTACT_NAME],

Just following up on my note from last week. Happy to share a live demo
of Meridian's agent framework or provide any additional materials that
would be helpful for your evaluation.

Our [CHAIN_NAME]-funded development is underway and we're eager to
extend the same capabilities to [TARGET_CHAIN].

Thanks,
[NAME]
```

---

## Notes

- BCC yourself on all emails for tracking
- Log each email sent and response (or lack thereof) in a shared doc
- If a foundation has a portal/dashboard for updates, post there as well
- Adjust tone based on relationship — more formal for cold contacts, warmer for existing conversations
- Never pressure or imply urgency — foundations move on their own timeline
