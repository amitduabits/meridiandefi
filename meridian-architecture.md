# Meridian — Technical Architecture

### AI Agent Framework for DeFi
**meridianagents.xyz · meridianai.ai**

> A navigational line connecting poles — precision routing across chains and markets.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           MERIDIAN AGENT FRAMEWORK                                  │
│                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                        DEVELOPER SDK (@meridian/sdk)                         │   │
│  │   Strategy DSL  ·  Agent Builder API  ·  CLI Tools  ·  Plugin System        │   │
│  └──────────┬──────────────────────────────┬───────────────────────┬────────────┘   │
│             │                              │                       │                 │
│  ┌──────────▼──────────┐  ┌───────────────▼────────────┐  ┌──────▼──────────┐      │
│  │  1. AGENT RUNTIME   │  │  2. LLM INTEGRATION LAYER  │  │  4. STRATEGY    │      │
│  │     ENGINE          │  │                             │  │     ENGINE      │      │
│  │                     │  │  ┌─────────┐ ┌──────────┐  │  │                 │      │
│  │  Event Loop         │◄─┤  │ Claude  │ │  GPT-4   │  │  │  NL Parser     │      │
│  │  State Machine      │  │  │   API   │ │   API    │  │  │  Code Sandbox  │      │
│  │  Decision Cycle     │  │  ├─────────┤ ├──────────┤  │  │  Backtest Eng  │      │
│  │  Task Scheduler     │  │  │  Llama  │ │ Mistral  │  │  │  Signal Eval   │      │
│  │                     │  │  │ (local) │ │ (local)  │  │  │                 │      │
│  └──────┬──────┬───────┘  │  └─────────┘ └──────────┘  │  └────────┬────────┘      │
│         │      │          └──────────────┬──────────────┘           │                │
│         │      │                         │                         │                │
│  ┌──────▼──────▼─────────────────────────▼─────────────────────────▼────────────┐   │
│  │                      5. MEMORY & STATE MANAGEMENT                            │   │
│  │                                                                              │   │
│  │  Working Memory (Redis)  ·  Episodic Store (Postgres)  ·  Vector DB (Qdrant) │   │
│  └──────────────┬────────────────────────────┬──────────────────────────────────┘   │
│                 │                            │                                       │
│  ┌──────────────▼──────────┐  ┌──────────────▼──────────────┐                       │
│  │  3. CHAIN CONNECTOR     │  │  6. AGENT-TO-AGENT          │                       │
│  │     MODULE              │  │     COMMUNICATION           │                       │
│  │                         │  │                              │                       │
│  │  ┌───────┐ ┌────────┐  │  │  Discovery (DHT/Registry)   │                       │
│  │  │  EVM  │ │ Solana  │  │  │  Messaging (libp2p)         │                       │
│  │  │ viem  │ │ @solana │  │  │  Negotiation Protocol       │                       │
│  │  │ ethers│ │  /web3  │  │  │  Payment Channels            │                       │
│  │  └───┬───┘ └───┬────┘  │  └──────────────┬──────────────┘                       │
│  │      │         │       │                  │                                       │
│  │  ┌───▼─────────▼────┐  │                  │                                       │
│  │  │ Unified ABI      │  │                  │                                       │
│  │  │ Gas Optimizer    │  │                  │                                       │
│  │  │ Tx Simulator     │  │                  │                                       │
│  │  └──────────────────┘  │                  │                                       │
│  └────────────┬───────────┘                  │                                       │
│               │                              │                                       │
│  ┌────────────▼──────────────────────────────▼──────────────────────────────────┐   │
│  │                       7. RISK MANAGEMENT MODULE                              │   │
│  │                                                                              │   │
│  │  Circuit Breakers  ·  Position Limits  ·  Gas Caps  ·  Anomaly Detection     │   │
│  │  Drawdown Guards   ·  Slippage Protection  ·  MEV Shielding                  │   │
│  └──────────────────────────────────┬───────────────────────────────────────────┘   │
│                                     │                                               │
│  ┌──────────────────────────────────▼───────────────────────────────────────────┐   │
│  │                       8. MONITORING DASHBOARD                                │   │
│  │                                                                              │   │
│  │  React + TanStack Query  ·  Real-time WebSocket  ·  P&L Charts              │   │
│  │  Tx Explorer  ·  Agent Logs  ·  Strategy Visualizer  ·  Alert System         │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                    ON-CHAIN CONTRACTS (Solidity + Anchor)                     │   │
│  │                                                                              │   │
│  │  AgentRegistry.sol  ·  PaymentEscrow.sol  ·  StrategyVault.sol               │   │
│  │  MeridianToken.sol  ·  GovernanceModule.sol                                  │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
 User/Developer                External Data
      │                             │
      ▼                             ▼
 ┌─────────┐    ┌─────────────────────────────┐
 │ SDK/CLI │───►│   Strategy Engine            │
 └─────────┘    │   (parse intent → plan)      │
                └──────────┬──────────────────┘
                           │
                           ▼
                ┌──────────────────────┐       ┌───────────────┐
                │   Agent Runtime      │◄─────►│  LLM Layer    │
                │   (execute plan)     │       │  (reason)     │
                └──────┬───────────────┘       └───────────────┘
                       │
              ┌────────┼────────┐
              ▼        ▼        ▼
        ┌──────┐ ┌──────┐ ┌──────────┐
        │Memory│ │Chain │ │  Risk    │
        │Store │ │Conn. │ │  Mgmt   │
        └──────┘ └──┬───┘ └──────────┘
                    │
                    ▼
            ┌───────────────┐
            │  Blockchain   │
            │  (EVM/Solana) │
            └───────────────┘
```

---

## Module 1: Agent Runtime Engine

### Purpose
The execution core that orchestrates agent lifecycles. It runs a tick-based event loop where each tick drives agents through a **Sense → Think → Act → Reflect** decision cycle implemented as a finite state machine.

### Architecture

```
┌─────────────────────────────────────────────┐
│              Agent Runtime Engine            │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │           Event Loop (Tick-Based)     │  │
│  │                                       │  │
│  │   tick_interval: configurable         │  │
│  │   max_concurrent_agents: N            │  │
│  │   priority_queue: PriorityQueue       │  │
│  └───────────────┬───────────────────────┘  │
│                  │                           │
│  ┌───────────────▼───────────────────────┐  │
│  │         State Machine (per agent)     │  │
│  │                                       │  │
│  │  IDLE ──► SENSING ──► THINKING ──►    │  │
│  │                                       │  │
│  │  ◄── REFLECTING ◄── ACTING ◄──────   │  │
│  │                                       │  │
│  │  ERROR ──► COOLDOWN ──► IDLE          │  │
│  │  PAUSED (manual intervention)         │  │
│  └───────────────┬───────────────────────┘  │
│                  │                           │
│  ┌───────────────▼───────────────────────┐  │
│  │         Decision Cycle                │  │
│  │                                       │  │
│  │  SENSE:   Read market data, events    │  │
│  │  THINK:   LLM reasoning + strategy    │  │
│  │  ACT:     Execute transactions        │  │
│  │  REFLECT: Evaluate outcome, learn     │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Key Interfaces

```typescript
// Core agent interface
interface IAgent {
  id: string;
  state: AgentState;
  config: AgentConfig;
  strategy: IStrategy;

  sense(context: MarketContext): Promise<Observation[]>;
  think(observations: Observation[]): Promise<ActionPlan>;
  act(plan: ActionPlan): Promise<ExecutionResult[]>;
  reflect(results: ExecutionResult[]): Promise<void>;

  pause(): void;
  resume(): void;
  kill(): void;
}

// Runtime orchestrator
interface IRuntime {
  registerAgent(agent: IAgent): string;
  removeAgent(agentId: string): void;
  getAgentState(agentId: string): AgentState;

  start(): Promise<void>;
  stop(): Promise<void>;
  tick(): Promise<void>;               // single cycle for testing

  on(event: RuntimeEvent, handler: EventHandler): void;
}

// Agent lifecycle states
enum AgentState {
  IDLE      = 'IDLE',
  SENSING   = 'SENSING',
  THINKING  = 'THINKING',
  ACTING    = 'ACTING',
  REFLECTING = 'REFLECTING',
  ERROR     = 'ERROR',
  COOLDOWN  = 'COOLDOWN',
  PAUSED    = 'PAUSED',
}

// Configuration
interface AgentConfig {
  tickInterval: number;                 // ms between decision cycles
  maxConcurrentActions: number;
  cooldownOnError: number;              // ms to wait after error
  memoryConfig: MemoryConfig;
  riskLimits: RiskLimits;
  chains: ChainConfig[];                // which chains this agent operates on
  llmProvider: LLMProviderConfig;
}
```

### Technology Choices
- **Node.js 20+ with TypeScript** — non-blocking I/O is ideal for the tick-based loop; `AsyncLocalStorage` for per-agent context propagation
- **xstate v5** — battle-tested finite state machine library for agent state transitions; serializable state for crash recovery
- **bullmq** — Redis-backed job queue for scheduling ticks and handling retries with exponential backoff
- **pino** — structured, low-overhead logging for high-frequency agent events

### Connections to Other Modules
- Calls **LLM Integration Layer** during THINK phase
- Calls **Chain Connector** during ACT phase
- Reads/writes **Memory & State** during SENSE and REFLECT phases
- Checks **Risk Management** before every ACT phase (pre-flight validation)
- Emits events consumed by **Monitoring Dashboard** via WebSocket
- Receives strategy definitions from **Strategy Engine**

---

## Module 2: LLM Integration Layer

### Purpose
Abstracts all large language model interactions behind a unified interface. Supports multiple providers (Claude, GPT-4, Llama, Mistral) with automatic fallback, prompt management, structured output parsing, and cost tracking.

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                LLM Integration Layer                │
│                                                     │
│  ┌────────────────────────────────────────────────┐ │
│  │              Unified LLM Gateway               │ │
│  │                                                │ │
│  │  prompt_registry    structured_output_parser    │ │
│  │  retry_with_fallback   cost_tracker            │ │
│  │  response_cache        rate_limiter            │ │
│  └──────────┬─────────────────────────────────────┘ │
│             │                                       │
│  ┌──────────▼─────────────────────────────────────┐ │
│  │           Provider Adapters                    │ │
│  │                                                │ │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────────┐  │ │
│  │  │ Claude   │ │  OpenAI  │ │   Ollama       │  │ │
│  │  │ Adapter  │ │  Adapter │ │   Adapter      │  │ │
│  │  │ (3.5/4)  │ │ (GPT-4o) │ │ (Llama/Mistr.)│  │ │
│  │  └──────────┘ └──────────┘ └───────────────┘  │ │
│  └────────────────────────────────────────────────┘ │
│                                                     │
│  ┌────────────────────────────────────────────────┐ │
│  │           Prompt Templates                     │ │
│  │                                                │ │
│  │  market_analysis.hbs    trade_decision.hbs     │ │
│  │  risk_assessment.hbs    portfolio_rebalance.hbs│ │
│  │  natural_language_to_strategy.hbs              │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Key Interfaces

```typescript
// Unified LLM interface
interface ILLMProvider {
  id: string;
  name: string;
  complete(request: LLMRequest): Promise<LLMResponse>;
  stream(request: LLMRequest): AsyncGenerator<LLMChunk>;
  estimateCost(request: LLMRequest): CostEstimate;
}

interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  schema?: ZodSchema;              // for structured output
  temperature?: number;
  maxTokens?: number;
  tools?: ToolDefinition[];        // function calling
  context?: ConversationMessage[]; // multi-turn
}

interface LLMResponse {
  content: string;
  parsed?: unknown;                // if schema provided, parsed + validated
  toolCalls?: ToolCall[];
  usage: { inputTokens: number; outputTokens: number; cost: number };
  provider: string;
  latencyMs: number;
}

// Gateway with fallback chain
interface ILLMGateway {
  complete(request: LLMRequest, opts?: GatewayOpts): Promise<LLMResponse>;
  stream(request: LLMRequest, opts?: GatewayOpts): AsyncGenerator<LLMChunk>;
  registerProvider(provider: ILLMProvider, priority: number): void;
  setFallbackChain(chain: string[]): void;
}

interface GatewayOpts {
  preferredProvider?: string;       // e.g., 'claude' for complex reasoning
  fallbackOnError?: boolean;        // default: true
  cacheKey?: string;                // cache identical requests
  maxRetries?: number;
}
```

### Technology Choices
- **@anthropic-ai/sdk** — Claude API client with native tool use and structured outputs
- **openai** — OpenAI SDK for GPT-4o / GPT-4-turbo
- **ollama-js** — local model inference for Llama 3.1, Mistral, Code Llama
- **zod** — runtime schema validation for structured LLM outputs; integrates with both Claude and OpenAI structured outputs
- **handlebars** — prompt templating with partials for composable prompts
- **tiktoken** — token counting for cost estimation and context window management

### Provider Selection Strategy
| Use Case | Primary | Fallback | Reasoning |
|---|---|---|---|
| Complex trade reasoning | Claude Opus/Sonnet | GPT-4o | Strongest multi-step reasoning |
| Market data extraction | GPT-4o-mini | Mistral 7B (local) | Fast, cheap structured extraction |
| Strategy translation (NL→code) | Claude Sonnet | GPT-4o | Best at code generation w/ constraints |
| Real-time signal processing | Llama 3.1 8B (local) | GPT-4o-mini | Zero latency, no API costs |
| Risk assessment | Claude Sonnet | Claude Haiku | Safety-critical, needs best reasoning |

### Connections to Other Modules
- Called by **Agent Runtime** during THINK and REFLECT phases
- Called by **Strategy Engine** to parse natural language strategies
- Uses **Memory & State** to build context windows (RAG over agent history)
- Cost data pushed to **Monitoring Dashboard**

---

## Module 3: Chain Connector Module

### Purpose
Provides a unified, chain-agnostic interface for reading blockchain state, simulating transactions, and submitting signed transactions across any EVM chain and Solana. Handles gas estimation, nonce management, and transaction lifecycle tracking.

### Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    Chain Connector Module                     │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Unified DeFi Interface                     │ │
│  │                                                         │ │
│  │  swap()  ·  addLiquidity()  ·  borrow()  ·  stake()    │ │
│  │  bridge()  ·  getPrice()  ·  getBalance()  ·  approve() │ │
│  └─────────────────────┬───────────────────────────────────┘ │
│                        │                                     │
│  ┌─────────────────────▼───────────────────────────────────┐ │
│  │           Protocol Adapters (Plugin System)             │ │
│  │                                                         │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │ │
│  │  │Uniswap V3│ │  Aave V3 │ │  Lido    │ │  Jupiter │  │ │
│  │  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤  │ │
│  │  │Curve     │ │Compound  │ │  Maker   │ │  Raydium │  │ │
│  │  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤  │ │
│  │  │1inch     │ │ Morpho   │ │ Pendle   │ │  Orca    │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │ │
│  └─────────────────────┬───────────────────────────────────┘ │
│                        │                                     │
│  ┌─────────────────────▼───────────────────────────────────┐ │
│  │              Chain Providers                             │ │
│  │                                                         │ │
│  │  ┌───────────────────────┐  ┌────────────────────────┐  │ │
│  │  │    EVM Provider       │  │   Solana Provider      │  │ │
│  │  │    (viem + ethers)    │  │   (@solana/web3.js)    │  │ │
│  │  │                       │  │   (@coral-xyz/anchor)  │  │ │
│  │  │  Ethereum  Arbitrum   │  │                        │  │ │
│  │  │  Base      Optimism   │  │   Mainnet  Devnet     │  │ │
│  │  │  Polygon   Avalanche  │  │                        │  │ │
│  │  └───────────────────────┘  └────────────────────────┘  │ │
│  └─────────────────────┬───────────────────────────────────┘ │
│                        │                                     │
│  ┌─────────────────────▼───────────────────────────────────┐ │
│  │              Transaction Engine                          │ │
│  │                                                         │ │
│  │  Tx Simulation (Tenderly/Foundry)                       │ │
│  │  Nonce Manager (per-chain, per-wallet)                  │ │
│  │  Gas Optimizer (EIP-1559 / priority fee strategies)     │ │
│  │  MEV Protection (Flashbots Protect / MEV Blocker)       │ │
│  │  Tx Lifecycle: PENDING → SUBMITTED → CONFIRMED / FAILED │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

### Key Interfaces

```typescript
// Chain-agnostic DeFi operations
interface IDeFiConnector {
  // Core operations
  swap(params: SwapParams): Promise<TxResult>;
  addLiquidity(params: LiquidityParams): Promise<TxResult>;
  removeLiquidity(params: RemoveLiquidityParams): Promise<TxResult>;
  borrow(params: BorrowParams): Promise<TxResult>;
  repay(params: RepayParams): Promise<TxResult>;
  stake(params: StakeParams): Promise<TxResult>;
  bridge(params: BridgeParams): Promise<TxResult>;

  // Read operations
  getPrice(token: TokenId, chain: ChainId): Promise<PriceData>;
  getBalance(wallet: Address, token: TokenId, chain: ChainId): Promise<BigNumber>;
  getPositions(wallet: Address, chain: ChainId): Promise<Position[]>;
  getPoolData(poolId: string, protocol: string): Promise<PoolData>;

  // Transaction management
  simulate(tx: UnsignedTx): Promise<SimulationResult>;
  submit(tx: SignedTx): Promise<TxReceipt>;
  waitForConfirmation(txHash: string, chain: ChainId): Promise<TxReceipt>;
}

// Protocol adapter plugin interface
interface IProtocolAdapter {
  protocolId: string;                   // e.g., 'uniswap-v3'
  supportedChains: ChainId[];
  supportedActions: DeFiAction[];

  encode(action: DeFiAction, params: unknown): Promise<UnsignedTx>;
  decode(receipt: TxReceipt): Promise<DecodedResult>;
  quote(action: DeFiAction, params: unknown): Promise<QuoteResult>;
}

// Swap parameters example
interface SwapParams {
  chain: ChainId;
  tokenIn: TokenId;
  tokenOut: TokenId;
  amountIn: BigNumber;
  slippageBps: number;                  // basis points (e.g., 50 = 0.5%)
  preferredProtocol?: string;           // optional, auto-routes if omitted
  deadline?: number;                    // unix timestamp
}

// Unified transaction result
interface TxResult {
  txHash: string;
  chain: ChainId;
  status: 'pending' | 'confirmed' | 'failed';
  gasUsed: BigNumber;
  gasCost: BigNumber;
  blockNumber?: number;
  decodedEvents: DecodedEvent[];
  protocol: string;
}
```

### Technology Choices
- **viem** — modern, type-safe EVM client; better TypeScript support than ethers v6
- **ethers v6** — fallback compatibility layer; wider ecosystem of ABI tooling
- **@solana/web3.js v2** — Solana RPC client
- **@coral-xyz/anchor** — Solana program interaction (for Meridian on-chain contracts)
- **@tenderly/sdk** — transaction simulation before submission
- **@flashbots/ethers-provider-bundle** — MEV-protected transaction submission

### Connections to Other Modules
- Called by **Agent Runtime** during ACT phase
- **Risk Management** validates every transaction before submission
- Transaction state written to **Memory & State** for audit trail
- Real-time tx events streamed to **Monitoring Dashboard**
- Protocol adapters discoverable by **Strategy Engine** (agents know what actions are available)

---

## Module 4: Strategy Engine

### Purpose
The translation layer between human intent and executable agent behavior. Accepts strategies defined in natural language, a custom DSL, or raw TypeScript, and compiles them into executable plans. Includes a backtesting engine to validate strategies against historical data before live deployment.

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Strategy Engine                        │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │            Input Parsers                            │ │
│  │                                                     │ │
│  │  Natural Language ──► LLM Translation ──► DSL AST   │ │
│  │  Meridian DSL     ──► DSL Parser      ──► DSL AST   │ │
│  │  TypeScript Code  ──► Direct Load     ──► Strategy  │ │
│  └─────────────────────┬───────────────────────────────┘ │
│                        │                                 │
│  ┌─────────────────────▼───────────────────────────────┐ │
│  │         Strategy Compiler                           │ │
│  │                                                     │ │
│  │  AST ──► Validation ──► Optimization ──► Executable │ │
│  │                                                     │ │
│  │  Supported primitives:                              │ │
│  │    WHEN(condition) → DO(action)                     │ │
│  │    IF(signal) THEN(action) ELSE(action)             │ │
│  │    EVERY(interval) CHECK(condition)                 │ │
│  │    ON(event) TRIGGER(action)                        │ │
│  └─────────────────────┬───────────────────────────────┘ │
│                        │                                 │
│  ┌─────────────────────▼───────────────────────────────┐ │
│  │         Backtest Engine                             │ │
│  │                                                     │ │
│  │  Historical data replay  ·  P&L simulation          │ │
│  │  Slippage modeling       ·  Gas cost estimation     │ │
│  │  Monte Carlo scenarios   ·  Sharpe/Sortino calc     │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Key Interfaces

```typescript
// Strategy definition (what developers write)
interface IStrategy {
  id: string;
  name: string;
  version: string;
  description: string;

  // Triggers: what conditions activate this strategy
  triggers: Trigger[];

  // Actions: what to do when triggered
  actions: Action[];

  // Constraints: risk and operational limits
  constraints: StrategyConstraints;

  // Parameters: user-tunable values
  parameters: Record<string, StrategyParam>;
}

// The Meridian DSL
type Trigger =
  | { type: 'price_cross';    token: TokenId; threshold: number; direction: 'above' | 'below' }
  | { type: 'time_interval';  every: string }  // cron expression or duration
  | { type: 'event';          contract: Address; event: string; chain: ChainId }
  | { type: 'portfolio_drift'; maxDrift: number }
  | { type: 'llm_signal';     prompt: string; threshold: number }
  | { type: 'agent_message';  fromAgent?: string; topic?: string };

type Action =
  | { type: 'swap';           params: Partial<SwapParams> }
  | { type: 'rebalance';      targetWeights: Record<TokenId, number> }
  | { type: 'provide_liquidity'; params: Partial<LiquidityParams> }
  | { type: 'hedge';          instrument: string; ratio: number }
  | { type: 'notify';         channel: 'webhook' | 'telegram' | 'email'; message: string }
  | { type: 'delegate';       toAgent: string; task: string };

// Natural language strategy input
interface NLStrategyInput {
  description: string;   // "Buy ETH when RSI drops below 30, sell when above 70"
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  budget: { token: TokenId; amount: number };
  chains: ChainId[];
}

// Strategy builder API (for SDK)
interface IStrategyBuilder {
  fromNaturalLanguage(input: NLStrategyInput): Promise<IStrategy>;
  fromDSL(dsl: string): IStrategy;
  fromTypeScript(module: string): IStrategy;
  validate(strategy: IStrategy): ValidationResult;
  backtest(strategy: IStrategy, opts: BacktestOpts): Promise<BacktestResult>;
}

// Backtest results
interface BacktestResult {
  totalReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  gasEstimate: BigNumber;
  equityCurve: { timestamp: number; value: number }[];
}
```

### Meridian DSL Example

```
strategy "ETH Mean Reversion" v1.0

param lookback_period = 20        // days
param z_score_entry = -2.0
param z_score_exit = 0.0
param position_size = 0.1         // 10% of portfolio

when price_zscore(ETH, $lookback_period) < $z_score_entry
  and portfolio.exposure(ETH) < $position_size
do
  swap(USDC -> ETH, amount: portfolio.value * $position_size)
  notify(telegram, "Entered ETH mean reversion long")

when price_zscore(ETH, $lookback_period) > $z_score_exit
  and portfolio.has_position(ETH)
do
  swap(ETH -> USDC, amount: portfolio.balance(ETH))
  notify(telegram, "Closed ETH mean reversion")

constraints
  max_position: 25%
  stop_loss: -5%
  max_daily_trades: 10
  chains: [ethereum, arbitrum]
```

### Technology Choices
- **Custom PEG parser (peggy)** — for the Meridian DSL; generates type-safe AST
- **vm2** or **isolated-vm** — sandboxed TypeScript execution for user-defined strategy code
- **LLM Layer** — natural language → DSL translation via Claude/GPT-4
- **DuckDB (WASM)** — in-process analytical queries for backtesting over historical price data
- **Apache Arrow** — columnar data format for efficient time-series manipulation

### Connections to Other Modules
- Outputs executable strategies consumed by **Agent Runtime**
- Calls **LLM Layer** for natural language parsing
- References **Chain Connector** to know which actions/protocols are available
- Backtest engine reads historical data from **Memory & State**
- Publishes strategy metadata to **Monitoring Dashboard**

---

## Module 5: Memory & State Management

### Purpose
Gives agents persistent, queryable memory across decision cycles and sessions. Implements three tiers: working memory (hot, in-process), episodic memory (warm, queryable history), and semantic memory (vector-indexed knowledge). Enables agents to learn from past outcomes and maintain conversational context.

### Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                   Memory & State Management                     │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  TIER 1: Working Memory (Hot)                             │  │
│  │  Redis 7+ with RedisJSON                                  │  │
│  │                                                           │  │
│  │  Current market snapshot  ·  Active positions              │  │
│  │  In-flight transactions   ·  Current decision context     │  │
│  │  Agent state machine      ·  Rate limiter counters        │  │
│  │  TTL: seconds to minutes                                  │  │
│  └───────────────────────────┬───────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────▼───────────────────────────────┐  │
│  │  TIER 2: Episodic Memory (Warm)                           │  │
│  │  PostgreSQL 16 + TimescaleDB                              │  │
│  │                                                           │  │
│  │  Transaction history      ·  Decision logs                │  │
│  │  P&L records              ·  Strategy execution traces    │  │
│  │  Market snapshots (OHLCV) ·  Agent interaction logs       │  │
│  │  TTL: days to months (partitioned by time)                │  │
│  └───────────────────────────┬───────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────▼───────────────────────────────┐  │
│  │  TIER 3: Semantic Memory (Knowledge)                      │  │
│  │  Qdrant Vector DB                                         │  │
│  │                                                           │  │
│  │  Embedded past decisions + outcomes                        │  │
│  │  Protocol documentation chunks                            │  │
│  │  Market regime classifications                            │  │
│  │  Similarity search for "what did I do last time X?"       │  │
│  │  TTL: persistent                                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Memory Manager (orchestrates tiers)                      │  │
│  │                                                           │  │
│  │  Auto-promotes hot → warm after decision cycle            │  │
│  │  Auto-embeds warm → semantic on configurable schedule     │  │
│  │  RAG pipeline: query → vector search → context building   │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Key Interfaces

```typescript
// Memory manager (per agent)
interface IMemoryManager {
  // Working memory (hot path)
  working: {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    getMarketSnapshot(chain: ChainId): Promise<MarketSnapshot>;
    getActivePositions(): Promise<Position[]>;
  };

  // Episodic memory (queryable history)
  episodic: {
    recordDecision(decision: DecisionRecord): Promise<void>;
    recordTransaction(tx: TxRecord): Promise<void>;
    queryDecisions(filter: DecisionFilter): Promise<DecisionRecord[]>;
    getPerformance(timeRange: TimeRange): Promise<PerformanceMetrics>;
    getTransactionHistory(filter: TxFilter): Promise<TxRecord[]>;
  };

  // Semantic memory (similarity search)
  semantic: {
    store(content: string, metadata: Record<string, unknown>): Promise<void>;
    search(query: string, topK?: number): Promise<SemanticResult[]>;
    searchSimilarDecisions(context: MarketContext, topK?: number): Promise<DecisionRecord[]>;
  };

  // RAG pipeline
  buildContext(query: string, maxTokens: number): Promise<string>;
}

// Decision record (what the agent decided and why)
interface DecisionRecord {
  agentId: string;
  timestamp: number;
  observation: Observation[];           // what it saw
  reasoning: string;                    // LLM reasoning trace
  action: ActionPlan;                   // what it decided to do
  outcome?: ExecutionResult;            // what happened
  reward?: number;                      // self-assessed quality (-1 to 1)
}

// State snapshot (serializable for crash recovery)
interface AgentStateSnapshot {
  agentId: string;
  stateMachine: SerializedState;        // xstate serialized state
  workingMemory: Record<string, unknown>;
  lastDecisionTimestamp: number;
  checkpointVersion: number;
}
```

### Technology Choices
- **Redis 7+ with RedisJSON** — sub-millisecond working memory; JSON document support for complex state
- **PostgreSQL 16 + TimescaleDB** — time-series optimized storage for episodic data; hypertables with automatic partitioning
- **Qdrant** — purpose-built vector database; fast ANN search with payload filtering; better DeFi-specific filtering than Pinecone
- **@xenova/transformers** — local embedding generation (all-MiniLM-L6-v2) to avoid API costs for high-frequency embedding
- **drizzle-orm** — type-safe SQL for Postgres; lightweight, no runtime overhead

### Connections to Other Modules
- **Agent Runtime** reads/writes working memory every tick; creates checkpoints for crash recovery
- **LLM Layer** uses `buildContext()` for RAG-augmented prompts
- **Strategy Engine** backtest engine reads historical data from episodic tier
- **Monitoring Dashboard** queries episodic tier for P&L and transaction history
- **Risk Management** reads position data from working memory

---

## Module 6: Agent-to-Agent Communication Protocol

### Purpose
Enables agents to discover each other, negotiate collaborations, delegate tasks, share signals, and settle payments. This is what makes Meridian a network, not just a single-agent framework. Agents can form composable workflows: one agent detects opportunities, another executes trades, another manages risk.

### Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│              Agent-to-Agent Communication Protocol                 │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Discovery Layer                                             │ │
│  │                                                              │ │
│  │  On-chain Registry (AgentRegistry.sol)                       │ │
│  │    → agent address, capabilities, reputation score           │ │
│  │  Off-chain DHT (libp2p Kademlia)                             │ │
│  │    → real-time availability, load, latency                   │ │
│  └──────────────────────────┬───────────────────────────────────┘ │
│                             │                                     │
│  ┌──────────────────────────▼───────────────────────────────────┐ │
│  │  Messaging Layer                                             │ │
│  │                                                              │ │
│  │  Transport: libp2p GossipSub (pub/sub) + direct streams     │ │
│  │  Encoding: Protocol Buffers (typed messages)                 │ │
│  │  Auth: Signed messages (agent wallet key)                    │ │
│  │                                                              │ │
│  │  Message Types:                                              │ │
│  │    SIGNAL      — market signal broadcast                     │ │
│  │    TASK_REQUEST — request another agent to do something      │ │
│  │    TASK_RESPONSE — accept/reject/counter                     │ │
│  │    RESULT      — task completion with proof                  │ │
│  │    HEARTBEAT   — liveness and capability updates             │ │
│  └──────────────────────────┬───────────────────────────────────┘ │
│                             │                                     │
│  ┌──────────────────────────▼───────────────────────────────────┐ │
│  │  Negotiation Protocol                                        │ │
│  │                                                              │ │
│  │  1. DISCOVER  — find agents with required capabilities       │ │
│  │  2. PROPOSE   — send task + offered payment                  │ │
│  │  3. NEGOTIATE — counter-offers (max 3 rounds)                │ │
│  │  4. AGREE     — both parties sign commitment                 │ │
│  │  5. ESCROW    — payment locked in PaymentEscrow.sol          │ │
│  │  6. EXECUTE   — task performed                               │ │
│  │  7. VERIFY    — result validated (on-chain proof if needed)  │ │
│  │  8. SETTLE    — escrow released                              │ │
│  └──────────────────────────┬───────────────────────────────────┘ │
│                             │                                     │
│  ┌──────────────────────────▼───────────────────────────────────┐ │
│  │  Payment Settlement                                          │ │
│  │                                                              │ │
│  │  PaymentEscrow.sol — on-chain escrow for task payments       │ │
│  │  Streaming: Superfluid or Sablier for ongoing subscriptions  │ │
│  │  Micro-payments: Payment channels for high-frequency signals │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

### Key Interfaces

```typescript
// Agent communication interface
interface IAgentComm {
  // Discovery
  register(capabilities: AgentCapability[]): Promise<void>;
  discover(query: CapabilityQuery): Promise<AgentInfo[]>;

  // Messaging
  broadcast(topic: string, signal: Signal): Promise<void>;
  subscribe(topic: string, handler: SignalHandler): void;
  sendDirect(agentId: string, message: AgentMessage): Promise<AgentMessage>;

  // Negotiation
  requestTask(agentId: string, task: TaskRequest): Promise<TaskAgreement>;
  respondToTask(requestId: string, response: TaskResponse): Promise<void>;

  // Payment
  createEscrow(agreement: TaskAgreement): Promise<EscrowId>;
  releaseEscrow(escrowId: EscrowId, proof?: Bytes): Promise<TxResult>;
  disputeEscrow(escrowId: EscrowId, evidence: Bytes): Promise<TxResult>;
}

// Agent capabilities (what an agent can do)
interface AgentCapability {
  action: string;           // e.g., 'arbitrage_detection', 'risk_analysis'
  chains: ChainId[];
  protocols: string[];
  pricing: PricingModel;    // per-task, subscription, revenue-share
  reputation: number;       // 0-100, updated on-chain
}

// Task negotiation
interface TaskRequest {
  type: string;
  description: string;
  requirements: Record<string, unknown>;
  maxPayment: { token: TokenId; amount: BigNumber };
  deadline: number;
  sla: {
    maxLatency: number;     // ms
    minAccuracy?: number;
  };
}

// Protocol Buffer message schema (simplified)
// Full .proto files in /packages/proto/
message AgentMessage {
  string sender_id = 1;
  string recipient_id = 2;
  MessageType type = 3;
  bytes payload = 4;
  bytes signature = 5;      // signed with agent wallet
  uint64 timestamp = 6;
  uint64 nonce = 7;
}
```

### Technology Choices
- **libp2p** — peer-to-peer networking; GossipSub for pub/sub, Kademlia DHT for discovery
- **protobuf (protobuf-ts)** — efficient binary serialization for inter-agent messages
- **On-chain Registry (Solidity)** — permanent capability registration and reputation
- **Superfluid** — programmable payment streams for subscription-based agent services

### Connections to Other Modules
- **Agent Runtime** invokes communication during ACT phase (delegate to other agents)
- **Strategy Engine** strategies can include `delegate` actions
- **Chain Connector** handles escrow contract interactions
- **Risk Management** validates outbound payments and task agreements
- **Memory & State** logs all inter-agent interactions
- **On-chain Contracts** — AgentRegistry.sol and PaymentEscrow.sol

---

## Module 7: Risk Management Module

### Purpose
The safety layer that prevents catastrophic losses. Every transaction, position change, and strategy modification passes through risk validation. Implements circuit breakers, position limits, drawdown guards, gas caps, and anomaly detection. This module has veto power over any action.

### Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                    Risk Management Module                          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Pre-Flight Validator (runs before every transaction)        │ │
│  │                                                              │ │
│  │  ✓ Position size within limits?                              │ │
│  │  ✓ Total portfolio exposure acceptable?                      │ │
│  │  ✓ Gas cost reasonable? (< X% of trade value)               │ │
│  │  ✓ Slippage within tolerance?                                │ │
│  │  ✓ Contract approved / not blacklisted?                      │ │
│  │  ✓ Daily loss limit not breached?                            │ │
│  │  ✓ Transaction simulation passed?                            │ │
│  └──────────────────────────┬───────────────────────────────────┘ │
│                             │                                     │
│  ┌──────────────────────────▼───────────────────────────────────┐ │
│  │  Circuit Breakers                                            │ │
│  │                                                              │ │
│  │  Portfolio Drawdown:  -10% daily → pause all agents          │ │
│  │  Flash Crash:         >20% price move in 5min → freeze       │ │
│  │  Gas Spike:           gas > 500 gwei → delay non-urgent tx   │ │
│  │  RPC Failure:         >3 consecutive failures → fallback RPC │ │
│  │  Oracle Stale:        price age > 60s → halt trading         │ │
│  │  Contract Anomaly:    unusual return data → quarantine        │ │
│  └──────────────────────────┬───────────────────────────────────┘ │
│                             │                                     │
│  ┌──────────────────────────▼───────────────────────────────────┐ │
│  │  Real-Time Monitors                                          │ │
│  │                                                              │ │
│  │  Position Monitor — tracks all open positions across chains  │ │
│  │  PnL Monitor      — running P&L with unrealized gains       │ │
│  │  Gas Monitor      — tracks gas prices, estimates costs       │ │
│  │  Anomaly Detector — ML model for unusual market behavior     │ │
│  │  Health Monitor   — agent health, RPC status, API limits     │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  MEV Protection                                              │ │
│  │                                                              │ │
│  │  Flashbots Protect for Ethereum mainnet                      │ │
│  │  MEV Blocker RPC for broader coverage                        │ │
│  │  Private mempools where available                            │ │
│  │  Slippage-aware routing via aggregators                      │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

### Key Interfaces

```typescript
// Pre-flight validation (called before every transaction)
interface IRiskManager {
  // Validation
  validateAction(action: ActionPlan, context: RiskContext): Promise<RiskDecision>;
  validateTransaction(tx: UnsignedTx, context: RiskContext): Promise<RiskDecision>;

  // Circuit breakers
  checkCircuitBreakers(agentId: string): CircuitBreakerStatus;
  tripBreaker(breakerType: BreakerType, reason: string): void;
  resetBreaker(breakerType: BreakerType): void;

  // Monitoring
  getPortfolioRisk(agentId: string): Promise<PortfolioRisk>;
  getGasEstimate(chain: ChainId): Promise<GasEstimate>;
  getHealthStatus(): HealthStatus;

  // Configuration
  setLimits(agentId: string, limits: RiskLimits): void;
  getLimits(agentId: string): RiskLimits;
}

interface RiskDecision {
  allowed: boolean;
  reason?: string;                    // why blocked
  modifications?: ActionModification; // suggested changes (e.g., reduce size)
  warnings: string[];                 // non-blocking concerns
  riskScore: number;                  // 0-100
}

interface RiskLimits {
  maxPositionSize: number;           // % of portfolio per position
  maxPortfolioExposure: number;      // % total deployed
  maxDailyLoss: number;              // % daily drawdown before halt
  maxSingleTradeLoss: number;        // % max loss on single trade
  maxGasPerTx: BigNumber;           // wei
  maxGasPercentOfTrade: number;     // gas cost as % of trade value
  maxSlippageBps: number;           // max acceptable slippage
  maxDailyTrades: number;
  allowedChains: ChainId[];
  allowedProtocols: string[];
  blockedContracts: Address[];
}

// Circuit breaker types
enum BreakerType {
  PORTFOLIO_DRAWDOWN = 'PORTFOLIO_DRAWDOWN',
  FLASH_CRASH        = 'FLASH_CRASH',
  GAS_SPIKE          = 'GAS_SPIKE',
  RPC_FAILURE        = 'RPC_FAILURE',
  ORACLE_STALE       = 'ORACLE_STALE',
  CONTRACT_ANOMALY   = 'CONTRACT_ANOMALY',
}
```

### Technology Choices
- **Custom TypeScript module** — risk logic must be deterministic, no LLM dependency
- **Redis** — shared circuit breaker state across agent instances
- **Prometheus client** — exports metrics for gas, positions, P&L
- **Anomaly detection** — Python sidecar using `scikit-learn` Isolation Forest / `river` for online learning

### Connections to Other Modules
- Called by **Agent Runtime** before every ACT phase (blocking — action cannot proceed without approval)
- Reads positions from **Memory & State** (working memory)
- Gets gas data from **Chain Connector**
- Pushes alerts to **Monitoring Dashboard**
- Anomaly detector (Python) communicates via gRPC sidecar

---

## Module 8: Monitoring Dashboard

### Purpose
Real-time visibility into all agent activity, portfolio performance, transaction history, and system health. Serves as both an operational control plane and an analytical tool for strategy optimization.

### Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                       Monitoring Dashboard                             │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  Frontend (React + TypeScript)                                  │  │
│  │                                                                 │  │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────┐  │  │
│  │  │  Agent    │ │ Portfolio │ │    Tx     │ │   Strategy    │  │  │
│  │  │ Overview  │ │   P&L    │ │  Explorer │ │  Performance  │  │  │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────────┘  │  │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────────┐  │  │
│  │  │  System   │ │   Risk   │ │   Agent   │ │    Alert      │  │  │
│  │  │  Health   │ │ Dashboard│ │   Logs    │ │   Manager     │  │  │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────────┘  │  │
│  └─────────────────────────┬───────────────────────────────────────┘  │
│                            │                                          │
│  ┌─────────────────────────▼───────────────────────────────────────┐  │
│  │  Backend API (tRPC + WebSocket)                                 │  │
│  │                                                                 │  │
│  │  REST: /api/agents, /api/portfolio, /api/transactions           │  │
│  │  WS:   real-time agent events, price feeds, alert stream        │  │
│  │  Auth: JWT + wallet signature (SIWE)                            │  │
│  └─────────────────────────┬───────────────────────────────────────┘  │
│                            │                                          │
│  ┌─────────────────────────▼───────────────────────────────────────┐  │
│  │  Data Layer                                                     │  │
│  │                                                                 │  │
│  │  TimescaleDB  ──► time-series queries (P&L, metrics)            │  │
│  │  Redis Pub/Sub ──► real-time event streaming                    │  │
│  │  Prometheus    ──► system metrics (CPU, memory, RPC latency)    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Views

| View | Data Sources | Refresh Rate |
|---|---|---|
| Agent Overview | Runtime state, active strategies, current positions | 1s (WebSocket) |
| Portfolio P&L | Episodic memory, live prices from Chain Connector | 5s |
| Transaction Explorer | Episodic memory, on-chain data | On new tx |
| Strategy Performance | Backtest results, live metrics, Sharpe/Sortino | 1min |
| Risk Dashboard | Risk module state, circuit breaker status, exposure | 1s |
| System Health | Prometheus metrics, RPC status, API rate limits | 5s |
| Agent Logs | Structured logs (pino), decision traces | Live stream |
| Alert Manager | Risk alerts, circuit breaker trips, error spikes | Instant push |

### Technology Choices
- **React 18 + TypeScript** — component framework
- **TanStack Query v5** — server state management with WebSocket subscriptions
- **Recharts** — time-series charts for P&L and equity curves
- **tRPC** — end-to-end type-safe API layer between dashboard and agent runtime
- **Tailwind CSS v4** — utility-first styling
- **Radix UI** — accessible component primitives
- **Sign-In With Ethereum (SIWE)** — wallet-based authentication

### Connections to Other Modules
- Subscribes to **Agent Runtime** events via Redis Pub/Sub → WebSocket
- Queries **Memory & State** (Postgres/TimescaleDB) for historical data
- Reads **Risk Management** state for circuit breaker and exposure views
- Can send control commands to **Agent Runtime** (pause/resume/kill agents)

---

## Smart Contract Architecture

### On-Chain vs Off-Chain Decision Framework

| Component | Location | Reasoning |
|---|---|---|
| Agent Registry | On-chain | Trust-minimized agent identity + capabilities; queryable by any agent |
| Payment Escrow | On-chain | Trustless payment settlement between agents |
| Strategy Vault | On-chain | Non-custodial vault for agent-managed funds (users deposit/withdraw) |
| Governance | On-chain | Protocol parameter updates, fee changes |
| Agent Runtime | Off-chain | Too compute-intensive; needs sub-second latency |
| LLM Reasoning | Off-chain | Cannot run on-chain; results referenced by hash |
| Strategy Logic | Off-chain | Complex conditional logic; would exceed gas limits |
| Risk Management | Off-chain | Needs real-time data feeds; latency-critical |

### Contract Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   Meridian Smart Contracts                       │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  AgentRegistry.sol                                        │  │
│  │                                                           │  │
│  │  registerAgent(address, capabilities, metadataURI)        │  │
│  │  updateCapabilities(agentId, capabilities)                │  │
│  │  updateReputation(agentId, score)  // only by oracle      │  │
│  │  getAgent(agentId) → AgentInfo                            │  │
│  │  findAgents(capabilityFilter) → AgentInfo[]               │  │
│  │  deregisterAgent(agentId)                                 │  │
│  │                                                           │  │
│  │  Events: AgentRegistered, AgentUpdated, AgentDeregistered │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  PaymentEscrow.sol                                        │  │
│  │                                                           │  │
│  │  createEscrow(taskId, provider, token, amount, deadline)  │  │
│  │  releaseEscrow(escrowId, proof)  // by requester          │  │
│  │  claimEscrow(escrowId)           // by provider after TTL │  │
│  │  disputeEscrow(escrowId, evidence)                        │  │
│  │  resolveDispute(escrowId, recipient)  // by arbitrator    │  │
│  │                                                           │  │
│  │  States: CREATED → FUNDED → RELEASED / DISPUTED → SETTLED│  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  StrategyVault.sol (ERC-4626 compliant)                   │  │
│  │                                                           │  │
│  │  deposit(amount, receiver)                                │  │
│  │  withdraw(shares, receiver, owner)                        │  │
│  │  executeStrategy(calldata[])  // only authorized agent    │  │
│  │  setAgent(agentAddress)       // only vault owner         │  │
│  │  emergencyWithdraw()          // timelock + multisig      │  │
│  │                                                           │  │
│  │  Limits: maxTxValue, dailyLimit, approvedProtocols[]      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  MeridianGovernance.sol (OpenZeppelin Governor)           │  │
│  │                                                           │  │
│  │  propose() / vote() / execute()                           │  │
│  │  Governs: fee rates, approved protocols, registry params  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Deployment Targets
- **Primary:** Ethereum L2 (Base or Arbitrum) — low gas, EVM compatible, strong ecosystem
- **Secondary:** Solana — for Jupiter/Raydium integrations (Anchor programs mirror Solidity contracts)
- **Bridge:** LayerZero or Hyperlane for cross-chain agent registry reads

---

## Developer SDK API Design

### Package: `@meridian/sdk`

```typescript
import { Meridian, Agent, Strategy } from '@meridian/sdk';

// 1. Initialize the framework
const meridian = new Meridian({
  chains: {
    ethereum: { rpcUrl: process.env.ETH_RPC, walletKey: process.env.PRIVATE_KEY },
    arbitrum: { rpcUrl: process.env.ARB_RPC },
    solana:   { rpcUrl: process.env.SOL_RPC, walletKey: process.env.SOL_KEY },
  },
  llm: {
    primary: { provider: 'claude', apiKey: process.env.ANTHROPIC_API_KEY, model: 'claude-sonnet-4-20250514' },
    fallback: { provider: 'openai', apiKey: process.env.OPENAI_API_KEY, model: 'gpt-4o' },
  },
  memory: {
    redis: process.env.REDIS_URL,
    postgres: process.env.DATABASE_URL,
    qdrant: process.env.QDRANT_URL,
  },
  risk: {
    maxDailyLoss: 0.05,          // 5% daily drawdown limit
    maxPositionSize: 0.25,       // 25% per position
    maxGasPercentOfTrade: 0.02,  // 2% gas cap
  },
});

// 2. Define a strategy (multiple ways)

// Option A: Natural language
const strategy = await meridian.strategy.fromNaturalLanguage({
  description: `
    Monitor ETH/USDC price on Uniswap V3 (Arbitrum).
    When the 20-period RSI drops below 30, buy ETH with 10% of portfolio.
    When RSI rises above 70, sell all ETH.
    Never hold more than 25% in ETH. Stop loss at -5%.
  `,
  riskTolerance: 'moderate',
  budget: { token: 'USDC', amount: 10000 },
  chains: ['arbitrum'],
});

// Option B: DSL
const strategy = meridian.strategy.fromDSL(`
  strategy "RSI Mean Reversion" v1.0
  param rsi_low = 30
  param rsi_high = 70
  when rsi(ETH/USDC, 20) < $rsi_low do swap(USDC -> ETH, 10%)
  when rsi(ETH/USDC, 20) > $rsi_high do swap(ETH -> USDC, 100%)
  constraints max_position: 25%, stop_loss: -5%
`);

// Option C: TypeScript
const strategy = meridian.strategy.fromCode({
  triggers: [
    { type: 'time_interval', every: '5m' },
  ],
  async execute(ctx) {
    const rsi = await ctx.indicators.rsi('ETH/USDC', 20);
    if (rsi < 30) {
      return ctx.actions.swap({ tokenIn: 'USDC', tokenOut: 'ETH', amountPercent: 10 });
    }
    if (rsi > 70) {
      return ctx.actions.swap({ tokenIn: 'ETH', tokenOut: 'USDC', amountPercent: 100 });
    }
    return ctx.actions.hold();
  },
});

// 3. Backtest
const results = await strategy.backtest({
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  initialCapital: 10000,
});
console.log(`Sharpe: ${results.sharpeRatio}, Max DD: ${results.maxDrawdown}`);

// 4. Create and deploy agent
const agent = meridian.createAgent({
  name: 'RSI Bot',
  strategy,
  chains: ['arbitrum'],
});

// 5. Run
await agent.start();

// 6. Monitor
agent.on('decision', (d) => console.log(`Decision: ${d.action.type}`));
agent.on('trade', (t) => console.log(`Trade: ${t.txHash}`));
agent.on('error', (e) => console.error(`Error: ${e.message}`));

// 7. Agent-to-agent collaboration
const riskAgent = await meridian.discover({
  capability: 'risk_analysis',
  chains: ['arbitrum'],
  maxPrice: { token: 'USDC', amount: 1 },
});

agent.on('beforeTrade', async (trade) => {
  const assessment = await riskAgent.requestTask({
    type: 'assess_trade',
    data: trade,
  });
  return assessment.approved;
});
```

### SDK Package Exports

```typescript
// @meridian/sdk — main entry point
export { Meridian }          from './core/meridian';
export { Agent }             from './core/agent';
export { Strategy }          from './strategy/strategy';

// @meridian/chains — chain connectors
export { EVMConnector }      from './chains/evm';
export { SolanaConnector }   from './chains/solana';

// @meridian/strategies — prebuilt strategies
export { DCAStrategy }       from './strategies/dca';
export { GridStrategy }      from './strategies/grid';
export { ArbitrageStrategy } from './strategies/arbitrage';
export { RebalanceStrategy } from './strategies/rebalance';

// @meridian/protocols — protocol adapters
export { UniswapV3Adapter }  from './protocols/uniswap-v3';
export { AaveV3Adapter }     from './protocols/aave-v3';
export { JupiterAdapter }    from './protocols/jupiter';

// @meridian/risk — risk management
export { RiskManager }       from './risk/manager';
export { CircuitBreaker }    from './risk/circuit-breaker';

// @meridian/types — shared type definitions
export * from './types';
```

---

## Framework Decision: Custom (not LangChain/CrewAI)

### Why build custom instead of forking LangChain or CrewAI?

| Criterion | LangChain | CrewAI | Meridian Custom |
|---|---|---|---|
| **DeFi-native primitives** | None — general purpose | None — general purpose | Swap, LP, borrow, bridge as first-class actions |
| **Transaction lifecycle** | Not designed for blockchain tx | No tx management | Built-in nonce, gas, simulation, MEV protection |
| **Real-time tick loop** | Chains are request/response | Task-based, not continuous | Tick-based event loop designed for continuous monitoring |
| **Multi-chain state** | No concept of chain state | No blockchain awareness | Unified cross-chain position and balance tracking |
| **Risk management** | No financial risk primitives | No risk layer | Circuit breakers, position limits, drawdown guards |
| **Agent payments** | No payment protocol | No payment protocol | On-chain escrow, streaming payments, reputation |
| **Performance** | Python, high overhead | Python, high overhead | TypeScript runtime, Python only for ML |
| **Bundle size** | Massive dependency tree | Large dependency tree | Minimal, DeFi-focused dependencies |

### What we borrow from each:
- **From LangChain:** Prompt template system, tool/function calling abstraction, RAG patterns
- **From CrewAI:** Role-based agent design, task delegation patterns, agent collaboration model
- **From AutoGPT/BabyAGI:** Recursive task decomposition, memory-augmented reasoning loops
- **Novel to Meridian:** DeFi-native action space, on-chain agent registry, cross-chain state management, financial risk primitives, agent payment protocol

---

## Monorepo Folder Structure

```
meridian/
├── README.md
├── package.json                        # workspace root (pnpm)
├── pnpm-workspace.yaml
├── turbo.json                          # turborepo build config
├── .env.example
├── docker-compose.yml                  # Redis, Postgres, Qdrant, monitoring
│
├── packages/
│   ├── sdk/                            # @meridian/sdk — main developer SDK
│   │   ├── src/
│   │   │   ├── core/
│   │   │   │   ├── meridian.ts         # framework entry point
│   │   │   │   ├── agent.ts            # Agent class
│   │   │   │   └── runtime.ts          # event loop, state machine
│   │   │   ├── strategy/
│   │   │   │   ├── builder.ts          # strategy builder API
│   │   │   │   ├── dsl-parser.ts       # Meridian DSL parser (peggy)
│   │   │   │   ├── nl-translator.ts    # natural language → strategy
│   │   │   │   ├── compiler.ts         # AST → executable
│   │   │   │   └── backtest.ts         # backtesting engine
│   │   │   ├── llm/
│   │   │   │   ├── gateway.ts          # unified LLM gateway
│   │   │   │   ├── providers/
│   │   │   │   │   ├── claude.ts
│   │   │   │   │   ├── openai.ts
│   │   │   │   │   └── ollama.ts
│   │   │   │   ├── prompts/            # handlebars templates
│   │   │   │   │   ├── market-analysis.hbs
│   │   │   │   │   ├── trade-decision.hbs
│   │   │   │   │   └── risk-assessment.hbs
│   │   │   │   └── structured-output.ts
│   │   │   ├── chains/
│   │   │   │   ├── connector.ts        # unified DeFi interface
│   │   │   │   ├── evm/
│   │   │   │   │   ├── provider.ts     # viem client wrapper
│   │   │   │   │   ├── gas.ts          # gas estimation + optimization
│   │   │   │   │   ├── nonce.ts        # nonce manager
│   │   │   │   │   └── mev.ts          # MEV protection
│   │   │   │   ├── solana/
│   │   │   │   │   ├── provider.ts
│   │   │   │   │   └── priority-fees.ts
│   │   │   │   └── protocols/          # protocol adapters (plugin system)
│   │   │   │       ├── base-adapter.ts
│   │   │   │       ├── uniswap-v3.ts
│   │   │   │       ├── aave-v3.ts
│   │   │   │       ├── curve.ts
│   │   │   │       ├── jupiter.ts
│   │   │   │       └── index.ts
│   │   │   ├── memory/
│   │   │   │   ├── manager.ts          # memory orchestrator
│   │   │   │   ├── working.ts          # Redis working memory
│   │   │   │   ├── episodic.ts         # Postgres episodic store
│   │   │   │   ├── semantic.ts         # Qdrant vector store
│   │   │   │   └── rag.ts             # RAG pipeline
│   │   │   ├── communication/
│   │   │   │   ├── discovery.ts        # agent discovery (DHT + registry)
│   │   │   │   ├── messaging.ts        # libp2p messaging
│   │   │   │   ├── negotiation.ts      # task negotiation protocol
│   │   │   │   └── payments.ts         # escrow management
│   │   │   ├── risk/
│   │   │   │   ├── manager.ts          # risk management orchestrator
│   │   │   │   ├── preflight.ts        # pre-flight validator
│   │   │   │   ├── circuit-breaker.ts
│   │   │   │   ├── position-monitor.ts
│   │   │   │   └── gas-monitor.ts
│   │   │   └── types/
│   │   │       ├── agent.ts
│   │   │       ├── chain.ts
│   │   │       ├── strategy.ts
│   │   │       ├── risk.ts
│   │   │       └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── contracts/                      # @meridian/contracts — Solidity
│   │   ├── src/
│   │   │   ├── AgentRegistry.sol
│   │   │   ├── PaymentEscrow.sol
│   │   │   ├── StrategyVault.sol
│   │   │   ├── MeridianGovernance.sol
│   │   │   └── interfaces/
│   │   │       ├── IAgentRegistry.sol
│   │   │       ├── IPaymentEscrow.sol
│   │   │       └── IStrategyVault.sol
│   │   ├── test/
│   │   ├── script/                     # deployment scripts
│   │   ├── foundry.toml
│   │   └── package.json
│   │
│   ├── dashboard/                      # @meridian/dashboard — React frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   │   ├── agents/             # agent overview, controls
│   │   │   │   ├── portfolio/          # P&L charts, positions
│   │   │   │   ├── transactions/       # tx explorer
│   │   │   │   ├── risk/               # risk dashboard
│   │   │   │   ├── strategy/           # strategy editor, backtest view
│   │   │   │   └── system/             # health, logs
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   │   ├── trpc.ts             # tRPC client
│   │   │   │   └── websocket.ts        # WS subscriptions
│   │   │   └── styles/
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   ├── server/                         # @meridian/server — API server
│   │   ├── src/
│   │   │   ├── trpc/                   # tRPC router definitions
│   │   │   ├── ws/                     # WebSocket handlers
│   │   │   ├── auth/                   # SIWE authentication
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── proto/                          # @meridian/proto — protobuf schemas
│   │   ├── agent_message.proto
│   │   ├── task.proto
│   │   └── signal.proto
│   │
│   └── ml/                             # @meridian/ml — Python ML components
│       ├── anomaly_detection/
│       │   ├── model.py                # Isolation Forest / River
│       │   └── server.py               # gRPC server
│       ├── embeddings/
│       │   └── server.py               # embedding generation service
│       ├── pyproject.toml
│       └── Dockerfile
│
├── apps/
│   ├── agent-node/                     # standalone agent runner
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   └── cli/                            # @meridian/cli — developer CLI
│       ├── src/
│       │   ├── commands/
│       │   │   ├── init.ts             # scaffold new project
│       │   │   ├── deploy.ts           # deploy agent
│       │   │   ├── backtest.ts         # run backtest
│       │   │   ├── monitor.ts          # tail agent logs
│       │   │   └── registry.ts         # interact with on-chain registry
│       │   └── index.ts
│       └── package.json
│
├── examples/
│   ├── dca-bot/                        # Dollar-cost averaging example
│   ├── arbitrage-scanner/              # Cross-DEX arbitrage
│   ├── yield-optimizer/                # Auto-compound yields
│   ├── multi-agent-portfolio/          # Collaborative portfolio management
│   └── liquidation-protector/          # Monitor & protect lending positions
│
├── docs/
│   ├── architecture.md                 # this document
│   ├── getting-started.md
│   ├── strategy-dsl.md
│   ├── protocol-adapters.md
│   ├── agent-communication.md
│   ├── risk-management.md
│   ├── smart-contracts.md
│   └── api-reference/
│
└── infra/
    ├── docker/
    │   ├── Dockerfile.agent
    │   ├── Dockerfile.dashboard
    │   └── Dockerfile.ml
    ├── k8s/                            # Kubernetes manifests
    ├── terraform/                      # infrastructure as code
    └── monitoring/
        ├── prometheus.yml
        ├── grafana/
        └── alertmanager.yml
```

---

## Technology Summary

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime** | TypeScript, Node.js 20+, pnpm workspaces, Turborepo | Agent execution, monorepo management |
| **State Machine** | xstate v5 | Agent lifecycle state management |
| **Job Queue** | BullMQ + Redis | Tick scheduling, retries, rate limiting |
| **LLM - Cloud** | @anthropic-ai/sdk, openai | Claude and GPT-4 integration |
| **LLM - Local** | ollama-js | Llama 3.1, Mistral local inference |
| **Prompt Mgmt** | Handlebars, Zod | Template rendering, structured output validation |
| **EVM** | viem, ethers v6 | Blockchain interaction |
| **Solana** | @solana/web3.js, @coral-xyz/anchor | Solana interaction |
| **Contracts** | Solidity, Foundry | On-chain contracts, testing |
| **Working Memory** | Redis 7+ (RedisJSON) | Hot state, circuit breakers, pub/sub |
| **Episodic Memory** | PostgreSQL 16 + TimescaleDB, drizzle-orm | Transaction history, P&L, time-series |
| **Semantic Memory** | Qdrant, @xenova/transformers | Vector similarity search, RAG |
| **P2P Network** | libp2p, protobuf-ts | Agent discovery, messaging |
| **ML/Anomaly** | Python, scikit-learn, river | Anomaly detection sidecar (gRPC) |
| **Dashboard** | React 18, TanStack Query, Recharts, Tailwind v4 | Monitoring frontend |
| **API** | tRPC, WebSocket | Type-safe API, real-time streaming |
| **Auth** | SIWE (Sign-In with Ethereum) | Wallet-based authentication |
| **Infra** | Docker, Kubernetes, Terraform | Deployment, scaling |
| **Monitoring** | Prometheus, Grafana, pino | Observability |
| **DSL Parser** | peggy | Custom strategy language |
| **MEV Protection** | Flashbots, MEV Blocker | Transaction privacy |
| **Simulation** | Tenderly SDK | Pre-execution tx simulation |
| **Testing** | Vitest, Foundry Test, Playwright | Unit, contract, E2E testing |

---

*Meridian — Precision routing across chains and markets.*

*Built for DeFi developers who demand autonomous, safe, and composable AI agents.*
