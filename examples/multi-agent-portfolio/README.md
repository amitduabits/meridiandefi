# Meridian — Multi-Agent DeFi Portfolio Team

Three autonomous agents collaborating to manage a DeFi portfolio — showcasing Meridian's multi-agent coordination capabilities.

## Architecture

```
┌────────────────┐     Signal     ┌──────────────────┐    Approved    ┌──────────────┐
│  Market        │ ──────────────► │  Risk            │ ──────────────► │  Executor    │
│  Analyst       │                 │  Manager         │                │              │
│                │ ◄──────────────── │                │ ◄──────────────── │            │
└────────────────┘     Result     └──────────────────┘    Result      └──────────────┘
```

### Agent 1: Market Analyst
- Scans on-chain data across Arbitrum
- Analyzes market trends, on-chain metrics, price deviations
- Broadcasts **SIGNAL** messages with trade opportunities and confidence scores

### Agent 2: Risk Manager
- Receives signals from the Market Analyst
- Evaluates each against 5 risk checks: exposure, drawdown, gas, confidence, trade count
- **APPROVES** or **REJECTS** with detailed reasoning

### Agent 3: Executor
- Receives approved opportunities
- Plans optimal execution routing via Uniswap V3
- Executes trades (or simulates in dry-run mode)
- Reports results back to the team

## Running

```bash
# From repo root
pnpm install
pnpm --filter @meridian/example-multi-agent-portfolio start

# Or directly
cd examples/multi-agent-portfolio
pnpm start
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CYCLE_INTERVAL_SEC` | `10` | Seconds between team cycles |
| `MAX_CYCLES` | `0` | Max cycles (0 = unlimited) |
| `DRY_RUN` | `true` | Simulate without real transactions |

## Example Output

```
╔═══════════════════════════════════════════════════════════════╗
║  MERIDIAN — Multi-Agent DeFi Portfolio Team                   ║
╚═══════════════════════════════════════════════════════════════╝

  --- Cycle #1 --- 2:30:45 PM ---

  ? [Analyst] Scanning markets...
  ? [Analyst] Found: ETH — BUY opportunity — confidence 72%
  ? [Analyst] Broadcasting signal to team...

  ! [Risk Manager] Received signal: BUY ETH
  ! [Risk Manager]   ETH at 35% + 5% = 40% (limit 40%) PASS
  ! [Risk Manager]   -1.2% today (limit -10%) PASS
  ! [Risk Manager]   0.4 gwei (limit 100) PASS
  ! [Risk Manager]   72% (min 50%) PASS
  ! [Risk Manager]   0/20 trades today PASS
  ! [Risk Manager] APPROVED. All risk checks passed.

  > [Executor] Received approved task: BUY 5% ETH
  > [Executor]   Plan: USDC -> ETH via Uniswap V3
  > [Executor] Execution complete
  > [Executor]   Tx: 0xabc...def

  [Team Summary] Cycle #1 complete in 0.5s
    Signals: 1 | Approved: 1 | Executed: 1
```

## License

MIT
