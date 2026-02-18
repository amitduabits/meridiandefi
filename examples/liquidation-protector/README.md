# Meridian Liquidation Protector

An autonomous lending position protection agent built with the Meridian SDK. It monitors the health factor of an Aave V3 position and automatically takes protective actions when the position approaches liquidation.

## What it does

- Monitors a simulated Aave V3 lending position health factor every 60 seconds
- Displays a colour-coded terminal chart showing the health factor trend over time
- Estimates time to liquidation based on the current price trend
- WARNING mode (HF < 1.3): alerts the user and consults Claude for recommended actions
- CRITICAL mode (HF < 1.1): automatically repays part of the debt to restore a safe health factor
- Claude analysis considers: urgency, whether to repay debt or add collateral, and amount
- In dry-run: simulates all protection actions without sending transactions
- Prints a session summary on exit: total cycles monitored and protection actions taken

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
| `AAVE_POSITION_ADDRESS` | agent wallet | Address of the Aave position to monitor |
| `HEALTH_FACTOR_WARNING` | `1.3` | HF below this triggers Claude analysis |
| `HEALTH_FACTOR_CRITICAL` | `1.1` | HF below this triggers automatic protection |
| `DRY_RUN` | `true` | Simulate without sending transactions |

## Health factor levels

| Range | Status | Action |
|-------|--------|--------|
| > 1.3 | Safe | Monitor only |
| 1.1 – 1.3 | Warning | Claude analysis + optional action |
| < 1.1 | Critical | Automatic debt repayment |

## Key concepts demonstrated

- **Meridian Agent lifecycle** — Sense/Think/Act/Reflect cycle
- **Claude integration** — nuanced risk analysis with structured JSON output
- **Terminal visualisation** — live health factor trend chart
- **Tiered automation** — graduated response based on severity
- **ISenseProvider** — on-chain position monitoring (mocked for testnet)
- **IActProvider** — conditional protection execution
- **IStrategy** — `allowedProtocols` and `maxDailyTrades` safety constraints
