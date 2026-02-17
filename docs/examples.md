# Examples

Meridian ships with two working example agents that demonstrate different patterns for building autonomous DeFi systems. Both are fully functional and can be run against testnets or in dry-run mode.

## DeFi Portfolio Rebalancer

**Location:** `examples/defi-rebalancer/`

A single-agent system that autonomously monitors and rebalances a multi-token portfolio on Arbitrum Sepolia.

### What It Demonstrates

- Creating and configuring a Meridian `Agent` with dependency injection
- Implementing all four provider interfaces (`ISenseProvider`, `IThinkProvider`, `IActProvider`, `IMemoryProvider`)
- Building an `IStrategy` with `PORTFOLIO_DRIFT` and `TIME_INTERVAL` triggers
- Reading on-chain ERC-20 balances with viem
- Using Claude for LLM-based trade reasoning
- Hooking into the `EventBus` for real-time display
- Graceful shutdown with signal handling

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Rebalancer Agent                     │
│                                                       │
│   Sense: Read balances on Arbitrum Sepolia            │
│   Think: Claude reasons about portfolio drift         │
│   Act:   Execute swaps (dry-run or live)              │
│   Reflect: Log decision with reasoning chain          │
└─────────────────────────────────────────────────────┘
```

### Running

```bash
# Dry-run mode (safe, no real transactions)
pnpm --filter @meridian/example-defi-rebalancer start

# Live mode (sends real testnet transactions)
DRY_RUN=false pnpm --filter @meridian/example-defi-rebalancer start
```

### Configuration

Environment variables (set in `.env` or shell):

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | required | Claude API key |
| `PRIVATE_KEY` | required | Wallet private key (testnet only) |
| `RPC_URL` | Arbitrum Sepolia public | RPC endpoint |
| `DRY_RUN` | `true` | Disable real transactions |
| `DRIFT_THRESHOLD` | `0.05` | Rebalance trigger (5% drift) |
| `TICK_INTERVAL_SEC` | `30` | Seconds between cycles |
| `MAX_SLIPPAGE_BPS` | `100` | Max slippage (1%) |

### Strategy Definition

The rebalancer strategy is built in `rebalancer-strategy.ts`:

```typescript
import { TriggerType, ActionType, type IStrategy } from "@meridian/sdk";

export function createRebalancerStrategy(): IStrategy {
  return {
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
      },
      {
        type: TriggerType.TIME_INTERVAL,
        params: { intervalMs: 30_000 },
      },
    ],
    actions: [
      {
        type: ActionType.REBALANCE,
        params: { protocol: "uniswap-v3", maxSlippageBps: 100 },
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
}
```

### Provider Implementation

The example implements all four providers:

**RebalancerSenseProvider** -- reads native ETH and ERC-20 balances using viem's `publicClient.getBalance()` and `publicClient.readContract()`. Computes allocation drift against target percentages using mock USD prices for testnet tokens.

**RebalancerThinkProvider** -- sends the market snapshot to Claude via the Anthropic SDK. The agent's prompt includes the current portfolio state, drift percentages, and strategy constraints. Claude returns a JSON decision with `action`, `params`, `reasoning`, and `chainId`.

**RebalancerActProvider** -- in dry-run mode, logs the proposed swap. In live mode, sends a testnet transaction as a demonstration. A production implementation would call the `UniswapV3Adapter` to encode and execute the swap.

**RebalancerMemoryProvider** -- stores decisions in an in-memory array for the demo. A production system would use `PostgresEpisodicMemory`.

### EventBus Integration

The example hooks into agent events for a rich terminal display:

```typescript
eventBus.on("market:snapshot", () => {
  printPortfolioTable(allocationRows, blockNumber, totalValueUsd);
});

eventBus.on("agent:decision", ({ record }) => {
  printReasoning(record.reasoning);
  printAction(record.action, record.txHash ?? null, null);
});

eventBus.on("agent:error", ({ error, recoverable }) => {
  printError(`${error.message}${recoverable ? " (recoverable)" : " (FATAL)"}`);
});
```

## Multi-Agent Portfolio

**Location:** `examples/multi-agent-portfolio/`

A three-agent collaborative system where specialized agents work together to manage a DeFi portfolio through the shared `EventBus`.

### What It Demonstrates

- Multi-agent coordination through the `EventBus`
- Separation of concerns: analysis, risk management, and execution
- Rule-based risk evaluation with structured check results
- The Analyst-Risk-Executor pipeline pattern
- Simulated market data generation for testing

### Architecture

```
┌──────────────┐     signals     ┌──────────────┐    approved    ┌──────────────┐
│    Market     │───────────────►│     Risk      │──────────────►│   Executor   │
│   Analyst     │                │   Manager     │               │              │
│               │                │               │               │              │
│ Scans markets │                │ Evaluates:    │               │ Plans route  │
│ Produces      │                │ - Exposure    │               │ Executes tx  │
│ trade signals │                │ - Drawdown    │               │ Reports      │
│               │                │ - Gas cost    │               │ results      │
│               │                │ - Confidence  │               │              │
└──────────────┘                └──────────────┘               └──────────────┘
```

### Running

```bash
# Default: dry-run mode with 10-second cycles
pnpm --filter @meridian/example-multi-agent-portfolio start

# Custom configuration
CYCLE_INTERVAL_SEC=5 MAX_CYCLES=20 pnpm --filter @meridian/example-multi-agent-portfolio start
```

### Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CYCLE_INTERVAL_SEC` | `10` | Seconds between team cycles |
| `MAX_CYCLES` | `0` | Max cycles (0 = unlimited) |
| `DRY_RUN` | `true` | Disable real transactions |

### Agent Roles

**Market Analyst** (`analyst.ts`)

Scans market data and produces `TradeSignal` objects:

```typescript
interface TradeSignal {
  id: string;
  token: string;
  direction: "BUY" | "SELL";
  confidence: number;         // 0-1
  reasoning: string;
  suggestedSizePct: number;
  chainId: number;
  timestamp: number;
}
```

The analyst generates signals based on price deviations, on-chain volume, and market conditions. In the demo, it uses heuristic rules; a production system would use Claude for reasoning. Each signal is broadcast on the `EventBus` for other agents to consume.

**Risk Manager** (`risk-manager.ts`)

Evaluates each trade signal against risk criteria:

- Minimum confidence threshold (0.6)
- Portfolio exposure limits (max 80%)
- Daily drawdown check (max -5%)
- Gas cost reasonableness (max 50 gwei)

Each check produces a `passed/failed` result with explanation. The signal is only approved if all checks pass.

**Executor** (`executor.ts`)

Plans and executes approved trades. In the demo, it simulates execution with mock transaction hashes. In production, it would:

1. Select the optimal DEX route via protocol adapters
2. Encode the transaction via `UniswapV3Adapter.encode()`
3. Submit via `EVMProvider.sendTransaction()`
4. Wait for confirmation and report results

### Cycle Flow

Each cycle follows this sequence:

1. Generate or fetch market snapshot
2. Analyst scans the snapshot, produces 0-N signals
3. For each signal:
   a. Risk Manager evaluates the signal
   b. If approved, Executor plans and executes the trade
4. Print team summary (signals produced, approved, executed)
5. Wait for the next cycle

### Output

The multi-agent example produces structured terminal output:

```
--- Cycle #1 --- 14:32:05 ---

[Analyst] Scanning markets...
[Analyst] Signal: BUY ETH -- confidence 72%

[Risk] Evaluating: BUY ETH
  Confidence >= 60%         PASS
  Exposure 35% <= 80%       PASS
  Drawdown -1.2% >= -5%     PASS
  Gas 0.4 gwei <= 50        PASS
[Risk] APPROVED -- All checks passed

[Executor] BUY 5% ETH via Uniswap V3
[Executor] SUCCESS tx: 0xabc...def

Team: 1 signal, 1 approved, 1 executed (42ms)
```

## Building Your Own Agent

To build a new agent, follow this pattern:

### 1. Create the Strategy

Define triggers, actions, and constraints using the `StrategyBuilder` or directly constructing an `IStrategy` object.

### 2. Implement Providers

Create implementations of the four provider interfaces tailored to your use case. At minimum:

```typescript
const sense: ISenseProvider = {
  async gather(agentId, chainIds) {
    // Read on-chain data, return MarketSnapshot
  },
};

const think: IThinkProvider = {
  async reason(request) {
    // Call LLM, return LLMResponse
  },
};

const act: IActProvider = {
  async execute(action, params, chainId, dryRun) {
    // Execute on-chain action, return TxResult
  },
};

const memory: IMemoryProvider = {
  async store(record) { /* Save decision */ },
  async getRecent(agentId, limit) { /* Fetch recent decisions */ },
};
```

### 3. Create and Start the Agent

```typescript
import { Agent, EventBus } from "@meridian/sdk";

const eventBus = new EventBus();
const agent = new Agent(
  {
    name: "My Custom Agent",
    capabilities: ["SWAP"],
    chains: [42161],
    tickIntervalMs: 10_000,
    dryRun: true,
  },
  { eventBus, sense, think, act, memory },
);

agent.setStrategy(strategy);

// Hook into events
eventBus.on("agent:decision", ({ record }) => {
  console.log(`Decision: ${record.action} -- ${record.reasoning}`);
});

// Start the autonomous loop
await agent.start();
```

### 4. Add Risk Management

Wrap your `IActProvider` with risk validation:

```typescript
import { RiskManager } from "@meridian/sdk";

const risk = new RiskManager({
  limits: {
    maxPositionSizeUsd: 10_000,
    maxSlippageBps: 100,
    // ...
  },
});

const safeAct: IActProvider = {
  async execute(action, params, chainId, dryRun) {
    const decision = risk.validateAction(action, actionParams, portfolio);
    if (!decision.allowed) {
      console.log("Vetoed:", decision.reason);
      return null;
    }
    return act.execute(action, params, chainId, dryRun);
  },
};
```

## Further Reading

- [Getting Started](getting-started.md) -- installation and first steps
- [Strategy DSL Reference](strategy-dsl.md) -- full trigger and action documentation
- [Protocol Adapters](protocol-adapters.md) -- connecting to DeFi protocols
- [Risk Management](risk-management.md) -- pre-flight validation and circuit breakers
- [API Reference](api-reference/sdk.md) -- complete SDK API
