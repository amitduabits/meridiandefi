# Meridian DCA Bot

A dollar-cost averaging (DCA) agent built with the Meridian SDK. It automatically purchases a fixed USDC amount of a target token at regular intervals, using Claude to skip purchases during extreme market volatility.

## What it does

- Monitors the current ETH/USDC price on Arbitrum Sepolia
- On each DCA interval, asks Claude whether market conditions are reasonable
- Skips the purchase if volatility exceeds the configured threshold
- Executes a Uniswap V3 swap (simulated in dry-run mode)
- Logs each purchase with: amount received, price paid, and cumulative average cost basis
- Prints a session summary on exit

## Setup

```bash
cp .env.example .env
# Edit .env and fill in your values
```

## Run

```bash
# Dry-run (default — safe, no real transactions)
pnpm start

# With explicit dry-run flag
tsx src/index.ts --dry-run

# Live mode (real transactions on Arbitrum Sepolia testnet)
DRY_RUN=false pnpm start
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | required | Your Anthropic API key |
| `ARB_SEPOLIA_RPC_URL` | required | Arbitrum Sepolia RPC endpoint |
| `AGENT_PRIVATE_KEY` | required | Wallet private key (0x-prefixed) |
| `DCA_TOKEN` | `ETH` | Token to buy |
| `DCA_AMOUNT_USDC` | `50` | USDC to spend per interval |
| `DCA_INTERVAL_HOURS` | `24` | Hours between purchases |
| `DRY_RUN` | `true` | Simulate without sending transactions |

## Key concepts demonstrated

- **Meridian Agent lifecycle** — Sense/Think/Act/Reflect cycle
- **Claude integration** — volatility assessment before each purchase
- **IStrategy** — time-interval trigger with swap action
- **ISenseProvider** — reading on-chain balances
- **IActProvider** — executing swaps with dry-run support
- **Graceful shutdown** — SIGINT/SIGTERM handlers with session summary
