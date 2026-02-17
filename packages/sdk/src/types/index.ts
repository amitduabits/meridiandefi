// @meridian/sdk — type barrel export

export {
  AgentState,
  AgentCapability,
  AgentConfigSchema,
  type AgentConfig,
  type IAgent,
} from "./agent.js";

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
} from "./strategy.js";

export {
  ChainId,
  type TokenId,
  type PriceData,
  type Position,
  type SwapParams,
  type TxResult,
  type DecodedEvent,
  type SimulationResult,
} from "./chain.js";

export {
  RiskLimitsSchema,
  BreakerType,
  CircuitBreakerStatus,
  type RiskLimits,
  type RiskDecision,
  type CircuitBreakerState,
} from "./risk.js";

export type {
  DecisionRecord,
  AgentStateSnapshot,
  MarketSnapshot,
} from "./memory.js";

export type {
  LLMRequest,
  LLMResponse,
  LLMChunk,
  GatewayOpts,
} from "./llm.js";
