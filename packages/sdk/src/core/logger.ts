import pino from "pino";

/**
 * Create a pino logger scoped to an agent.
 * All Meridian components use this factory — structured JSON output by default.
 */
export function createLogger(
  context: { agentId?: string; module?: string },
  opts?: { level?: string },
): pino.Logger {
  return pino({
    level: opts?.level ?? "info",
    base: {
      ...(context.agentId ? { agentId: context.agentId } : {}),
      ...(context.module ? { module: context.module } : {}),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label: string) {
        return { level: label };
      },
    },
  });
}
