# Meridian

**The autonomous intelligence layer for DeFi — every chain, every protocol, one agent framework.**

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)

---

## What is Meridian?

Meridian is a production-grade AI agent framework purpose-built for DeFi. Agents follow a **Sense - Think - Act - Reflect** decision cycle, executing autonomous strategies across multiple chains and protocols.

```
                    ┌─────────────────────────────────────┐
                    │           MERIDIAN AGENT             │
                    │                                       │
                    │   ┌──────┐  ┌───────┐  ┌─────┐      │
              ┌────►│   │SENSE │─►│ THINK │─►│ ACT │──┐   │
              │     │   └──────┘  └───────┘  └─────┘  │   │
              │     │       ▲                     │     │   │
              │     │       │    ┌─────────┐      │     │   │
              │     │       └────│REFLECT  │◄─────┘     │   │
              │     │            └─────────┘            │   │
              │     └─────────────────────────────────────┘
              │                                         │
    ┌─────────┴──────────┐              ┌──────────────┴──────┐
    │   Chain Connectors  │              │    LLM Providers    │
    │  Ethereum · Arbitrum│              │  Claude · GPT-4o    │
    │  Base · Optimism    │              │  Llama · Mistral    │
    │  Polygon · Solana   │              │                     │
    └─────────────────────┘              └─────────────────────┘
```

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/amitduabits/meridiandefi.git
cd meridian
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys and RPC URLs

# 3. Start infrastructure
docker compose up -d

# 4. Run the demo agent
pnpm --filter @meridian/example-defi-rebalancer start
```

## Features

- **Multi-Chain Support** — Ethereum, Arbitrum, Base, Optimism, Polygon, Avalanche, Solana
- **AI-Powered Decisions** — Claude (primary), GPT-4o (fallback), local models via Ollama
- **Natural Language Strategies** — Describe what you want in plain English, Meridian handles the rest
- **Custom DSL** — Meridian Strategy DSL for precise, auditable strategy definitions
- **Protocol Adapters** — Uniswap V3, Aave V3, Jupiter, Curve, Lido out of the box
- **3-Tier Memory** — Redis (hot) + PostgreSQL/TimescaleDB (episodic) + Qdrant (semantic)
- **Agent-to-Agent Communication** — libp2p-based discovery, messaging, and task negotiation
- **Risk Management** — Pre-flight validation, circuit breakers, position limits, MEV protection
- **Real-Time Dashboard** — React-based monitoring with live agent state, P&L, and risk views
- **Smart Contracts** — On-chain agent registry (ERC-721), payment escrow, strategy vaults (ERC-4626)
- **Plugin System** — Extend agent capabilities with custom plugins
- **Backtesting** — Test strategies against historical data before deploying

## Supported Chains

| Chain | Network | Status |
|-------|---------|--------|
| Ethereum | Mainnet / Sepolia | Supported |
| Arbitrum | One / Sepolia | Supported |
| Base | Mainnet | Supported |
| Optimism | Mainnet | Supported |
| Polygon | Mainnet | Supported |
| Avalanche | C-Chain | Supported |
| Solana | Mainnet / Devnet | Supported |

## Architecture

```
packages/
  sdk/           @meridian/sdk         Core SDK with all modules
  contracts/     @meridian/contracts   Solidity smart contracts (Foundry)
  dashboard/     @meridian/dashboard   React monitoring dashboard
  server/        @meridian/server      tRPC + WebSocket API server
  proto/         @meridian/proto       Protobuf schemas
  ml/            @meridian/ml          Python ML sidecar
apps/
  agent-node/    Standalone agent runner
  cli/           Developer CLI
examples/
  defi-rebalancer/         Portfolio rebalancing demo
  multi-agent-portfolio/   3-agent collaborative portfolio
  arbitrage-scanner/       Cross-DEX arbitrage
  yield-optimizer/         Yield farming optimization
  liquidation-protector/   Liquidation prevention
```

## Documentation

- [Getting Started](docs/getting-started.md)
- [Architecture](docs/architecture.md)
- [Strategy DSL Reference](docs/strategy-dsl.md)
- [Protocol Adapters](docs/protocol-adapters.md)
- [Agent Communication](docs/agent-communication.md)
- [Risk Management](docs/risk-management.md)
- [Smart Contracts](docs/smart-contracts.md)
- [API Reference](docs/api-reference/sdk.md)
- [Examples](docs/examples.md)

## Development

```bash
pnpm install              # Install all dependencies
pnpm turbo build          # Build all packages
pnpm turbo test           # Run all tests
pnpm turbo typecheck      # Type check all packages
pnpm turbo lint           # Lint all packages
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT - see [LICENSE](LICENSE) for details.

---

**meridianagents.xyz**
