# Meridian Arbitrage Scanner

A cross-DEX arbitrage detection agent built with the Meridian SDK. It continuously scans simulated prices from Uniswap V3, Curve, and Balancer, uses Claude to evaluate whether opportunities are genuine (not MEV traps), and executes profitable trades.

## What it does

- Polls simulated prices from three DEXes: Uniswap V3, Curve, and Balancer
- Detects pairs with price differences above the configured minimum profit threshold
- Pre-filters extremely large spreads (likely stale data or sandwich traps)
- Uses Claude to assess each opportunity: genuine arbitrage vs MEV target risk
- In dry-run: logs opportunity details, spread %, estimated profit, and confidence
- In live mode: executes a swap to capture the spread (demo: self-transfer on testnet)
- Prints a session summary on exit: total scans, opportunities found, and executed

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
| `MIN_PROFIT_USD` | `5` | Minimum estimated USD profit to evaluate |
| `DRY_RUN` | `true` | Simulate without sending transactions |

## Key concepts demonstrated

- **Meridian Agent lifecycle** — Sense/Think/Act/Reflect cycle
- **Claude integration** — opportunity quality and MEV risk evaluation
- **Market simulation** — mock DEX price feeds with realistic spread generation
- **ISenseProvider** — multi-DEX price aggregation
- **IActProvider** — conditional execution with dry-run support
- **Risk filtering** — pre-flight spread checks before Claude evaluation
