# Building a DeFi Portfolio Agent in 50 Lines of TypeScript

Most DeFi agent tutorials start with theory. This one starts with code. Here's a complete, working portfolio rebalancer agent using the Meridian SDK. We'll break it down line by line, show the strategy DSL, explain what happens under the hood, and get you running on testnet.

## The Full Agent: 50 Lines

```typescript
import {
  Agent, EventBus, StrategyBuilder,
  type ISenseProvider, type IThinkProvider,
  type IActProvider, type IMemoryProvider,
  type MarketSnapshot, type LLMRequest, type LLMResponse,
  type TxResult, type DecisionRecord,
  TriggerType, ActionType,
} from "@meridian/sdk";

// -- Providers (implement these for your chain + LLM) -----------------------
const sense: ISenseProvider = {
  async gather(agentId, chainIds) {
    // Read balances, prices, positions from your chain via viem
    return { timestamp: Date.now(), prices: {}, balances: {}, positions: [], gasPerChain: {}, blockNumbers: {} };
  }
};

const think: IThinkProvider = {
  async reason(request: LLMRequest): Promise<LLMResponse> {
    // Call Claude, GPT-4o, or a local model -- return structured JSON
    return { content: '{"action":"HOLD","params":{},"reasoning":"Within bounds","chainId":421614}',
      model: "claude-sonnet", provider: "anthropic",
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }, latencyMs: 0, cached: false };
  }
};

const act: IActProvider = {
  async execute(action, params, chainId, dryRun) {
    if (action === "HOLD") return null;
    // Execute swap via viem + Uniswap V3 adapter
    return { hash: "0x...", chainId, status: "confirmed", timestamp: Date.now() };
  }
};

const memory: IMemoryProvider = {
  decisions: [] as DecisionRecord[],
  async store(record) { this.decisions.push(record); },
  async getRecent(_id, limit) { return this.decisions.slice(-limit); }
};

// -- Strategy ---------------------------------------------------------------
const builder = new StrategyBuilder();
const strategy = builder.fromCode({
  id: "rebalancer-v1", name: "ETH/USDC Rebalancer", version: "1.0.0",
  description: "Rebalance when drift exceeds 5%",
  triggers: [{ type: "PORTFOLIO_DRIFT", params: { threshold: 0.05 } }],
  actions: [{ type: "REBALANCE", params: { protocol: "uniswap-v3" }, chainId: 421614 }],
  constraints: { maxPositionPct: 50, stopLossPct: -10, maxDailyTrades: 20, maxSlippageBps: 50 },
});

// -- Agent ------------------------------------------------------------------
const agent = new Agent(
  { name: "My Rebalancer", capabilities: ["SWAP", "PORTFOLIO_MANAGEMENT"],
    chains: [421614], tickIntervalMs: 30_000, dryRun: true },
  { eventBus: new EventBus(), sense, think, act, memory }
);

agent.setStrategy(strategy);
await agent.start();
```

That's it. A running autonomous agent with a decision cycle, strategy constraints, and structured LLM reasoning. Let's unpack what each piece does.

## Line-by-Line Walkthrough

### Imports (lines 1-9)

Everything comes from `@meridian/sdk`. The key types:

- **`Agent`** -- the core autonomous unit. Wraps an xstate v5 state machine for lifecycle management.
- **`EventBus`** -- typed event emitter. Agents emit events like `market:snapshot`, `agent:decision`, `agent:trade`, `agent:error`. Your UI or logging hooks subscribe here.
- **`StrategyBuilder`** -- validates and constructs strategy objects from plain definitions.
- **Provider interfaces** -- `ISenseProvider`, `IThinkProvider`, `IActProvider`, `IMemoryProvider`. These are the four pluggable dependencies every agent needs.

### The Four Providers (lines 12-40)

Meridian uses dependency injection. The agent doesn't know or care how you read chain data, call LLMs, execute transactions, or store decisions. You implement four interfaces:

**`ISenseProvider.gather(agentId, chainIds)`** returns a `MarketSnapshot` -- prices, balances, positions, gas costs, block numbers. In production, this uses viem's `publicClient` to read ERC-20 balances, call price oracles, and fetch gas estimates. The rebalancer example reads live balances on Arbitrum Sepolia:

```typescript
const balance = await publicClient.readContract({
  address: token.address,
  abi: erc20Abi,
  functionName: "balanceOf",
  args: [account.address],
});
```

**`IThinkProvider.reason(request)`** takes an `LLMRequest` with a prompt and system prompt, returns structured JSON. The agent builds the prompt internally from the strategy + market snapshot + cycle count. The response must be parseable as `{ action, params, reasoning, chainId }`. Zod validates the output shape.

**`IActProvider.execute(action, params, chainId, dryRun)`** runs the on-chain transaction. If `dryRun` is true, it simulates without submitting. Returns a `TxResult` with hash, status, gas used, and block number.

**`IMemoryProvider`** stores `DecisionRecord` objects -- the full reasoning chain for every cycle. This is what makes the agent learn. The Think phase can query recent decisions to inform the next action.

### Strategy Definition (lines 43-50)

The `StrategyBuilder.fromCode()` method takes a plain object and validates it into a typed `IStrategy`. Required fields:

- **`id`**, **`name`**, **`version`** (semver), **`description`** -- metadata.
- **`triggers`** -- what conditions activate the strategy. Supported types: `PRICE_ABOVE`, `PRICE_BELOW`, `PRICE_CHANGE_PCT`, `INDICATOR`, `TIME_INTERVAL`, `PORTFOLIO_DRIFT`, `GAS_BELOW`, `CUSTOM`.
- **`actions`** -- what the agent does when triggered. Types: `SWAP`, `ADD_LIQUIDITY`, `REMOVE_LIQUIDITY`, `BORROW`, `REPAY`, `STAKE`, `UNSTAKE`, `BRIDGE`, `REBALANCE`, `NOTIFY`, `CUSTOM`.
- **`constraints`** -- hard risk limits enforced by the risk module. `maxPositionPct` caps any single position. `stopLossPct` is the loss threshold. `maxSlippageBps` caps slippage per trade. `maxDailyTrades` rate-limits execution.

The builder validates everything at construction time. Invalid trigger types, missing fields, unreasonable constraint values -- all caught before the agent starts.

### Agent Creation (lines 53-58)

The `Agent` constructor takes two arguments:

1. **Config** -- validated by `AgentConfigSchema` (Zod). `name`, `capabilities`, `chains`, `tickIntervalMs`, `dryRun`, and optional `maxCycles` for auto-pause.
2. **Dependencies** -- the four providers plus an `EventBus`.

`agent.setStrategy(strategy)` binds the strategy. This must happen before `start()`.

### Starting the Loop

`agent.start()` kicks off the continuous Sense-Think-Act-Reflect loop. Here's what happens inside:

```
1. State machine transitions: IDLE -> SENSING
2. sense() -- SenseProvider.gather() reads chain data
3. State machine: SENSING -> THINKING
4. think() -- ThinkProvider.reason() calls LLM with snapshot + strategy context
5. State machine: THINKING -> ACTING
6. act() -- ActProvider.execute() runs the transaction (or dry-run simulation)
7. State machine: ACTING -> REFLECTING
8. reflect() -- MemoryProvider.store() saves the decision record
9. State machine: REFLECTING -> IDLE
10. Sleep for tickIntervalMs, then repeat from step 1
```

On error at any phase, the state machine transitions to `ERROR -> COOLDOWN`. After the cooldown period (configurable, default 10 seconds), it returns to `IDLE` and resumes the loop. Fatal errors stop the agent entirely.

## Strategy DSL Example

For more complex strategies, Meridian supports a custom DSL that compiles to `IStrategy` objects:

```
strategy "Yield Optimizer" v1.0.0

  when PRICE_CHANGE_PCT(token: "ETH", threshold: 5, window: "1h")
  when GAS_BELOW(maxGwei: 30)

  then SWAP(tokenIn: "USDC", tokenOut: "ETH", amount: "1000")
    on chain 1
    via "uniswap-v3"

  with constraints
    maxPositionPct: 40
    stopLossPct: -8
    maxSlippageBps: 100
    maxDailyTrades: 5
```

This compiles to the same `IStrategy` object the builder produces. The DSL is parsed by a peggy grammar and can also be generated from natural language via the LLM layer: describe your strategy in plain English, and Meridian translates it to executable code.

## Running on Testnet

**Prerequisites:** Node.js 20+, pnpm, an Arbitrum Sepolia RPC URL, and a funded testnet wallet.

```bash
# Clone and install
git clone https://github.com/meridian-agents/meridian.git
cd meridian
pnpm install

# Set up the rebalancer example
cd examples/defi-rebalancer
cp .env.example .env
# Edit .env: add your PRIVATE_KEY, RPC_URL, ANTHROPIC_API_KEY

# Run in dry-run mode (no real transactions)
pnpm start
```

The agent will start logging cycles. You'll see the portfolio table, LLM reasoning, and actions for each cycle. In dry-run mode, transactions are simulated but not submitted.

To go live on testnet, set `DRY_RUN=false` in your `.env`. The agent will send real transactions on Arbitrum Sepolia (testnet ETH, no real value at risk).

## Extending With Custom Strategies

The provider interfaces are deliberately minimal. To build a different strategy:

1. **Change the `SenseProvider`** to read different data. Aave health factors, Curve pool ratios, Jupiter quotes on Solana -- whatever your strategy needs.
2. **Adjust the strategy definition** with different triggers and actions. Use `PRICE_ABOVE`/`PRICE_BELOW` for limit orders. `INDICATOR` with RSI or MACD params for technical strategies. `TIME_INTERVAL` for DCA.
3. **Update the `ActProvider`** to call different protocols. The SDK ships with a `UniswapV3Adapter` and protocol adapter interface (`IProtocolAdapter`) for adding more.

The agent lifecycle doesn't change. Sense-Think-Act-Reflect handles everything from simple DCA bots to complex multi-protocol yield optimizers.

## What You're Building On

The Meridian SDK exports everything you need:

- **Core:** `Agent`, `Runtime`, `Meridian`, `EventBus`, `PluginRegistry`
- **LLM:** `LLMGateway`, `ClaudeProvider`, `OpenAIProvider`, `OllamaProvider`, structured output parsing with Zod schemas
- **Risk:** `PreFlightValidator`, `CircuitBreakerManager`, `RiskManager`, portfolio risk calculations (drawdown, Sharpe, Sortino, VaR)
- **Strategy:** `StrategyBuilder`, `Backtester`, technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands, VWAP)
- **Chains:** `EVMProvider`, `GasEstimator`, `NonceManager`, `UniswapV3Adapter`
- **Memory:** `RedisWorkingMemory`, `PostgresEpisodicMemory`, `QdrantSemanticMemory`, `RAGPipeline`

208 tests. Full TypeScript types. MIT license.

Start building: [github.com/meridian-agents/meridian](https://github.com/meridian-agents/meridian)

Docs: [docs.meridianagents.xyz](https://docs.meridianagents.xyz)

Questions? Open an issue or join the Discord.
