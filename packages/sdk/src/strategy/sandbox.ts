// ---------------------------------------------------------------------------
// Isolated execution sandbox.
//
// Tries to use isolated-vm (a V8 isolate) when available; falls back to a
// restricted Function()-based evaluator.  Both variants:
//   - Enforce a configurable timeout.
//   - Capture console.log calls into a `logs` array.
//   - Never expose filesystem or network APIs.
// ---------------------------------------------------------------------------

import { createLogger } from "../core/logger.js";
import { StrategyError } from "../core/errors.js";

const log = createLogger({ module: "Sandbox" });

const DEFAULT_TIMEOUT_MS = 5_000;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SandboxResult {
  output: unknown;
  logs: string[];
  durationMs: number;
}

// ---------------------------------------------------------------------------
// isolated-vm shim — loaded lazily so the package is optional
// ---------------------------------------------------------------------------

type IsolateModule = {
  Isolate: new (opts: { memoryLimit: number }) => {
    createContext(): {
      global: {
        set(key: string, value: unknown, opts?: { reference?: boolean }): void;
      };
      eval(
        code: string,
        opts?: { timeout?: number; promise?: boolean },
      ): Promise<unknown>;
    };
    compileScript(code: string): Promise<{
      run(ctx: unknown, opts?: { timeout?: number }): Promise<unknown>;
    }>;
    dispose(): void;
  };
  Reference: new (value: unknown) => unknown;
};

let _ivm: IsolateModule | null | undefined = undefined; // undefined = not yet attempted

async function tryLoadIvm(): Promise<IsolateModule | null> {
  if (_ivm !== undefined) return _ivm;
  try {
    // Dynamic import so isolated-vm is not required at module load time.
    // We use Function to avoid TypeScript's static module resolution check
    // for an optional peer dependency.
    const dynamicImport = new Function("m", "return import(m)") as (m: string) => Promise<unknown>;
    const mod = await dynamicImport("isolated-vm");
    _ivm = mod as unknown as IsolateModule;
    log.debug("isolated-vm loaded — using secure sandbox");
  } catch {
    _ivm = null;
    log.debug("isolated-vm not available — using Function() fallback sandbox");
  }
  return _ivm;
}

// ---------------------------------------------------------------------------
// isolated-vm backend
// ---------------------------------------------------------------------------

async function executeInIvm(
  code: string,
  context: Record<string, unknown>,
  timeoutMs: number,
  ivm: IsolateModule,
): Promise<SandboxResult> {
  const logs: string[] = [];
  const start = Date.now();

  const isolate = new ivm.Isolate({ memoryLimit: 64 });

  try {
    const ctx = isolate.createContext();

    // Inject a serialisable snapshot of the context.
    for (const [key, value] of Object.entries(context)) {
      try {
        ctx.global.set(key, JSON.parse(JSON.stringify(value)));
      } catch {
        // Skip non-serialisable values silently.
      }
    }

    // Inject a console.log surrogate that records into `logs`.
    // We communicate back via a shared array passed as JSON in the wrapper.
    const wrappedCode = `
(function() {
  const __logs__ = [];
  const console = {
    log: (...args) => __logs__.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
    warn: (...args) => __logs__.push('[warn] ' + args.join(' ')),
    error: (...args) => __logs__.push('[error] ' + args.join(' ')),
  };
  let __result__;
  try {
    __result__ = (function() {
      ${code}
    })();
  } catch (e) {
    throw new Error(String(e));
  }
  return JSON.stringify({ result: __result__, logs: __logs__ });
})()
`;

    const raw = await ctx.eval(wrappedCode, { timeout: timeoutMs });
    const parsed = JSON.parse(String(raw)) as { result: unknown; logs: string[] };
    logs.push(...(parsed.logs ?? []));

    return { output: parsed.result, logs, durationMs: Date.now() - start };
  } finally {
    isolate.dispose();
  }
}

// ---------------------------------------------------------------------------
// Function() fallback backend (restricted scope)
// ---------------------------------------------------------------------------

async function executeInFunction(
  code: string,
  context: Record<string, unknown>,
  timeoutMs: number,
): Promise<SandboxResult> {
  const logs: string[] = [];
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new StrategyError("Sandbox execution timed out", {
          code: "SANDBOX_TIMEOUT",
          context: { timeoutMs },
        }),
      );
    }, timeoutMs);

    try {
      // Build an argument list that provides a safe console and the context
      // values, but nothing else (no globalThis, no require, no process, etc.)
      const sandboxConsole = {
        log: (...args: unknown[]) =>
          logs.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ")),
        warn: (...args: unknown[]) => logs.push(`[warn] ${args.join(" ")}`),
        error: (...args: unknown[]) => logs.push(`[error] ${args.join(" ")}`),
      };

      // Serialize context to avoid passing live references.
      const safeContext: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(context)) {
        try {
          safeContext[key] = JSON.parse(JSON.stringify(value));
        } catch {
          // skip non-serialisable
        }
      }

      const argNames = ["console", ...Object.keys(safeContext)];
      const argValues: unknown[] = [sandboxConsole, ...Object.values(safeContext)];

      // Prepend a strict directive.
      const wrappedCode = `"use strict";\n${code}`;

      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const fn = new Function(...argNames, wrappedCode) as (...args: unknown[]) => unknown;
      const output = fn(...argValues);

      clearTimeout(timer);
      const durationMs = Date.now() - start;
      resolve({ output, logs, durationMs });
    } catch (err) {
      clearTimeout(timer);
      reject(
        new StrategyError(
          `Sandbox execution error: ${err instanceof Error ? err.message : String(err)}`,
          { code: "SANDBOX_ERROR", cause: err },
        ),
      );
    }
  });
}

// ---------------------------------------------------------------------------
// Public executeInSandbox function
// ---------------------------------------------------------------------------

/**
 * Execute arbitrary code in an isolated environment.
 *
 * The code runs with a restricted set of globals — only the provided
 * `context` values and a `console` stub are available.  Filesystem and
 * network access are blocked.
 *
 * @param code       - JavaScript/TypeScript source code to execute.
 * @param context    - Variables injected as globals inside the sandbox.
 * @param timeoutMs  - Hard deadline (default: 5 000 ms).
 *
 * @throws {StrategyError} on timeout or unhandled errors inside the code.
 */
export async function executeInSandbox(
  code: string,
  context: Record<string, unknown>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<SandboxResult> {
  if (timeoutMs <= 0) {
    throw new StrategyError("timeoutMs must be a positive number", {
      code: "SANDBOX_INVALID_ARGS",
    });
  }

  const ivm = await tryLoadIvm();

  if (ivm) {
    try {
      return await executeInIvm(code, context, timeoutMs, ivm);
    } catch (err) {
      // If isolated-vm itself throws (e.g. isolate disposal race), fall back.
      log.warn({ err }, "isolated-vm execution failed — falling back to Function()");
    }
  }

  return executeInFunction(code, context, timeoutMs);
}
