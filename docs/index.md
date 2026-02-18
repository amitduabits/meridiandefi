---
layout: home

hero:
  name: "Meridian"
  text: "AI Agent Framework for DeFi"
  tagline: "Build autonomous agents that sense market conditions, reason with LLMs, and execute trades — across any chain, any protocol."
  actions:
    - theme: brand
      text: Get Started →
      link: /getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/amitduabits/meridiandefi
    - theme: alt
      text: Live Dashboard
      link: https://app.meridianagents.xyz

features:
  - icon: 🧠
    title: LLM-Native Reasoning
    details: Claude Sonnet as primary reasoning engine with GPT-4o fallback and Ollama for local models. Structured Zod output parsing for reliable decision extraction.

  - icon: ⛓️
    title: Multi-Chain by Default
    details: First-class support for Ethereum, Arbitrum, Base, Optimism, Polygon, Avalanche, and Solana. viem v2 for EVM, @solana/web3.js v2 for Solana.

  - icon: 🔄
    title: Sense → Think → Act → Reflect
    details: xstate v5 state machine governs every agent lifecycle. Deterministic state transitions with automatic error recovery and cooldown.

  - icon: 🛡️
    title: Risk-First Architecture
    details: Pre-flight validator blocks unsafe trades before execution. Circuit breakers, position limits, drawdown protection, and MEV guard (Flashbots) built in.

  - icon: 🤝
    title: Agent-to-Agent Communication
    details: libp2p GossipSub mesh for peer discovery. Protobuf message schemas. On-chain registry for agent identity. Payment channels for autonomous value exchange.

  - icon: 📊
    title: Three-Tier Memory
    details: Redis for hot working memory, PostgreSQL + TimescaleDB for episodic history, Qdrant for semantic RAG. Every decision is stored and retrievable.
---

## Quick Start

```bash
git clone https://github.com/amitduabits/meridiandefi.git
cd meridiandefi
pnpm install && pnpm turbo build

# Run the DeFi Rebalancer demo (no real transactions)
DRY_RUN=true pnpm --filter @meridian/example-defi-rebalancer start
```

## Build Your First Agent

```typescript
import { Agent, EventBus, StrategyBuilder } from "@meridian/sdk";

const agent = new Agent(
  {
    name: "My DeFi Agent",
    capabilities: ["SWAP", "PORTFOLIO_MANAGEMENT"],
    chains: [42161],           // Arbitrum One
    tickIntervalMs: 30_000,    // 30-second decision cycle
    dryRun: true,
  },
  { eventBus, sense, think, act, memory },
);

const strategy = new StrategyBuilder().fromCode({
  id: "rebalancer-v1",
  triggers: [{ type: "DRIFT_THRESHOLD", params: { threshold: 0.05 } }],
  actions: [{ type: "SWAP", params: { targetAllocation: { ETH: 0.4, USDC: 0.6 } }, chainId: 42161 }],
  constraints: { maxPositionPct: 50, maxSlippageBps: 50 },
});

agent.setStrategy(strategy);
await agent.start();
```

## What's Inside

| Module | Description | Status |
|--------|-------------|--------|
| **SDK** | Agent runtime, LLM, chains, strategy, memory, risk | ✅ Complete |
| **Contracts** | AgentRegistry, PaymentEscrow, StrategyVault, Governance | ✅ Complete |
| **Server** | tRPC + WebSocket API + SIWE auth | ✅ Complete |
| **Dashboard** | React 18 monitoring dashboard | ✅ Live |
| **Examples** | DeFi Rebalancer, Multi-Agent Portfolio | ✅ Running |

**288 tests passing** · **MIT License** · **TypeScript 5.6** · **Node.js 20+**
