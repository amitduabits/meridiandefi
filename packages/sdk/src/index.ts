// ---------------------------------------------------------------------------
// @meridian/sdk — public API
// ---------------------------------------------------------------------------

// Types
export {
  AgentState,
  AgentCapability,
  AgentConfigSchema,
  type AgentConfig,
  type IAgent,
} from "./types/agent.js";

export {
  TriggerType,
  ActionType,
  StrategyConstraintsSchema,
  NLStrategyInputSchema,
  type Trigger,
  type Action,
  type StrategyConstraints,
  type IStrategy,
  type NLStrategyInput,
} from "./types/strategy.js";

export {
  ChainId,
  type TokenId,
  type PriceData,
  type Position,
  type SwapParams,
  type TxResult,
  type DecodedEvent,
  type SimulationResult,
} from "./types/chain.js";

export {
  RiskLimitsSchema,
  BreakerType,
  CircuitBreakerStatus,
  type RiskLimits,
  type RiskDecision,
  type CircuitBreakerState,
} from "./types/risk.js";

export type {
  DecisionRecord,
  AgentStateSnapshot,
  MarketSnapshot,
} from "./types/memory.js";

export type {
  LLMRequest,
  LLMResponse,
  LLMChunk,
  GatewayOpts,
} from "./types/llm.js";

// Core
export { Agent } from "./core/agent.js";
export type { ISenseProvider, IThinkProvider, IActProvider, IMemoryProvider, AgentDeps } from "./core/agent.js";
export { Runtime } from "./core/runtime.js";
export { Meridian } from "./core/meridian.js";
export { EventBus } from "./core/event-bus.js";
export type { MeridianEventMap, MeridianEventName } from "./core/event-bus.js";
export { agentMachine, createAgentActor, snapshotToState } from "./core/state-machine.js";
export { MeridianError, AgentError, ChainError, LLMError, RiskError, StrategyError } from "./core/errors.js";
export { createLogger } from "./core/logger.js";
export { PluginRegistry } from "./core/plugin.js";
export type { IPlugin, PluginContext } from "./core/plugin.js";

// LLM
export { LLMGateway } from "./llm/gateway.js";
export { BaseProvider } from "./llm/providers/base-provider.js";
export { ClaudeProvider } from "./llm/providers/claude-provider.js";
export { OpenAIProvider } from "./llm/providers/openai-provider.js";
export { OllamaProvider } from "./llm/providers/ollama-provider.js";
export {
  parseStructuredOutput,
  MarketAnalysisSchema,
  TradeDecisionSchema,
  RiskAssessmentSchema,
  ReflectionSchema,
  StrategySchema,
  type MarketAnalysis,
  type TradeDecision,
  type RiskAssessment,
  type Reflection,
} from "./llm/structured-output.js";
export { renderPrompt, listTemplates, registerTemplate } from "./llm/prompt-manager.js";
export { CostTracker } from "./llm/cost-tracker.js";

// Risk
export { PreFlightValidator } from "./risk/preflight.js";
export type { PortfolioSnapshot, ActionParams } from "./risk/preflight.js";
export { CircuitBreakerManager, InMemoryBreakerStore } from "./risk/circuit-breaker.js";
export type { ICircuitBreakerStore, BreakerConfig, CircuitBreakerManagerConfig } from "./risk/circuit-breaker.js";
export {
  calculateDrawdown,
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateVaR,
  concentrationIndex,
} from "./risk/portfolio-risk.js";
export { RiskManager } from "./risk/manager.js";
export type { IRiskManager, PortfolioRiskStats, RiskManagerConfig } from "./risk/manager.js";

// Strategy
export { sma, ema, rsi, macd, bollingerBands, vwap, zScore } from "./strategy/indicators.js";
export type { MACDResult, BollingerBandsResult } from "./strategy/indicators.js";
export { Backtester } from "./strategy/backtest.js";
export type { OHLCVBar, BacktestResult } from "./strategy/backtest.js";
export { StrategyBuilder } from "./strategy/builder.js";
export type { ValidationResult } from "./strategy/builder.js";
export { parseDsl, parseDslAsync } from "./strategy/dsl-parser.js";
export type { DslAst, DslRule, DslParam, DslExpression, DslConstraints } from "./strategy/dsl-parser.js";
export { compileDsl, validateStrategy } from "./strategy/compiler.js";
export type { CompileResult } from "./strategy/compiler.js";
export { NLTranslator } from "./strategy/nl-translator.js";
export type { NLTranslatorDeps } from "./strategy/nl-translator.js";
export { executeInSandbox } from "./strategy/sandbox.js";
export type { SandboxResult } from "./strategy/sandbox.js";
export { createRebalancerStrategy } from "./strategy/prebuilt/rebalancer.js";
export type { RebalancerOpts } from "./strategy/prebuilt/rebalancer.js";
export { createDCAStrategy } from "./strategy/prebuilt/dca.js";
export type { DCAOpts } from "./strategy/prebuilt/dca.js";
export { createYieldRotationStrategy } from "./strategy/prebuilt/yield-rotation.js";
export type { YieldRotationOpts } from "./strategy/prebuilt/yield-rotation.js";

// Chains
export { SUPPORTED_CHAINS, SUPPORTED_PROTOCOLS } from "./chains/registry.js";
export type { SupportedChainKey, SupportedProtocol } from "./chains/registry.js";
export type { IDeFiConnector, QuoteResult, LiquidityParams, BorrowParams, StakeParams, BridgeParams, RepayParams } from "./chains/connector.js";
export { EVMProvider } from "./chains/evm/provider.js";
export type { EVMChainConfig } from "./chains/evm/provider.js";
export { GasEstimator } from "./chains/evm/gas.js";
export type { OptimalFees, GasEstimateResult } from "./chains/evm/gas.js";
export { NonceManager } from "./chains/evm/nonce.js";
export type { IProtocolAdapter, ProtocolAction, EncodedTransaction } from "./chains/protocols/base-adapter.js";
export { UniswapV3Adapter } from "./chains/protocols/uniswap-v3.js";

// Memory
export { RedisWorkingMemory } from "./memory/working.js";
export type { IWorkingMemory } from "./memory/working.js";
export { PostgresEpisodicMemory } from "./memory/episodic.js";
export type { IEpisodicMemory, TransactionRecord, PerformanceRecord, DecisionQuery } from "./memory/episodic.js";
export { QdrantSemanticMemory, SimpleEmbedder, simpleEmbed } from "./memory/semantic.js";
export type { ISemanticMemory, IEmbedder, SemanticEntry, SemanticSearchResult } from "./memory/semantic.js";
export { RAGPipeline } from "./memory/rag.js";
export type { RAGContext, RAGSource, RAGPipelineOpts } from "./memory/rag.js";
export { PostgresCheckpointManager, createCheckpoint, restoreWorkingMemory } from "./memory/checkpoint.js";
export type { ICheckpointManager } from "./memory/checkpoint.js";
export { MemoryManager } from "./memory/manager.js";
export type { IMemoryManager, MemoryManagerConfig } from "./memory/manager.js";
export * as episodicSchema from "./memory/episodic-schema.js";

// Communication
export {
  P2PNode,
  CommunicationError,
  DiscoveryService,
  DiscoveryError,
  Messenger,
  MessengerError,
  NegotiationProtocol,
  NegotiationError,
  PaymentChannel,
  PaymentChannelError,
  type P2PNodeConfig,
  type IP2PNode,
  type AgentProfile,
  type MessageType,
  type AgentMessage,
  type NegotiationState,
  type TaskProposal,
  type NegotiationResult,
  type PaymentChannelConfig,
  type PaymentStatus,
} from "./communication/index.js";
