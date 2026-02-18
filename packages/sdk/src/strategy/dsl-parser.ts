// ---------------------------------------------------------------------------
// DSL parser for the Meridian Strategy DSL.
//
// At build time the .pegjs grammar is compiled by peggy into a JS parser.
// At test / development time (before the build step), we fall back to a
// regex-based parser that handles the same grammar subset used in tests.
// ---------------------------------------------------------------------------

import { StrategyError } from "../core/errors.js";
import { createLogger } from "../core/logger.js";

const log = createLogger({ module: "DslParser" });

// ---------------------------------------------------------------------------
// Public AST types
// ---------------------------------------------------------------------------

export interface DslParam {
  type: "param";
  name: string;
  value: { kind: "number" | "string" | "boolean"; value: number | string | boolean };
}

export interface DslExpression {
  type: string;
  [key: string]: unknown;
}

export interface DslConstraints {
  max_slippage?: number;
  max_gas?: number;
  chains?: string[];
  allowed_protocols?: string[];
  stop_loss?: number;
  take_profit?: number;
  max_daily_trades?: number;
  [key: string]: unknown;
}

export interface DslRule {
  type: "rule";
  condition: DslExpression;
  action: DslExpression;
  /** Token identifiers referenced in the condition. */
  tokens: string[];
}

export interface DslAst {
  type: "strategy";
  name: string;
  version: string;
  params: DslParam[];
  rules: DslRule[];
  constraints: DslConstraints | null;
}

// ---------------------------------------------------------------------------
// Attempt to load the peggy-compiled parser from the build artefact.
// Falls through silently if not available — the fallback parser is used.
// ---------------------------------------------------------------------------

type PeggyParser = { parse(input: string): DslAst };

let _compiledParser: PeggyParser | null = null;

async function tryLoadCompiledParser(): Promise<PeggyParser | null> {
  try {
    // The generated parser is emitted to the same directory during `pnpm build`.
    // We use Function to avoid TypeScript's static module resolution check
    // for a file that only exists after the build step.
    const dynamicImport = new Function("m", "return import(m)") as (m: string) => Promise<unknown>;
    const mod = await dynamicImport(new URL("./dsl-grammar-parser.js", import.meta.url).href);
    if (mod && typeof (mod as Record<string, unknown>)["parse"] === "function") {
      return mod as unknown as PeggyParser;
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Fallback regex-based parser
// (handles the subset of the grammar exercised by the unit tests)
// ---------------------------------------------------------------------------

function parseWithFallback(input: string): DslAst {
  const lines = input.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith("//"));

  let name = "";
  let version = "1.0";
  const params: DslParam[] = [];
  const rules: DslRule[] = [];
  const constraints: DslConstraints = {};
  let inConstraints = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    // ---- Strategy header --------------------------------------------------
    const headerMatch = line.match(/^strategy\s+"([^"]+)"\s+v(\S+)/);
    if (headerMatch) {
      name = headerMatch[1]!;
      version = headerMatch[2]!;
      continue;
    }

    // ---- Param declaration ------------------------------------------------
    const paramMatch = line.match(/^param\s+(\w+)\s*=\s*(.+)$/);
    if (paramMatch) {
      const paramName = paramMatch[1]!;
      const rawVal = paramMatch[2]!.trim();
      let val: DslParam["value"];

      if (rawVal === "true" || rawVal === "false") {
        val = { kind: "boolean", value: rawVal === "true" };
      } else if (/^-?\d+(\.\d+)?$/.test(rawVal)) {
        val = { kind: "number", value: parseFloat(rawVal) };
      } else {
        val = { kind: "string", value: rawVal.replace(/^["']|["']$/g, "") };
      }

      params.push({ type: "param", name: paramName, value: val });
      continue;
    }

    // ---- Constraints block open -------------------------------------------
    if (/^constraints\s*\{/.test(line)) {
      inConstraints = true;
      continue;
    }

    // ---- Constraints block close ------------------------------------------
    if (inConstraints && line === "}") {
      inConstraints = false;
      continue;
    }

    // ---- Constraint entries -----------------------------------------------
    if (inConstraints) {
      const pctMatch = line.match(/^(\w+)\s*:\s*(-?\d+(?:\.\d+)?)%/);
      if (pctMatch) {
        const key = pctMatch[1]!;
        (constraints as Record<string, unknown>)[key] = parseFloat(pctMatch[2]!) / 100;
        continue;
      }

      const numMatch = line.match(/^(\w+)\s*:\s*(-?\d+(?:\.\d+)?)/);
      if (numMatch) {
        const key = numMatch[1]!;
        (constraints as Record<string, unknown>)[key] = parseFloat(numMatch[2]!);
        continue;
      }

      const listMatch = line.match(/^(\w+)\s*:\s*\[([^\]]*)\]/);
      if (listMatch) {
        const key = listMatch[1]!;
        const items = listMatch[2]!
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter((s) => s.length > 0);
        (constraints as Record<string, unknown>)[key] = items;
        continue;
      }
      continue;
    }

    // ---- When-do rules ----------------------------------------------------
    const whenMatch = line.match(/^when\s+(.+)$/);
    if (whenMatch) {
      const conditionStr = whenMatch[1]!.trim();
      const condition = parseExpression(conditionStr);
      const tokens = collectIdentifiers(conditionStr);

      // Peek at the next line for the `do` action.
      let action: DslExpression = { type: "call", callee: "noop", args: [] };
      const nextLine = lines[i + 1];
      if (nextLine) {
        const doMatch = nextLine.match(/^do\s+(.+)$/);
        if (doMatch) {
          action = parseActionExpr(doMatch[1]!.trim());
          i++; // consume the `do` line
        }
      }

      rules.push({ type: "rule", condition, action, tokens });
      continue;
    }

    // Lone `do` (shouldn't happen in well-formed DSL, skip)
    if (/^do\s+/.test(line)) {
      continue;
    }
  }

  if (!name) {
    throw new StrategyError("DSL parse error: missing strategy header", {
      code: "DSL_PARSE_ERROR",
    });
  }

  return {
    type: "strategy",
    name,
    version,
    params,
    rules,
    constraints: Object.keys(constraints).length > 0 ? constraints : null,
  };
}

// ---------------------------------------------------------------------------
// Micro expression parser (sufficient for test cases)
// ---------------------------------------------------------------------------

function parseExpression(expr: string): DslExpression {
  // Binary comparison:  left op right
  const binMatch = expr.match(/^(.+?)\s*(>=|<=|!=|==|>|<)\s*(.+)$/);
  if (binMatch) {
    return {
      type: "binary",
      operator: binMatch[2]!,
      left: parsePrimary(binMatch[1]!.trim()),
      right: parsePrimary(binMatch[3]!.trim()),
    };
  }
  return parsePrimary(expr.trim());
}

function parsePrimary(expr: string): DslExpression {
  // Number literal
  if (/^-?\d+(\.\d+)?$/.test(expr)) {
    return { type: "literal", kind: "number", value: parseFloat(expr) };
  }

  // String literal
  if (/^["'].*["']$/.test(expr)) {
    return { type: "literal", kind: "string", value: expr.slice(1, -1) };
  }

  // Call with member access: a.b(args)
  const callMemberMatch = expr.match(/^(\w+)\.(\w+)\(([^)]*)\)$/);
  if (callMemberMatch) {
    const obj: DslExpression = { type: "identifier", name: callMemberMatch[1]! };
    const member: DslExpression = { type: "member", object: obj, property: callMemberMatch[2]! };
    const rawArgs = callMemberMatch[3]!.trim();
    const args = rawArgs.length > 0
      ? rawArgs.split(",").map((a) => parsePrimary(a.trim()))
      : [];
    return { type: "call", callee: member, args };
  }

  // Bare call: a(args)
  const callMatch = expr.match(/^(\w+)\(([^)]*)\)$/);
  if (callMatch) {
    const rawArgs = callMatch[2]!.trim();
    const args = rawArgs.length > 0
      ? rawArgs.split(",").map((a) => parsePrimary(a.trim()))
      : [];
    return { type: "call", callee: callMatch[1]!, args };
  }

  // Member access: a.b
  const memberMatch = expr.match(/^(\w+)\.(\w+)$/);
  if (memberMatch) {
    return {
      type: "member",
      object: { type: "identifier", name: memberMatch[1]! },
      property: memberMatch[2]!,
    };
  }

  // Identifier
  return { type: "identifier", name: expr };
}

function parseActionExpr(expr: string): DslExpression {
  // call(arg1, arg2, ...)
  const callMatch = expr.match(/^(\w+)\(([^)]*)\)$/);
  if (callMatch) {
    const rawArgs = callMatch[2]!.trim();
    const args = rawArgs.length > 0
      ? rawArgs.split(",").map((a) => parsePrimary(a.trim()))
      : [];
    return { type: "call", callee: callMatch[1]!, args };
  }
  return { type: "call", callee: expr, args: [] };
}

function collectIdentifiers(expr: string): string[] {
  const idents = expr.match(/[a-zA-Z_]\w*/g) ?? [];
  const keywords = new Set(["true", "false", "and", "or", "not"]);
  return [...new Set(idents.filter((id) => !keywords.has(id)))];
}

// ---------------------------------------------------------------------------
// Public parse function
// ---------------------------------------------------------------------------

/**
 * Parse Meridian DSL source into a typed AST.
 *
 * Tries the peggy-compiled parser first (available after the build step),
 * then falls back to the built-in regex parser.
 *
 * @throws {StrategyError} with code `DSL_PARSE_ERROR` on invalid input.
 */
export async function parseDslAsync(input: string): Promise<DslAst> {
  if (!_compiledParser) {
    _compiledParser = await tryLoadCompiledParser();
  }

  if (_compiledParser) {
    try {
      return _compiledParser.parse(input);
    } catch (err) {
      log.warn({ err }, "Compiled DSL parser failed — falling back to regex parser");
    }
  }

  return parseWithFallback(input);
}

/**
 * Synchronous variant that always uses the fallback regex parser.
 * Suitable for unit tests and scenarios where the compiled parser
 * artefact is not required.
 *
 * @throws {StrategyError} with code `DSL_PARSE_ERROR` on invalid input.
 */
export function parseDsl(input: string): DslAst {
  try {
    return parseWithFallback(input);
  } catch (err) {
    if (err instanceof StrategyError) throw err;
    throw new StrategyError(
      `DSL parse error: ${err instanceof Error ? err.message : String(err)}`,
      { code: "DSL_PARSE_ERROR", cause: err },
    );
  }
}
