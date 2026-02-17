import { z } from "zod";
import { LLMError } from "../core/errors.js";

// ---------------------------------------------------------------------------
// Zod schemas for structured LLM outputs
// ---------------------------------------------------------------------------

export const MarketAnalysisSchema = z.object({
  trend: z.enum(["bullish", "bearish", "neutral"]),
  confidence: z.number().min(0).max(1),
  keySignals: z.array(z.string()),
  recommendedActions: z.array(z.string()),
});
export type MarketAnalysis = z.infer<typeof MarketAnalysisSchema>;

export const TradeDecisionSchema = z.object({
  action: z.enum(["swap", "hold", "rebalance"]),
  params: z.record(z.unknown()),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
});
export type TradeDecision = z.infer<typeof TradeDecisionSchema>;

export const RiskAssessmentSchema = z.object({
  riskScore: z.number().min(0).max(100),
  approved: z.boolean(),
  concerns: z.array(z.string()),
  modifications: z.record(z.unknown()).optional(),
});
export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>;

export const StrategySchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  triggers: z.array(z.object({
    type: z.string(),
    params: z.record(z.unknown()),
  })),
  actions: z.array(z.object({
    type: z.string(),
    params: z.record(z.unknown()),
    chainId: z.number(),
  })),
  constraints: z.object({
    maxPositionPct: z.number().optional(),
    stopLossPct: z.number().optional(),
    maxDailyTrades: z.number().optional(),
    maxSlippageBps: z.number().optional(),
  }),
  params: z.record(z.unknown()),
});

export const ReflectionSchema = z.object({
  reward: z.number().min(-1).max(1),
  learnings: z.array(z.string()),
  adjustments: z.record(z.unknown()),
});
export type Reflection = z.infer<typeof ReflectionSchema>;

// ---------------------------------------------------------------------------
// Parser — validates LLM JSON output against a schema.
// ---------------------------------------------------------------------------

/**
 * Parse and validate LLM response content against a Zod schema.
 * Handles malformed JSON gracefully.
 */
export function parseStructuredOutput<T>(
  content: string,
  schema: z.ZodType<T>,
): T {
  // Try to extract JSON from the response (LLMs sometimes wrap in ```json blocks).
  const jsonStr = extractJson(content);

  try {
    const raw = JSON.parse(jsonStr);
    return schema.parse(raw);
  } catch (err) {
    throw new LLMError("Failed to parse structured LLM output", {
      code: "LLM_PARSE_ERROR",
      recoverable: true,
      cause: err,
      context: { content: content.slice(0, 200) },
    });
  }
}

function extractJson(content: string): string {
  // Remove markdown code fences if present.
  const fenceMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch?.[1]) return fenceMatch[1].trim();

  // Try to find the first { ... } or [ ... ] block.
  const braceStart = content.indexOf("{");
  const bracketStart = content.indexOf("[");
  const start = braceStart >= 0 && (bracketStart < 0 || braceStart < bracketStart)
    ? braceStart
    : bracketStart;

  if (start >= 0) {
    return content.slice(start);
  }

  return content;
}
