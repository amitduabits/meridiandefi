// ---------------------------------------------------------------------------
// StrategyBuilder — validates and constructs IStrategy objects from code
// definitions.
// ---------------------------------------------------------------------------

import type { IStrategy, Trigger, Action } from "../types/strategy.js";
import { TriggerType, ActionType, StrategyConstraintsSchema } from "../types/strategy.js";
import { StrategyError } from "../core/errors.js";
import { createLogger } from "../core/logger.js";

const log = createLogger({ module: "StrategyBuilder" });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_TRIGGER_TYPES: ReadonlySet<string> = new Set(Object.values(TriggerType));
const VALID_ACTION_TYPES: ReadonlySet<string> = new Set(Object.values(ActionType));

/** Semver-ish pattern (loose). */
const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[\w.]+)?$/;

// ---------------------------------------------------------------------------
// Validation result
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ---------------------------------------------------------------------------
// StrategyBuilder
// ---------------------------------------------------------------------------

export class StrategyBuilder {
  /**
   * Convert a plain strategy definition object into a validated IStrategy.
   *
   * Throws a `StrategyError` if the definition is structurally invalid
   * (missing required fields).
   */
  fromCode(strategyDef: Record<string, unknown>): IStrategy {
    // ---- required scalars ---------------------------------------------------
    const id = this.requireString(strategyDef, "id");
    const name = this.requireString(strategyDef, "name");
    const version = this.requireString(strategyDef, "version");
    const description = this.requireString(strategyDef, "description");

    // ---- triggers -----------------------------------------------------------
    if (!Array.isArray(strategyDef["triggers"])) {
      throw new StrategyError("'triggers' must be an array", {
        code: "STRATEGY_INVALID",
      });
    }
    const triggers = (strategyDef["triggers"] as unknown[]).map(
      (t, i) => this.parseTrigger(t, i),
    );

    // ---- actions ------------------------------------------------------------
    if (!Array.isArray(strategyDef["actions"])) {
      throw new StrategyError("'actions' must be an array", {
        code: "STRATEGY_INVALID",
      });
    }
    const actions = (strategyDef["actions"] as unknown[]).map(
      (a, i) => this.parseAction(a, i),
    );

    // ---- constraints --------------------------------------------------------
    const rawConstraints = strategyDef["constraints"] ?? {};
    const constraintsParsed = StrategyConstraintsSchema.safeParse(rawConstraints);
    if (!constraintsParsed.success) {
      const issues = constraintsParsed.error.issues
        .map((iss) => `${iss.path.join(".")}: ${iss.message}`)
        .join("; ");
      throw new StrategyError(`Invalid constraints: ${issues}`, {
        code: "STRATEGY_INVALID",
      });
    }

    // ---- params -------------------------------------------------------------
    const params = (strategyDef["params"] as Record<string, unknown>) ?? {};

    const strategy: IStrategy = {
      id,
      name,
      version,
      description,
      triggers,
      actions,
      constraints: constraintsParsed.data,
      params,
    };

    log.info({ strategyId: id }, "Strategy built from code definition");
    return strategy;
  }

  /**
   * Validate an existing IStrategy, returning all problems found.
   *
   * Never throws — all problems are collected in `errors`.
   */
  validate(strategy: IStrategy): ValidationResult {
    const errors: string[] = [];

    // ---- scalars ------------------------------------------------------------
    if (!strategy.id || typeof strategy.id !== "string") {
      errors.push("'id' is required and must be a non-empty string");
    }
    if (!strategy.name || typeof strategy.name !== "string") {
      errors.push("'name' is required and must be a non-empty string");
    }
    if (!strategy.version || !SEMVER_RE.test(strategy.version)) {
      errors.push("'version' must follow semver (e.g. 1.0.0)");
    }
    if (!strategy.description || typeof strategy.description !== "string") {
      errors.push("'description' is required and must be a non-empty string");
    }

    // ---- triggers -----------------------------------------------------------
    if (!Array.isArray(strategy.triggers)) {
      errors.push("'triggers' must be an array");
    } else {
      if (strategy.triggers.length === 0) {
        errors.push("Strategy must have at least one trigger");
      }
      for (let i = 0; i < strategy.triggers.length; i++) {
        const t = strategy.triggers[i]!;
        if (!VALID_TRIGGER_TYPES.has(t.type)) {
          errors.push(
            `triggers[${i}]: unknown type '${t.type}'. Valid types: ${[...VALID_TRIGGER_TYPES].join(", ")}`,
          );
        }
        if (t.params == null || typeof t.params !== "object") {
          errors.push(`triggers[${i}]: 'params' must be an object`);
        }
      }
    }

    // ---- actions ------------------------------------------------------------
    if (!Array.isArray(strategy.actions)) {
      errors.push("'actions' must be an array");
    } else {
      if (strategy.actions.length === 0) {
        errors.push("Strategy must have at least one action");
      }
      for (let i = 0; i < strategy.actions.length; i++) {
        const a = strategy.actions[i]!;
        if (!VALID_ACTION_TYPES.has(a.type)) {
          errors.push(
            `actions[${i}]: unknown type '${a.type}'. Valid types: ${[...VALID_ACTION_TYPES].join(", ")}`,
          );
        }
        if (a.params == null || typeof a.params !== "object") {
          errors.push(`actions[${i}]: 'params' must be an object`);
        }
        if (typeof a.chainId !== "number" || a.chainId < 1) {
          errors.push(`actions[${i}]: 'chainId' must be a positive integer`);
        }
      }
    }

    // ---- constraints --------------------------------------------------------
    const cr = StrategyConstraintsSchema.safeParse(strategy.constraints);
    if (!cr.success) {
      for (const issue of cr.error.issues) {
        errors.push(`constraints.${issue.path.join(".")}: ${issue.message}`);
      }
    } else {
      // Reasonableness checks beyond schema validation.
      const c = cr.data;
      if (c.maxPositionPct < 1) {
        errors.push("constraints.maxPositionPct: unreasonably low (< 1%)");
      }
      if (c.stopLossPct < -50) {
        errors.push("constraints.stopLossPct: unreasonably wide (< -50%)");
      }
      if (c.maxDailyTrades > 1000) {
        errors.push("constraints.maxDailyTrades: unreasonably high (> 1000)");
      }
      if (c.maxSlippageBps > 500) {
        errors.push("constraints.maxSlippageBps: unreasonably high (> 500 bps / 5%)");
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // ---- private helpers ----------------------------------------------------

  private requireString(obj: Record<string, unknown>, key: string): string {
    const v = obj[key];
    if (typeof v !== "string" || v.length === 0) {
      throw new StrategyError(`'${key}' is required and must be a non-empty string`, {
        code: "STRATEGY_INVALID",
      });
    }
    return v;
  }

  private parseTrigger(raw: unknown, index: number): Trigger {
    if (raw == null || typeof raw !== "object") {
      throw new StrategyError(`triggers[${index}] must be an object`, {
        code: "STRATEGY_INVALID",
      });
    }
    const r = raw as Record<string, unknown>;
    const type = r["type"];
    if (typeof type !== "string" || !VALID_TRIGGER_TYPES.has(type)) {
      throw new StrategyError(
        `triggers[${index}]: invalid type '${String(type)}'. Valid types: ${[...VALID_TRIGGER_TYPES].join(", ")}`,
        { code: "STRATEGY_INVALID" },
      );
    }
    return {
      type: type as TriggerType,
      params: (r["params"] as Record<string, unknown>) ?? {},
      ...(typeof r["description"] === "string" ? { description: r["description"] } : {}),
    };
  }

  private parseAction(raw: unknown, index: number): Action {
    if (raw == null || typeof raw !== "object") {
      throw new StrategyError(`actions[${index}] must be an object`, {
        code: "STRATEGY_INVALID",
      });
    }
    const r = raw as Record<string, unknown>;
    const type = r["type"];
    if (typeof type !== "string" || !VALID_ACTION_TYPES.has(type)) {
      throw new StrategyError(
        `actions[${index}]: invalid type '${String(type)}'. Valid types: ${[...VALID_ACTION_TYPES].join(", ")}`,
        { code: "STRATEGY_INVALID" },
      );
    }
    const chainId = r["chainId"];
    if (typeof chainId !== "number" || chainId < 1) {
      throw new StrategyError(
        `actions[${index}]: 'chainId' must be a positive number`,
        { code: "STRATEGY_INVALID" },
      );
    }
    return {
      type: type as ActionType,
      params: (r["params"] as Record<string, unknown>) ?? {},
      chainId,
      ...(typeof r["protocol"] === "string" ? { protocol: r["protocol"] } : {}),
    };
  }
}
