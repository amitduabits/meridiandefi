# Risk Management

The risk management module has **veto power** over every agent action. It is fully deterministic -- no LLM calls, no I/O -- producing the same output for the same input every time. This document covers the pre-flight validation pipeline, circuit breaker system, portfolio risk metrics, and configuration.

## Architecture

```
Agent.act()
    │
    ▼
RiskManager.validateAction()
    │
    ├── 1. CircuitBreakerManager.allClear()
    │       Any breaker not CLOSED? ──► VETO (riskScore: 100)
    │
    └── 2. PreFlightValidator.validate()
            7 independent checks ──► RiskDecision { allowed, riskScore, warnings }
```

The `RiskManager` is the single entry point. It first checks circuit breakers (fast path rejection), then runs all pre-flight checks. If any check fails, the action is denied.

## RiskManager

```typescript
import { RiskManager } from "@meridian/sdk";

const risk = new RiskManager({
  limits: {
    maxPositionSizeUsd: 10_000,
    maxPortfolioExposurePct: 80,
    maxSlippageBps: 100,
    maxGasCostPct: 1,
    maxDailyLossPct: 5,
    maxDrawdownPct: 20,
    maxOpenPositions: 10,
    maxDailyTrades: 50,
  },
});

const decision = risk.validateAction("SWAP", actionParams, portfolio);

if (!decision.allowed) {
  // Action vetoed -- do not execute
  console.log("Denied:", decision.reason);
  console.log("Risk score:", decision.riskScore);
}
```

## Risk Limits

All limits are validated at construction time with `RiskLimitsSchema`:

| Limit | Type | Default | Description |
|-------|------|---------|-------------|
| `maxPositionSizeUsd` | `number` | required | Maximum single position value in USD |
| `maxPortfolioExposurePct` | `number` | 100 | Maximum deployed capital as % of total portfolio |
| `maxSlippageBps` | `number` | 100 | Maximum acceptable slippage in basis points |
| `maxGasCostPct` | `number` | 1 | Maximum gas cost as % of trade value |
| `maxDailyLossPct` | `number` | 10 | Maximum daily loss as % of start-of-day equity |
| `maxDrawdownPct` | `number` | 20 | Maximum peak-to-trough drawdown |
| `maxOpenPositions` | `number` | 20 | Maximum number of concurrent open positions |
| `maxDailyTrades` | `number` | 50 | Maximum number of trades per day |

Limits can be updated at runtime:

```typescript
risk.setLimits({
  maxPositionSizeUsd: 5_000,
  maxDailyTrades: 25,
  // ...all fields required
});
```

## Pre-Flight Validation

The `PreFlightValidator` runs 7 independent checks on every proposed action. Each check produces a `passed/failed` result, an optional warning, a risk contribution score, and optional modification suggestions.

### Check 1: Position Size

Verifies the trade value does not exceed `maxPositionSizeUsd`.

- **Fails** if `tradeValueUsd > maxPositionSizeUsd`
- **Warns** if trade value exceeds 80% of the limit
- Suggests a reduced `suggestedTradeValueUsd` when failed
- Risk contribution: up to 30 points

### Check 2: Portfolio Exposure

Calculates how much capital would be deployed after the trade and verifies it stays within `maxPortfolioExposurePct`.

```
newExposurePct = (currentDeployed + tradeValueUsd) / totalPortfolioValue * 100
```

- **Fails** if `newExposurePct > maxPortfolioExposurePct`
- **Warns** at 90% utilization of the limit
- Risk contribution: up to 25 points

### Check 3: Gas Cost

Ensures gas cost is a reasonable fraction of the trade value.

```
gasPct = (gasCostUsd / tradeValueUsd) * 100
```

- **Fails** if `gasPct > maxGasCostPct`
- **Warns** at 75% of the limit
- Risk contribution: up to 15 points

### Check 4: Slippage

Checks that estimated slippage is within tolerance.

- **Fails** if `estimatedSlippageBps > maxSlippageBps`
- **Warns** at 80% of the limit
- Suggests `suggestedSlippageBps` when failed
- Risk contribution: up to 20 points

### Check 5: Daily Loss

Computes the day's loss so far and blocks trading if the limit is reached.

```
lossPct = (dayStartEquityUsd - currentEquityUsd) / dayStartEquityUsd * 100
```

- **Fails** if `lossPct >= maxDailyLossPct`
- **Warns** at 75% of the limit
- Risk contribution: up to 35 points

### Check 6: Daily Trade Count

- **Fails** if `dailyTradeCount >= maxDailyTrades`
- Risk contribution: 10 points

### Check 7: Open Position Limit

- **Fails** if `openPositions >= maxOpenPositions`
- Risk contribution: 10 points

### RiskDecision Output

```typescript
interface RiskDecision {
  allowed: boolean;           // false = action vetoed
  riskScore: number;          // 0-100 composite score
  reason: string;             // Human-readable explanation
  warnings: string[];         // Non-blocking warnings
  modifications?: Record<string, unknown>;  // Suggested adjustments
}
```

The `riskScore` is the sum of all check contributions, clamped to [0, 100]. Higher scores indicate riskier actions. Even when `allowed: true`, a high score signals that the action is approaching limits.

## Circuit Breakers

Circuit breakers provide system-level protection against cascading failures. They follow a three-state model:

```
CLOSED ──(trip)──► OPEN ──(cooldown elapsed)──► HALF_OPEN ──(probes pass)──► CLOSED
                                                     │
                                                (probe fails)
                                                     │
                                                     ▼
                                                   OPEN
```

### Breaker Types

| Type | Cooldown | Probes | Trigger Scenario |
|------|----------|--------|------------------|
| `PORTFOLIO_DRAWDOWN` | 30 min | 3 | Portfolio drops below drawdown threshold |
| `FLASH_CRASH` | 15 min | 5 | Sudden market-wide price crash detected |
| `GAS_SPIKE` | 5 min | 2 | Gas prices spike abnormally |
| `RPC_FAILURE` | 2 min | 3 | Chain RPC endpoints become unreliable |
| `ORACLE_STALE` | 5 min | 2 | Price oracle data is stale or unavailable |
| `CONTRACT_ANOMALY` | 1 hour | 5 | Unusual contract behavior detected |

### Usage

```typescript
import { BreakerType } from "@meridian/sdk";

// Trip a breaker
risk.tripBreaker(BreakerType.FLASH_CRASH, "ETH dropped 15% in 5 minutes");

// Check if all breakers are clear
const safe = risk.checkCircuitBreakers();  // false -- FLASH_CRASH is open

// Check a specific breaker
const status = risk.checkBreaker(BreakerType.FLASH_CRASH);
// "OPEN" -> "HALF_OPEN" (after cooldown) -> "CLOSED" (after probes)

// Manual reset
risk.resetBreaker(BreakerType.FLASH_CRASH);

// Record successful probe in HALF_OPEN state
const closed = risk.recordProbeSuccess(BreakerType.FLASH_CRASH);
```

### Automatic Transitions

The `allClear()` method handles automatic state transitions:

- **OPEN -> HALF_OPEN**: When `Date.now() >= cooldownUntil`, the breaker transitions to HALF_OPEN. This allows limited probe operations.
- **HALF_OPEN -> CLOSED**: After the required number of successful probes (`halfOpenProbes`), the breaker resets to CLOSED.
- **HALF_OPEN still blocks**: Even in HALF_OPEN state, `allClear()` returns `false`. Normal operations only resume when the breaker returns to CLOSED.

### Custom Breaker Configuration

```typescript
const risk = new RiskManager({
  limits: { /* ... */ },
  circuitBreaker: {
    breakers: {
      FLASH_CRASH: { cooldownMs: 30 * 60_000, halfOpenProbes: 10 },
      GAS_SPIKE: { cooldownMs: 10 * 60_000, halfOpenProbes: 5 },
    },
  },
});
```

### Pluggable Storage

By default, breaker state is stored in memory (`InMemoryBreakerStore`). For distributed deployments, implement the `ICircuitBreakerStore` interface with a Redis-backed store:

```typescript
interface ICircuitBreakerStore {
  get(type: BreakerType): CircuitBreakerState | undefined;
  set(type: BreakerType, state: CircuitBreakerState): void;
  getAll(): CircuitBreakerState[];
}
```

## Portfolio Risk Analytics

The `RiskManager.getPortfolioRisk()` method computes aggregate portfolio risk statistics from historical data:

```typescript
const stats = risk.getPortfolioRisk(equityCurve, positionWeights);
```

| Metric | Description | Score Weight |
|--------|-------------|-------------|
| `drawdown` | Maximum peak-to-trough decline | Up to 40 points |
| `sharpeRatio` | Risk-adjusted return (annualized, 252 days) | Up to 15 points |
| `valueAtRisk95` | 95th percentile VaR | Up to 25 points |
| `concentration` | Portfolio concentration index (Herfindahl) | Up to 20 points |
| `riskScore` | Composite score (0-100) | Weighted blend |

Standalone risk functions are also available:

```typescript
import {
  calculateDrawdown,
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateVaR,
  concentrationIndex,
} from "@meridian/sdk";

const dd = calculateDrawdown([100, 105, 95, 110, 98]);
const sharpe = calculateSharpeRatio(dailyReturns);
const sortino = calculateSortinoRatio(dailyReturns);
const var95 = calculateVaR(dailyReturns, 0.95);
const hhi = concentrationIndex([0.4, 0.3, 0.2, 0.1]);
```

## MEV Protection

For transactions on Ethereum mainnet, Meridian integrates with Flashbots to submit transactions through private mempools, preventing frontrunning and sandwich attacks. This is configured at the `EVMProvider` level by routing `sendTransaction` calls through a Flashbots-compatible RPC endpoint:

```env
ETH_RPC_URL=https://rpc.flashbots.net
```

## Integration with Agent Lifecycle

The risk module is called in the **Act** phase of every decision cycle:

1. Agent's `think()` produces a decision: `{ action, params, reasoning, chainId }`
2. Before execution, the action passes through `RiskManager.validateAction()`
3. If `allowed: false`, the action is logged but not executed
4. If `allowed: true`, the action proceeds to chain execution
5. Warnings are logged even on approval for monitoring purposes

The circuit breaker check happens before pre-flight validation as a fast-path rejection. If any breaker is not CLOSED, the action is immediately vetoed with `riskScore: 100`.
