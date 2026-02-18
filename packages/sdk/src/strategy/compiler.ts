// ---------------------------------------------------------------------------
// DSL AST → IStrategy compiler.
//
// Converts a DslAst produced by the parser into a validated IStrategy.
// All errors are collected and returned rather than thrown, so callers can
// decide whether to proceed with partial results.
// ---------------------------------------------------------------------------

import type { DslAst, DslParam, DslRule } from "./dsl-parser.js";
import type { IStrategy, StrategyConstraints } from "../types/strategy.js";
import { TriggerType, ActionType, StrategyConstraintsSchema } from "../types/strategy.js";
import { createLogger } from "../core/logger.js";

const log = createLogger({ module: "DslCompiler" });

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface CompileResult {
  strategy: IStrategy;
  errors: string[];
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Helpers: minimal UUID without extra dependency
// ---------------------------------------------------------------------------

function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------
// Param resolution
// ---------------------------------------------------------------------------

function resolveParamValue(
  param: DslParam,
  errors: string[],
): number | string | boolean {
  const v = param.value;
  switch (v.kind) {
    case "number":
      if (typeof v.value !== "number" || isNaN(v.value)) {
        errors.push(`param '${param.name}': expected a number, got '${String(v.value)}'`);
        return 0;
      }
      return v.value;
    case "string":
      return String(v.value);
    case "boolean":
      return Boolean(v.value);
  }
}

// ---------------------------------------------------------------------------
// Trigger compilation
// ---------------------------------------------------------------------------

const VALID_TRIGGER_TYPES = new Set(Object.values(TriggerType));
const VALID_ACTION_TYPES = new Set(Object.values(ActionType));

function compileRule(
  rule: DslRule,
  index: number,
  params: Record<string, unknown>,
  errors: string[],
  warnings: string[],
): { trigger: IStrategy["triggers"][number]; action: IStrategy["actions"][number] } {
  // ---- Infer trigger type from condition expression -----------------------
  const condStr = conditionToString(rule.condition);
  const triggerType = inferTriggerType(condStr, rule.tokens);

  if (!VALID_TRIGGER_TYPES.has(triggerType)) {
    errors.push(`rule[${index}]: could not infer a valid trigger type from condition '${condStr}'`);
  }

  const triggerParams = buildTriggerParams(rule.condition, params);

  // ---- Infer action type from action expression ---------------------------
  const actionCallee = extractCallee(rule.action);
  const actionType = inferActionType(actionCallee);

  if (!VALID_ACTION_TYPES.has(actionType)) {
    warnings.push(`rule[${index}]: could not map action '${actionCallee}' to a known ActionType; defaulting to CUSTOM`);
  }

  const actionParams = buildActionParams(rule.action, params);

  return {
    trigger: {
      type: triggerType,
      params: triggerParams,
      description: `Compiled from: ${condStr}`,
    },
    action: {
      type: actionType,
      params: actionParams,
      chainId: 1, // Default; constraints.allowedChains overrides at runtime
    },
  };
}

/** Render a DslExpression as a human-readable string (for logging). */
function conditionToString(expr: Record<string, unknown>): string {
  if (!expr || typeof expr !== "object") return String(expr);
  const type = expr["type"] as string | undefined;

  switch (type) {
    case "binary": {
      const left = conditionToString(expr["left"] as Record<string, unknown>);
      const right = conditionToString(expr["right"] as Record<string, unknown>);
      return `${left} ${String(expr["operator"])} ${right}`;
    }
    case "call": {
      const callee =
        typeof expr["callee"] === "string"
          ? expr["callee"]
          : conditionToString(expr["callee"] as Record<string, unknown>);
      const args = (expr["args"] as unknown[]).map((a) =>
        conditionToString(a as Record<string, unknown>),
      );
      return `${callee}(${args.join(", ")})`;
    }
    case "member":
      return `${conditionToString(expr["object"] as Record<string, unknown>)}.${String(expr["property"])}`;
    case "identifier":
      return String(expr["name"]);
    case "literal":
      return String(expr["value"]);
    default:
      return JSON.stringify(expr);
  }
}

function extractCallee(action: Record<string, unknown>): string {
  if (action["type"] === "call") {
    const c = action["callee"];
    if (typeof c === "string") return c;
    if (c && typeof c === "object") return conditionToString(c as Record<string, unknown>);
  }
  return String(action["type"] ?? "unknown");
}

function inferTriggerType(condStr: string, tokens: string[]): typeof TriggerType[keyof typeof TriggerType] {
  const lower = condStr.toLowerCase();

  if (lower.includes("portfolio.drift") || tokens.some((t) => t.toLowerCase().includes("drift"))) {
    return TriggerType.PORTFOLIO_DRIFT;
  }
  if (lower.includes("gas") || tokens.some((t) => t.toLowerCase() === "gas")) {
    return TriggerType.GAS_BELOW;
  }
  if (lower.includes("price") || lower.includes("above") || lower.includes("below")) {
    return lower.includes("below") ? TriggerType.PRICE_BELOW : TriggerType.PRICE_ABOVE;
  }
  if (lower.includes("rsi") || lower.includes("sma") || lower.includes("ema") || lower.includes("indicator")) {
    return TriggerType.INDICATOR;
  }
  if (lower.includes("interval") || lower.includes("time") || lower.includes("schedule")) {
    return TriggerType.TIME_INTERVAL;
  }
  if (lower.includes(">") || lower.includes("<") || lower.includes("pct") || lower.includes("change")) {
    return TriggerType.PRICE_CHANGE_PCT;
  }

  return TriggerType.CUSTOM;
}

function inferActionType(callee: string): typeof ActionType[keyof typeof ActionType] {
  const lower = callee.toLowerCase();

  if (lower.includes("rebalance")) return ActionType.REBALANCE;
  if (lower.includes("swap")) return ActionType.SWAP;
  if (lower.includes("stake")) return ActionType.STAKE;
  if (lower.includes("unstake")) return ActionType.UNSTAKE;
  if (lower.includes("borrow")) return ActionType.BORROW;
  if (lower.includes("repay")) return ActionType.REPAY;
  if (lower.includes("add_liquidity") || lower.includes("addliquidity")) return ActionType.ADD_LIQUIDITY;
  if (lower.includes("remove_liquidity") || lower.includes("removeliquidity")) return ActionType.REMOVE_LIQUIDITY;
  if (lower.includes("bridge")) return ActionType.BRIDGE;
  if (lower.includes("notify") || lower.includes("alert")) return ActionType.NOTIFY;

  return ActionType.CUSTOM;
}

function buildTriggerParams(
  condition: Record<string, unknown>,
  params: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (condition["type"] === "binary") {
    const right = condition["right"] as Record<string, unknown>;
    if (right["type"] === "literal") {
      result["threshold"] = right["value"];
    } else if (right["type"] === "identifier") {
      // Resolve named param
      const paramName = String(right["name"]);
      if (paramName in params) {
        result["threshold"] = params[paramName];
      }
    }
    result["operator"] = condition["operator"];
  }

  return result;
}

function buildActionParams(
  action: Record<string, unknown>,
  params: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (action["type"] === "call") {
    const args = action["args"] as unknown[];
    args.forEach((arg, i) => {
      const node = arg as Record<string, unknown>;
      if (node["type"] === "literal") {
        result[`arg${i}`] = node["value"];
      } else if (node["type"] === "identifier") {
        const name = String(node["name"]);
        result[`arg${i}`] = name in params ? params[name] : name;
      } else {
        result[`arg${i}`] = conditionToString(node);
      }
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Constraints compilation
// ---------------------------------------------------------------------------

function compileConstraints(
  raw: Record<string, unknown> | null,
  errors: string[],
  warnings: string[],
): StrategyConstraints {
  const base: Record<string, unknown> = {
    maxPositionPct: 25,
    stopLossPct: -5,
    maxDailyTrades: 10,
    maxSlippageBps: 50,
  };

  if (!raw) {
    return StrategyConstraintsSchema.parse(base);
  }

  // Map DSL constraint keys to IStrategy constraint keys.
  const mapped: Record<string, unknown> = { ...base };

  for (const [key, val] of Object.entries(raw)) {
    // DSL constraints may arrive as { kind, value } objects or as raw primitives.
    const resolved: unknown =
      val !== null &&
      typeof val === "object" &&
      "value" in (val as Record<string, unknown>)
        ? (val as { value: unknown }).value
        : val;

    switch (key) {
      case "max_slippage": {
        // Stored as a fraction (0–1); convert to bps.
        const pct = Number(resolved);
        if (!isNaN(pct)) {
          const bps = Math.round(pct * 10000);
          if (bps > 500) {
            errors.push(`constraints.max_slippage: ${(pct * 100).toFixed(2)}% exceeds max allowed 5% (500 bps)`);
          }
          mapped["maxSlippageBps"] = bps;
        }
        break;
      }
      case "max_gas":
        mapped["maxGasGwei"] = Number(resolved);
        if (Number(resolved) <= 0) {
          errors.push("constraints.max_gas must be a positive number");
        }
        break;
      case "stop_loss": {
        const sl = -Math.abs(Number(resolved) * 100);
        if (sl < -50) warnings.push("constraints.stop_loss: value wider than 50% — verify intent");
        mapped["stopLossPct"] = sl;
        break;
      }
      case "take_profit": {
        const tp = Math.abs(Number(resolved) * 100);
        mapped["takeProfitPct"] = tp;
        break;
      }
      case "max_daily_trades":
        if (Number(resolved) > 1000) {
          errors.push("constraints.max_daily_trades: value > 1000 is unreasonably high");
        }
        mapped["maxDailyTrades"] = Number(resolved);
        break;
      case "chains": {
        const chainNames = Array.isArray(resolved) ? resolved : [resolved];
        const CHAIN_IDS: Record<string, number> = {
          ethereum: 1, mainnet: 1, arbitrum: 42161,
          optimism: 10, base: 8453, polygon: 137,
        };
        const ids = chainNames
          .map((n) => CHAIN_IDS[String(n).toLowerCase()] ?? 0)
          .filter((id) => id > 0);
        if (ids.length > 0) mapped["allowedChains"] = ids;
        break;
      }
      case "allowed_protocols":
        mapped["allowedProtocols"] = Array.isArray(resolved)
          ? resolved.map(String)
          : [String(resolved)];
        break;
      default:
        warnings.push(`constraints: unknown key '${key}' ignored`);
    }
  }

  const result = StrategyConstraintsSchema.safeParse(mapped);
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push(`constraints.${issue.path.join(".")}: ${issue.message}`);
    }
    return StrategyConstraintsSchema.parse(base);
  }

  return result.data;
}

// ---------------------------------------------------------------------------
// compileDsl — main entry point
// ---------------------------------------------------------------------------

/**
 * Compile a `DslAst` into an `IStrategy`.
 *
 * All validation problems are collected into the `errors` array.
 * Callers should check `errors.length === 0` before using the strategy.
 */
export function compileDsl(ast: DslAst): CompileResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ---- Resolve params into a flat map ------------------------------------
  const resolvedParams: Record<string, unknown> = {};
  for (const param of ast.params) {
    resolvedParams[param.name] = resolveParamValue(param, errors);
  }

  // ---- Compile rules → triggers + actions ---------------------------------
  const triggers: IStrategy["triggers"] = [];
  const actions: IStrategy["actions"] = [];

  if (ast.rules.length === 0) {
    warnings.push("No when-do rules found — strategy has no triggers or actions");
    // Provide sensible defaults so compilation still produces a usable object.
    triggers.push({ type: TriggerType.TIME_INTERVAL, params: { bars: 10 } });
    actions.push({ type: ActionType.NOTIFY, params: { message: "no-op" }, chainId: 1 });
  } else {
    for (let i = 0; i < ast.rules.length; i++) {
      const { trigger, action } = compileRule(
        ast.rules[i]!,
        i,
        resolvedParams,
        errors,
        warnings,
      );
      triggers.push(trigger);
      actions.push(action);
    }
  }

  // ---- Compile constraints ------------------------------------------------
  const constraints = compileConstraints(
    ast.constraints as Record<string, unknown> | null,
    errors,
    warnings,
  );

  // ---- Assemble IStrategy -------------------------------------------------
  const strategy: IStrategy = {
    id: generateId(),
    name: ast.name,
    version: `${ast.version}.0`.split(".").slice(0, 3).join("."),
    description: `Compiled from DSL — strategy: ${ast.name}`,
    triggers,
    actions,
    constraints,
    params: resolvedParams,
  };

  if (errors.length > 0) {
    log.warn({ strategyName: ast.name, errors }, "DSL compiled with errors");
  } else {
    log.info({ strategyName: ast.name }, "DSL compiled successfully");
  }

  return { strategy, errors, warnings };
}

// ---------------------------------------------------------------------------
// validateStrategy — standalone validator for IStrategy objects
// ---------------------------------------------------------------------------

/**
 * Validate an `IStrategy` object, returning a list of problems.
 * Never throws — all issues are collected and returned.
 */
export function validateStrategy(strategy: IStrategy): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // ---- Scalar fields -------------------------------------------------------
  if (!strategy.id || typeof strategy.id !== "string" || strategy.id.trim().length === 0) {
    errors.push("'id' is required and must be a non-empty string");
  }
  if (!strategy.name || typeof strategy.name !== "string" || strategy.name.trim().length === 0) {
    errors.push("'name' is required and must be a non-empty string");
  }
  if (!strategy.version || !/^\d+\.\d+\.\d+/.test(strategy.version)) {
    errors.push("'version' must follow semver (e.g. 1.0.0)");
  }
  if (!strategy.description || typeof strategy.description !== "string" || strategy.description.trim().length === 0) {
    errors.push("'description' is required and must be a non-empty string");
  }

  // ---- Triggers -----------------------------------------------------------
  if (!Array.isArray(strategy.triggers) || strategy.triggers.length === 0) {
    errors.push("'triggers' must be a non-empty array");
  } else {
    const validTriggerTypes = new Set(Object.values(TriggerType));
    for (let i = 0; i < strategy.triggers.length; i++) {
      const t = strategy.triggers[i]!;
      if (!validTriggerTypes.has(t.type)) {
        errors.push(`triggers[${i}]: unknown type '${t.type}'`);
      }
      if (t.params == null || typeof t.params !== "object") {
        errors.push(`triggers[${i}]: 'params' must be an object`);
      }
    }
  }

  // ---- Actions ------------------------------------------------------------
  if (!Array.isArray(strategy.actions) || strategy.actions.length === 0) {
    errors.push("'actions' must be a non-empty array");
  } else {
    const validActionTypes = new Set(Object.values(ActionType));
    for (let i = 0; i < strategy.actions.length; i++) {
      const a = strategy.actions[i]!;
      if (!validActionTypes.has(a.type)) {
        errors.push(`actions[${i}]: unknown type '${a.type}'`);
      }
      if (a.params == null || typeof a.params !== "object") {
        errors.push(`actions[${i}]: 'params' must be an object`);
      }
      if (typeof a.chainId !== "number" || a.chainId < 1) {
        errors.push(`actions[${i}]: 'chainId' must be a positive integer`);
      }
    }
  }

  // ---- Constraints --------------------------------------------------------
  const constraintsResult = StrategyConstraintsSchema.safeParse(strategy.constraints);
  if (!constraintsResult.success) {
    for (const issue of constraintsResult.error.issues) {
      errors.push(`constraints.${issue.path.join(".")}: ${issue.message}`);
    }
  } else {
    const c = constraintsResult.data;
    if (c.maxSlippageBps > 500) {
      errors.push("constraints.maxSlippageBps: value > 500 bps (5%) exceeds safe limit");
    }
    if (c.maxPositionPct > 100) {
      errors.push("constraints.maxPositionPct: value > 100 is invalid");
    }
    if (c.maxDailyTrades > 1000) {
      errors.push("constraints.maxDailyTrades: value > 1000 is unreasonably high");
    }
  }

  return { valid: errors.length === 0, errors };
}
