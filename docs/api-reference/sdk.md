# SDK API Reference

Complete API reference for `@meridian/sdk`. All exports are named (no default exports). Import from the package root:

```typescript
import { Agent, EventBus, RiskManager, /* ... */ } from "@meridian/sdk";
```

## Core

### Agent

The autonomous unit that executes the Sense-Think-Act-Reflect decision cycle.

```typescript
class Agent implements IAgent {
  readonly id: string;
  readonly config: AgentConfig;
  get state(): AgentState;
  get cycles(): number;

  constructor(rawConfig: unknown, deps: AgentDeps);

  setStrategy(strategy: IStrategy): void;
  start(): Promise<void>;
  pause(): void;
  resume(): void;
  kill(): Promise<void>;

  sense(): Promise<void>;
  think(): Promise<void>;
  act(): Promise<void>;
  reflect(): Promise<void>;

  getSnapshot(): AgentMachineSnapshot;
}
```

**Constructor parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `rawConfig` | `unknown` | Parsed via `AgentConfigSchema` (Zod) |
| `deps` | `AgentDeps` | Injected providers |

### AgentDeps

```typescript
interface AgentDeps {
  eventBus: EventBus;
  sense: ISenseProvider;
  think: IThinkProvider;
  act: IActProvider;
  memory: IMemoryProvider;
}
```

### Provider Interfaces

```typescript
interface ISenseProvider {
  gather(agentId: string, chainIds: number[]): Promise<MarketSnapshot>;
}

interface IThinkProvider {
  reason(request: LLMRequest): Promise<LLMResponse>;
}

interface IActProvider {
  execute(
    action: string,
    params: Record<string, unknown>,
    chainId: number,
    dryRun: boolean,
  ): Promise<TxResult | null>;
}

interface IMemoryProvider {
  store(record: DecisionRecord): Promise<void>;
  getRecent(agentId: string, limit: number): Promise<DecisionRecord[]>;
}
```

### AgentConfig

Validated by `AgentConfigSchema`:

```typescript
interface AgentConfig {
  id?: string;                    // Auto-generated UUID if omitted
  name: string;                   // Human-readable name
  capabilities: AgentCapability[];// At least one required
  chains: number[];               // Chain IDs to operate on
  tickIntervalMs: number;         // Default: 5000
  maxCycles: number;              // Default: 0 (unlimited)
  dryRun: boolean;                // Default: false
  cooldownMs: number;             // Default: 10000
}
```

### AgentState

```typescript
const AgentState = {
  IDLE: "IDLE",
  SENSING: "SENSING",
  THINKING: "THINKING",
  ACTING: "ACTING",
  REFLECTING: "REFLECTING",
  ERROR: "ERROR",
  COOLDOWN: "COOLDOWN",
  PAUSED: "PAUSED",
} as const;
```

### AgentCapability

```typescript
const AgentCapability = {
  SWAP: "SWAP",
  PROVIDE_LIQUIDITY: "PROVIDE_LIQUIDITY",
  LEND_BORROW: "LEND_BORROW",
  STAKE: "STAKE",
  BRIDGE: "BRIDGE",
  ARBITRAGE: "ARBITRAGE",
  MARKET_ANALYSIS: "MARKET_ANALYSIS",
  RISK_ASSESSMENT: "RISK_ASSESSMENT",
  PORTFOLIO_MANAGEMENT: "PORTFOLIO_MANAGEMENT",
} as const;
```

### EventBus

Typed event emitter for cross-component communication.

```typescript
class EventBus {
  emit<K extends MeridianEventName>(event: K, payload: MeridianEventMap[K]): void;
  on<K extends MeridianEventName>(event: K, handler: (payload: MeridianEventMap[K]) => void): void;
  off<K extends MeridianEventName>(event: K, handler: (payload: MeridianEventMap[K]) => void): void;
}
```

### Errors

All errors extend `MeridianError`:

```typescript
class MeridianError extends Error {
  readonly code: string;
  readonly recoverable: boolean;
  readonly context?: Record<string, unknown>;
}

class AgentError extends MeridianError {}
class ChainError extends MeridianError {}
class LLMError extends MeridianError {}
class RiskError extends MeridianError {}
class StrategyError extends MeridianError {}
```

### PluginRegistry

```typescript
class PluginRegistry {
  register(plugin: IPlugin): void;
  get(name: string): IPlugin | undefined;
}

interface IPlugin {
  name: string;
  version: string;
  init(ctx: PluginContext): Promise<void>;
  destroy(): Promise<void>;
}
```

## LLM

### LLMGateway

Unified gateway with fallback, caching, and rate limiting.

```typescript
class LLMGateway {
  constructor(opts?: Partial<GatewayOpts>);
  registerProvider(provider: BaseProvider): void;
  setFallbackChain(chain: string[]): void;
  complete(request: LLMRequest): Promise<LLMResponse>;
  get totalRequests(): number;
  get cacheSize(): number;
}
```

### GatewayOpts

```typescript
interface GatewayOpts {
  primary: string;              // Primary provider ID
  fallbackChain: string[];      // Provider IDs in priority order
  timeoutMs: number;            // Timeout per request
  cacheTtlMs: number;           // LRU cache TTL (0 = disabled)
  maxRequestsPerMinute: number; // Rate limit
}
```

### LLMRequest / LLMResponse

```typescript
interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseSchema?: unknown;
  metadata?: Record<string, unknown>;
}

interface LLMResponse {
  content: string;
  model: string;
  provider: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  latencyMs: number;
  parsed?: unknown;
  cached: boolean;
}
```

### Providers

```typescript
class ClaudeProvider extends BaseProvider {
  readonly providerId: "claude";
  constructor(config: ClaudeProviderConfig);
}

class OpenAIProvider extends BaseProvider {
  readonly providerId: "openai";
  constructor(config: { apiKey: string; model?: string });
}

class OllamaProvider extends BaseProvider {
  readonly providerId: "ollama";
  constructor(config: { baseUrl?: string; model?: string });
}
```

**ClaudeProviderConfig:**

```typescript
interface ClaudeProviderConfig {
  apiKey: string;
  model?: string;           // Default: "claude-sonnet-4-20250514"
  maxRetries?: number;
  timeoutMs?: number;
}
```

### Structured Output Schemas

Pre-built Zod schemas for parsing LLM responses:

```typescript
const MarketAnalysisSchema: z.ZodType<MarketAnalysis>;
const TradeDecisionSchema: z.ZodType<TradeDecision>;
const RiskAssessmentSchema: z.ZodType<RiskAssessment>;
const ReflectionSchema: z.ZodType<Reflection>;
const StrategySchema: z.ZodType;

function parseStructuredOutput<T>(content: string, schema: z.ZodType<T>): T;
```

### Prompt Management

```typescript
function renderPrompt(templateName: string, context: Record<string, unknown>): string;
function listTemplates(): string[];
function registerTemplate(name: string, source: string): void;
```

### CostTracker

```typescript
class CostTracker {
  record(response: LLMResponse): void;
  getTotalCost(): number;
  getCostByProvider(): Record<string, number>;
}
```

## Risk

### RiskManager

```typescript
class RiskManager implements IRiskManager {
  constructor(config: RiskManagerConfig);

  validateAction(action: string, params: ActionParams, portfolio: PortfolioSnapshot): RiskDecision;
  checkCircuitBreakers(): boolean;
  getPortfolioRisk(equityCurve: readonly number[], positionWeights: readonly number[]): PortfolioRiskStats;
  setLimits(limits: RiskLimits): void;

  tripBreaker(type: BreakerType, error: string): void;
  resetBreaker(type: BreakerType): void;
  recordProbeSuccess(type: BreakerType): boolean;
  checkBreaker(type: BreakerType): CircuitBreakerStatus;
  getLimits(): Readonly<RiskLimits>;
}
```

### PreFlightValidator

```typescript
class PreFlightValidator {
  constructor(limits: RiskLimits, logger?: Logger);
  validate(action: ActionParams, portfolio: PortfolioSnapshot): RiskDecision;
}
```

### CircuitBreakerManager

```typescript
class CircuitBreakerManager {
  constructor(opts?: { store?: ICircuitBreakerStore; config?: CircuitBreakerManagerConfig; logger?: Logger; clock?: () => number });
  trip(type: BreakerType, error: string): void;
  reset(type: BreakerType): void;
  recordProbeSuccess(type: BreakerType): boolean;
  allClear(): boolean;
  checkBreaker(type: BreakerType): CircuitBreakerStatus;
  getState(type: BreakerType): CircuitBreakerState;
  getAllStates(): CircuitBreakerState[];
  getTrippedBreakers(): CircuitBreakerState[];
}
```

### Risk Types

```typescript
interface RiskLimits {
  maxPositionSizeUsd: number;
  maxPortfolioExposurePct: number;  // 0-100, default 100
  maxSlippageBps: number;           // 0-10000, default 100
  maxGasCostPct: number;            // 0-100, default 1
  maxDailyLossPct: number;          // 0-100, default 10
  maxDrawdownPct: number;           // 0-100, default 20
  maxOpenPositions: number;         // default 20
  maxDailyTrades: number;           // default 50
}

interface RiskDecision {
  allowed: boolean;
  riskScore: number;       // 0-100
  reason: string;
  warnings: string[];
  modifications?: Record<string, unknown>;
}

interface PortfolioRiskStats {
  drawdown: number;
  sharpeRatio: number;
  valueAtRisk95: number;
  concentration: number;
  riskScore: number;       // 0-100
}
```

### Portfolio Risk Functions

```typescript
function calculateDrawdown(equityCurve: readonly number[]): number;
function calculateSharpeRatio(returns: readonly number[]): number;
function calculateSortinoRatio(returns: readonly number[]): number;
function calculateVaR(returns: readonly number[], confidence: number): number;
function concentrationIndex(weights: readonly number[]): number;
```

## Strategy

### StrategyBuilder

```typescript
class StrategyBuilder {
  fromCode(strategyDef: Record<string, unknown>): IStrategy;
  validate(strategy: IStrategy): ValidationResult;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}
```

### Backtester

```typescript
class Backtester {
  constructor(strategy: IStrategy, historicalData: readonly OHLCVBar[]);
  run(): BacktestResult;
}

interface OHLCVBar {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface BacktestResult {
  totalReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  equityCurve: number[];
}
```

### Technical Indicators

All functions are pure and deterministic:

```typescript
function sma(data: readonly number[], period: number): number[];
function ema(data: readonly number[], period: number): number[];
function rsi(data: readonly number[], period: number): number[];
function macd(data: readonly number[], fastPeriod?: number, slowPeriod?: number, signalPeriod?: number): MACDResult;
function bollingerBands(data: readonly number[], period?: number, stdDev?: number): BollingerBandsResult;
function vwap(highs: readonly number[], lows: readonly number[], closes: readonly number[], volumes: readonly number[]): number[];
function zScore(data: readonly number[], period: number): number[];
```

### Strategy Types

```typescript
interface IStrategy {
  id: string;
  name: string;
  version: string;
  description: string;
  triggers: Trigger[];
  actions: Action[];
  constraints: StrategyConstraints;
  params: Record<string, unknown>;
}

interface Trigger {
  type: TriggerType;
  params: Record<string, unknown>;
  description?: string;
}

interface Action {
  type: ActionType;
  params: Record<string, unknown>;
  chainId: number;
  protocol?: string;
}
```

## Chains

### EVMProvider

```typescript
class EVMProvider {
  constructor(overrides?: Partial<Record<number, Partial<EVMChainConfig>>>);
  getChainConfig(chainId: number): EVMChainConfig;
  getSupportedChains(): number[];
  getPublicClient(chainId: number): PublicClient;
  getWalletClient(chainId: number): WalletClient;
  getBalance(address: string, chainId: number): Promise<bigint>;
  getBlock(chainId: number): Promise<{ number: bigint; timestamp: bigint; baseFeePerGas: bigint | null; hash: string | null }>;
  estimateGas(tx: { to: string; data?: string; value?: bigint; from?: string }, chainId: number): Promise<bigint>;
  sendTransaction(tx: { to: string; data?: string; value?: bigint; from: string; gas?: bigint; maxFeePerGas?: bigint; maxPriorityFeePerGas?: bigint; nonce?: number }, chainId: number): Promise<Hash>;
  waitForReceipt(hash: string, chainId: number, confirmations?: number): Promise<TransactionReceipt>;
}
```

### UniswapV3Adapter

```typescript
class UniswapV3Adapter implements IProtocolAdapter {
  readonly protocolId: "uniswap-v3";
  readonly supportedChains: readonly number[];      // [1, 42161, 8453, 10, 137]
  readonly supportedActions: readonly ProtocolAction[]; // ["swap", "addLiquidity"]

  encode(action: ProtocolAction, params: Record<string, unknown>): Promise<EncodedTransaction>;
  decode(logs: Array<{ address: string; topics: string[]; data: string }>): DecodedEvent[];
  quote(params: Record<string, unknown>): Promise<QuoteResult>;
}
```

### Chain Types

```typescript
const ChainId = {
  ETHEREUM: 1,
  ETHEREUM_SEPOLIA: 11155111,
  ARBITRUM_ONE: 42161,
  ARBITRUM_SEPOLIA: 421614,
  BASE: 8453,
  OPTIMISM: 10,
  POLYGON: 137,
  AVALANCHE: 43114,
  SOLANA_MAINNET: -1,
  SOLANA_DEVNET: -2,
} as const;

interface TokenId { symbol: string; address: string; chainId: number; decimals: number; }
interface PriceData { token: string; priceUsd: number; chainId: number; timestamp: number; source: string; }
interface Position { token: TokenId; balance: bigint; valueUsd: number; chainId: number; protocol?: string; positionType: "spot" | "lp" | "lent" | "borrowed" | "staked"; }
interface TxResult { hash: string; chainId: number; status: "pending" | "confirmed" | "failed"; blockNumber?: number; gasUsed?: bigint; effectiveGasPrice?: bigint; timestamp?: number; events?: DecodedEvent[]; }
interface SimulationResult { success: boolean; gasEstimate: bigint; returnData?: unknown; error?: string; }
```

## Memory

### RedisWorkingMemory

```typescript
class RedisWorkingMemory implements IWorkingMemory {
  constructor(redis: Redis, opts?: { defaultTtlMs?: number; logger?: pino.Logger });
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  setWithTTL<T>(key: string, value: T, ttlMs: number): Promise<void>;
  del(key: string): Promise<void>;
  getMarketSnapshot(agentId: string): Promise<MarketSnapshot | null>;
  setMarketSnapshot(agentId: string, snapshot: MarketSnapshot): Promise<void>;
  getActivePositions(agentId: string): Promise<Record<string, unknown>[]>;
  setActivePositions(agentId: string, positions: Record<string, unknown>[]): Promise<void>;
  keys(pattern: string): Promise<string[]>;
  flush(agentId: string): Promise<void>;
}
```

### PostgresEpisodicMemory

```typescript
class PostgresEpisodicMemory implements IEpisodicMemory {
  constructor(db: PostgresJsDatabase, logger?: pino.Logger);
  recordDecision(record: DecisionRecord): Promise<void>;
  recordTransaction(tx: TransactionRecord): Promise<void>;
  recordPerformance(snapshot: PerformanceRecord): Promise<void>;
  queryDecisions(opts: DecisionQuery): Promise<DecisionRecord[]>;
  getPerformance(agentId: string, from?: Date, to?: Date): Promise<PerformanceRecord[]>;
  getRecentDecisions(agentId: string, limit?: number): Promise<DecisionRecord[]>;
}
```

### QdrantSemanticMemory

```typescript
class QdrantSemanticMemory implements ISemanticMemory {
  constructor(opts: { url?: string; collectionName?: string; embedder?: IEmbedder; logger?: pino.Logger; client?: QdrantClient });
  ensureCollection(): Promise<void>;
  store(content: string, metadata: Record<string, unknown>): Promise<string>;
  search(query: string, topK?: number): Promise<SemanticSearchResult[]>;
  searchSimilarDecisions(context: string, topK?: number): Promise<SemanticSearchResult[]>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}
```

### RAGPipeline

```typescript
class RAGPipeline {
  constructor(opts: RAGPipelineOpts);
  query(input: string, topK?: number): Promise<RAGContext>;
}
```

### Memory Types

```typescript
interface DecisionRecord {
  id: string; agentId: string; timestamp: number; state: string;
  reasoning: string; action: string; params: Record<string, unknown>;
  outcome?: string; reward?: number; learnings?: string[];
  chainId: number; txHash?: string;
}

interface MarketSnapshot {
  timestamp: number; prices: Record<string, number>;
  balances: Record<string, string>; positions: Record<string, unknown>[];
  gasPerChain: Record<number, number>; blockNumbers: Record<number, number>;
}

interface TransactionRecord {
  agentId: string; chainId: number; txHash: string; action: string;
  params: Record<string, unknown>; gasUsed?: number; gasCostUsd?: number;
  success: boolean; error?: string;
}

interface PerformanceRecord {
  agentId: string; timestamp?: Date; portfolioValueUsd: number;
  pnlUsd: number; pnlPct: number; drawdownPct: number;
  positionCount: number; metadata?: Record<string, unknown>;
}

interface SemanticSearchResult {
  id: string; content: string; metadata: Record<string, unknown>; score: number;
}
```
