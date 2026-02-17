# Strategy DSL Reference

Meridian strategies define **what** an agent should do. A strategy is an `IStrategy` object composed of triggers, actions, constraints, and parameters. This document covers the strategy definition format, available trigger and action types, the backtesting engine, and how to build strategies programmatically.

## Strategy Structure

Every strategy implements the `IStrategy` interface:

```typescript
interface IStrategy {
  id: string;                         // Unique identifier
  name: string;                       // Human-readable name
  version: string;                    // Semver (e.g. "1.0.0")
  description: string;                // What this strategy does
  triggers: Trigger[];                // When to activate
  actions: Action[];                  // What to execute
  constraints: StrategyConstraints;   // Risk limits
  params: Record<string, unknown>;    // Arbitrary parameters
}
```

## Building Strategies

Use the `StrategyBuilder` to construct and validate strategies from plain objects:

```typescript
import { StrategyBuilder } from "@meridian/sdk";

const builder = new StrategyBuilder();

const strategy = builder.fromCode({
  id: "eth-dca-v1",
  name: "ETH Dollar-Cost Average",
  version: "1.0.0",
  description: "Buy ETH every hour with USDC",
  triggers: [
    {
      type: "TIME_INTERVAL",
      params: { bars: 12 },
      description: "Execute every 12 ticks",
    },
  ],
  actions: [
    {
      type: "SWAP",
      params: { tokenIn: "USDC", tokenOut: "ETH", amount: "100" },
      chainId: 1,
      protocol: "uniswap-v3",
    },
  ],
  constraints: {
    maxPositionPct: 30,
    stopLossPct: -10,
    maxDailyTrades: 24,
    maxSlippageBps: 50,
  },
  params: {},
});
```

The `fromCode()` method validates all required fields, checks trigger/action types against the supported enums, and parses constraints through the `StrategyConstraintsSchema` Zod schema. It throws a `StrategyError` if anything is invalid.

## Validation

You can validate an existing strategy without throwing:

```typescript
const result = builder.validate(strategy);

if (!result.valid) {
  console.log("Errors:", result.errors);
}
```

The validator checks:
- Required string fields (`id`, `name`, `version`, `description`)
- Semver format for `version`
- At least one trigger and one action
- Valid trigger types and action types
- Action `chainId` is a positive integer
- Constraint reasonableness (e.g., `maxPositionPct >= 1`, `stopLossPct >= -50`, `maxSlippageBps <= 500`)

## Trigger Types

Triggers define the conditions under which a strategy activates. Multiple triggers are evaluated with OR logic -- any single trigger firing activates the strategy.

| Type | Params | Description |
|------|--------|-------------|
| `PRICE_ABOVE` | `{ threshold: number }` | Fires when the asset price exceeds the threshold |
| `PRICE_BELOW` | `{ threshold: number }` | Fires when the asset price drops below the threshold |
| `PRICE_CHANGE_PCT` | `{ pct: number, lookback?: number }` | Fires when price changes by at least `pct`% over `lookback` bars (default 1) |
| `INDICATOR` | `{ indicator: string, condition: string, value: number }` | Fires based on a technical indicator condition |
| `TIME_INTERVAL` | `{ bars: number }` | Fires every N bars/ticks |
| `PORTFOLIO_DRIFT` | `{ threshold: number, tokens: string[], targets: Record<string, number> }` | Fires when allocation drifts beyond threshold |
| `GAS_BELOW` | `{ maxGwei: number }` | Fires when gas price is below a threshold |
| `CUSTOM` | `Record<string, unknown>` | User-defined trigger logic |

### Indicator Trigger Details

The `INDICATOR` trigger type supports these built-in indicators:

| Indicator | Key | Description |
|-----------|-----|-------------|
| Simple Moving Average | `sma` or `sma_20` | 20-period SMA |
| Relative Strength Index | `rsi` or `rsi_14` | 14-period RSI |
| Bollinger Upper Band | `bb_upper` or `bb_upper_20` | 20-period, 2 std dev |
| Bollinger Lower Band | `bb_lower` or `bb_lower_20` | 20-period, 2 std dev |

Conditions: `above`, `below`, `cross_above`, `cross_below`.

Example:

```typescript
{
  type: "INDICATOR",
  params: {
    indicator: "rsi_14",
    condition: "below",
    value: 30,
  },
  description: "RSI oversold signal",
}
```

## Action Types

Actions define what the agent executes when triggers fire.

| Type | Description | Required Params |
|------|-------------|-----------------|
| `SWAP` | Token swap via DEX | `tokenIn`, `tokenOut`, `amount` |
| `ADD_LIQUIDITY` | Provide liquidity to a pool | `tokenA`, `tokenB`, `amounts` |
| `REMOVE_LIQUIDITY` | Withdraw liquidity | `tokenA`, `tokenB` |
| `BORROW` | Borrow from a lending protocol | `token`, `amount` |
| `REPAY` | Repay a borrow position | `token`, `amount` |
| `STAKE` | Stake tokens | `token`, `amount` |
| `UNSTAKE` | Unstake tokens | `token`, `amount` |
| `BRIDGE` | Cross-chain transfer | `token`, `amount`, `destChainId` |
| `NOTIFY` | Send an alert (no on-chain tx) | `message` |
| `REBALANCE` | Multi-token portfolio rebalance | `tokens`, `targets` |
| `CUSTOM` | User-defined action | varies |

Each action must specify a `chainId` and optionally a `protocol`:

```typescript
{
  type: "SWAP",
  params: {
    tokenIn: "USDC",
    tokenOut: "ETH",
    amount: "500",
  },
  chainId: 42161,
  protocol: "uniswap-v3",
}
```

## Constraints

Constraints are hard limits enforced by the risk module. They are defined per strategy and validated with `StrategyConstraintsSchema`:

```typescript
const StrategyConstraintsSchema = z.object({
  maxPositionPct: z.number().min(0).max(100).default(25),
  stopLossPct: z.number().min(-100).max(0).default(-5),
  takeProfitPct: z.number().min(0).max(1000).optional(),
  maxDailyTrades: z.number().int().positive().default(10),
  maxSlippageBps: z.number().int().min(0).max(10_000).default(50),
  allowedChains: z.array(z.number().int().positive()).optional(),
  allowedProtocols: z.array(z.string()).optional(),
});
```

| Field | Default | Description |
|-------|---------|-------------|
| `maxPositionPct` | 25 | Maximum single position as % of portfolio |
| `stopLossPct` | -5 | Auto-close at this loss % |
| `takeProfitPct` | -- | Auto-close at this profit % (optional) |
| `maxDailyTrades` | 10 | Maximum trades per day |
| `maxSlippageBps` | 50 | Maximum slippage in basis points |
| `allowedChains` | all | Restrict to specific chain IDs |
| `allowedProtocols` | all | Restrict to specific protocol adapters |

## Natural Language Strategies

Users can describe strategies in plain English. The `NLStrategyInputSchema` defines the input format:

```typescript
import { NLStrategyInputSchema } from "@meridian/sdk";

const input = NLStrategyInputSchema.parse({
  description: "Buy ETH when RSI drops below 30, sell when it crosses above 70",
  riskTolerance: "moderate",
  budget: { token: "USDC", amount: 5000 },
  chains: ["arbitrum"],
});
```

The LLM integration layer translates this natural language input into a structured `IStrategy` object using the Claude Sonnet provider. The generated strategy is then validated through the same `StrategyBuilder.validate()` pipeline.

## Backtesting

Test strategies against historical data before deploying them live:

```typescript
import { Backtester, type OHLCVBar } from "@meridian/sdk";

// Historical OHLCV data
const data: OHLCVBar[] = [
  { timestamp: 1700000000, open: 2000, high: 2050, low: 1980, close: 2020, volume: 1000 },
  { timestamp: 1700003600, open: 2020, high: 2080, low: 2010, close: 2060, volume: 1200 },
  // ... more bars
];

const backtester = new Backtester(strategy, data);
const result = backtester.run();
```

The `BacktestResult` contains:

| Metric | Type | Description |
|--------|------|-------------|
| `totalReturn` | `number` | Total return as decimal (0.05 = 5%) |
| `sharpeRatio` | `number` | Annualized Sharpe ratio (252 trading days) |
| `sortinoRatio` | `number` | Annualized Sortino ratio (downside deviation) |
| `maxDrawdown` | `number` | Maximum peak-to-trough decline as decimal |
| `winRate` | `number` | Win rate as decimal (0.6 = 60%) |
| `totalTrades` | `number` | Number of completed round-trip trades |
| `equityCurve` | `number[]` | Portfolio value at each bar |

The backtester pre-computes technical indicators (SMA-20, EMA-12, EMA-26, RSI-14, Bollinger Bands) and evaluates triggers at each bar. Positions are opened when triggers fire and closed on stop-loss, take-profit, or trigger de-assertion.

## Technical Indicators

All indicator functions are pure, deterministic, and have no external dependencies:

```typescript
import { sma, ema, rsi, macd, bollingerBands, vwap, zScore } from "@meridian/sdk";

const closes = [100, 102, 104, 103, 105, 107, 106, 108, 110, 112, /* ... */];

const sma20     = sma(closes, 20);          // Simple moving average
const ema12     = ema(closes, 12);          // Exponential moving average
const rsi14     = rsi(closes, 14);          // Relative strength index (0-100)
const macdData  = macd(closes, 12, 26, 9); // { macd, signal, histogram }
const bb        = bollingerBands(closes, 20, 2); // { upper, middle, lower }
const z         = zScore(closes, 20);       // Z-score for mean reversion
```

## Complete Example

Here is a full strategy definition for a portfolio rebalancer, taken from the `defi-rebalancer` example:

```typescript
import { TriggerType, ActionType, type IStrategy } from "@meridian/sdk";

const strategy: IStrategy = {
  id: "defi-rebalancer-v1",
  name: "DeFi Portfolio Rebalancer",
  version: "1.0.0",
  description: "Monitor portfolio on Arbitrum Sepolia. Rebalance when drift exceeds 5%.",
  triggers: [
    {
      type: TriggerType.PORTFOLIO_DRIFT,
      params: {
        threshold: 0.05,
        tokens: ["ETH", "USDC", "WBTC"],
        targets: { ETH: 0.5, USDC: 0.3, WBTC: 0.2 },
      },
      description: "Trigger when any token drifts >5% from target",
    },
    {
      type: TriggerType.TIME_INTERVAL,
      params: { intervalMs: 30_000 },
      description: "Check portfolio every 30 seconds",
    },
  ],
  actions: [
    {
      type: ActionType.REBALANCE,
      params: {
        protocol: "uniswap-v3",
        maxSlippageBps: 100,
        tokens: [
          { symbol: "ETH", targetPct: 0.5 },
          { symbol: "USDC", targetPct: 0.3 },
          { symbol: "WBTC", targetPct: 0.2 },
        ],
      },
      chainId: 421614,
      protocol: "uniswap-v3",
    },
  ],
  constraints: {
    maxPositionPct: 50,
    stopLossPct: -10,
    maxDailyTrades: 20,
    maxSlippageBps: 100,
    allowedChains: [421614],
    allowedProtocols: ["uniswap-v3"],
  },
  params: {
    driftThreshold: 0.05,
    targetAllocations: { ETH: 0.5, USDC: 0.3, WBTC: 0.2 },
  },
};
```
