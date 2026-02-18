// ---------------------------------------------------------------------------
// Strategy module barrel export
// ---------------------------------------------------------------------------

// Indicators
export { sma, ema, rsi, macd, bollingerBands, vwap, zScore } from "./indicators.js";
export type { MACDResult, BollingerBandsResult } from "./indicators.js";

// Backtester
export { Backtester } from "./backtest.js";
export type { OHLCVBar, BacktestResult } from "./backtest.js";

// Strategy builder
export { StrategyBuilder } from "./builder.js";
export type { ValidationResult } from "./builder.js";

// DSL parser
export { parseDsl, parseDslAsync } from "./dsl-parser.js";
export type { DslAst, DslRule, DslParam, DslExpression, DslConstraints } from "./dsl-parser.js";

// DSL compiler
export { compileDsl, validateStrategy } from "./compiler.js";
export type { CompileResult } from "./compiler.js";

// NL → Strategy translator
export { NLTranslator } from "./nl-translator.js";
export type { NLTranslatorDeps } from "./nl-translator.js";

// Sandbox
export { executeInSandbox } from "./sandbox.js";
export type { SandboxResult } from "./sandbox.js";

// Prebuilt strategies
export { createRebalancerStrategy } from "./prebuilt/rebalancer.js";
export type { RebalancerOpts } from "./prebuilt/rebalancer.js";

export { createDCAStrategy } from "./prebuilt/dca.js";
export type { DCAOpts } from "./prebuilt/dca.js";

export { createYieldRotationStrategy } from "./prebuilt/yield-rotation.js";
export type { YieldRotationOpts } from "./prebuilt/yield-rotation.js";
