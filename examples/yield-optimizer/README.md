# Meridian Yield Optimizer

An autonomous yield farming rotation agent built with the Meridian SDK. It monitors simulated APY rates across Aave V3, Compound V3, and Curve, then uses Claude to evaluate whether rotating funds to a higher-yield protocol justifies the gas cost.

## What it does

- Tracks simulated APY rates across three protocols and multiple assets
- Detects when a better yield opportunity exceeds the minimum APY difference threshold
- Calculates break-even time: gas cost divided by daily yield improvement
- Uses Claude to assess: reward token sustainability, protocol risk, and economic viability
- In dry-run: prints full analysis (current APY, target APY, gas estimate, net benefit, Claude decision)
- In live mode: withdraws from current protocol and deposits into the higher-yield protocol
- Logs: current position, yield table with all protocols, rotation decision reasoning
- Prints a session summary on exit: rotations performed and estimated earnings

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
| `MIN_APY_DIFF` | `2` | Minimum APY percentage point gain to consider rotating |
| `DRY_RUN` | `true` | Simulate without sending transactions |

## Key concepts demonstrated

- **Meridian Agent lifecycle** — Sense/Think/Act/Reflect cycle
- **Claude integration** — multi-factor yield rotation analysis
- **Protocol simulation** — realistic APY drift across Aave, Compound, Curve
- **Break-even analysis** — gas cost vs incremental yield calculation
- **Risk filtering** — maximum risk score and audit count constraints
- **IStrategy constraints** — `allowedProtocols` and `maxDailyTrades` limits
