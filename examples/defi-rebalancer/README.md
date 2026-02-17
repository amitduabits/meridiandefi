# Meridian — DeFi Portfolio Rebalancer Demo

An autonomous AI agent that monitors your portfolio on Arbitrum Sepolia and rebalances when allocations drift from target — powered by Claude for intelligent reasoning about trade timing, gas optimization, and market conditions.

## What It Does

The agent runs a continuous **Sense → Think → Act → Reflect** loop:

1. **Sense** — Reads on-chain token balances and computes current allocation percentages
2. **Think** — Sends portfolio state to Claude, which reasons about whether to rebalance (considering gas costs, drift magnitude, market conditions)
3. **Act** — If rebalance is needed, executes swaps on Uniswap V3
4. **Reflect** — Logs the decision with full reasoning chain for auditability

```
╔════════════════════════════════════════════════════════╗
║  MERIDIAN — DeFi Portfolio Rebalancer                  ║
║  Chain: Arbitrum Sepolia    |  Status: RUNNING         ║
╚════════════════════════════════════════════════════════╝

  Portfolio Snapshot (Block #12345678)
  Total Value: $1,234.56

  ┌──────────┬──────────┬──────────┬────────────┐
  │ Token    │ Current  │ Target   │ Drift      │
  ├──────────┼──────────┼──────────┼────────────┤
  │ ETH      │ 45.2%    │ 40.0%    │ +5.2% !    │
  │ USDC     │ 28.1%    │ 30.0%    │ -1.9%      │
  │ WBTC     │ 26.7%    │ 30.0%    │ -3.3%      │
  └──────────┴──────────┴──────────┴────────────┘

  Agent Reasoning:
    "ETH has drifted 5.2% above target. Gas cost for rebalance
     swap is ~$0.02 on Arbitrum, which is negligible relative
     to portfolio value. Recommend selling excess ETH to WBTC
     (larger deficit). Slippage estimate: 0.1% via Uniswap V3."

  Action: SWAP 0.05 ETH -> WBTC via Uniswap V3
    Tx: 0xabc123...def45678
    https://sepolia.arbiscan.io/tx/0xabc123...def45678
    Gas: 0.00002 ETH ($0.02)

  Next check in 60 seconds...
```

## Prerequisites

- **Node.js** 20+ and **pnpm** 9+
- **Anthropic API key** ([console.anthropic.com](https://console.anthropic.com))
- **Arbitrum Sepolia ETH** from a testnet faucet:
  - [Alchemy Faucet](https://www.alchemy.com/faucets/arbitrum-sepolia)
  - [Chainlink Faucet](https://faucets.chain.link/arbitrum-sepolia)

## Setup

```bash
# 1. Install dependencies (from repo root)
pnpm install

# 2. Configure environment
cp examples/defi-rebalancer/.env.example examples/defi-rebalancer/.env
# Edit .env with your API key, RPC URL, and testnet wallet private key

# 3. Run the agent
pnpm --filter @meridian/example-defi-rebalancer start
```

Or run directly:

```bash
cd examples/defi-rebalancer
pnpm start
```

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ARBITRUM_SEPOLIA_RPC_URL` | Yes | — | Arbitrum Sepolia RPC endpoint |
| `ANTHROPIC_API_KEY` | Yes | — | Anthropic API key for Claude |
| `WALLET_PRIVATE_KEY` | Yes | — | Testnet wallet private key (0x-prefixed) |
| `DRIFT_THRESHOLD` | No | `0.05` | Rebalance trigger threshold (5%) |
| `TICK_INTERVAL_SEC` | No | `60` | Seconds between portfolio checks |
| `MAX_SLIPPAGE_BPS` | No | `50` | Max slippage in basis points (0.5%) |
| `DRY_RUN` | No | `false` | Simulate without sending transactions |
| `CLAUDE_MODEL` | No | `claude-sonnet-4-5-20250929` | Claude model for reasoning |

## Customizing the Strategy

Edit `src/config.ts` to change token targets:

```typescript
export const TOKENS: TokenConfig[] = [
  { symbol: "ETH",  address: "0x...", decimals: 18, targetPct: 0.50 },
  { symbol: "USDC", address: "0x...", decimals: 6,  targetPct: 0.50 },
];
```

Targets must sum to 1.0 (100%).

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   index.ts                       │
│  Creates Agent + wires providers + starts loop   │
└──────────┬───────────────┬──────────────────────┘
           │               │
    ┌──────▼──────┐ ┌──────▼──────┐
    │  Meridian   │ │  Anthropic  │
    │    SDK      │ │    SDK      │
    │  (Agent,    │ │  (Claude    │
    │  Strategy,  │ │  reasoning) │
    │  EventBus)  │ │             │
    └──────┬──────┘ └─────────────┘
           │
    ┌──────▼──────┐
    │    viem     │
    │  (Arbitrum  │
    │   Sepolia)  │
    └─────────────┘
```

## License

MIT
