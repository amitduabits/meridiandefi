import { describe, it, expect } from "vitest";
import {
  parseStructuredOutput,
  MarketAnalysisSchema,
  TradeDecisionSchema,
  RiskAssessmentSchema,
  ReflectionSchema,
} from "./structured-output.js";

describe("parseStructuredOutput", () => {
  it("parses valid MarketAnalysis JSON", () => {
    const content = JSON.stringify({
      trend: "bullish",
      confidence: 0.85,
      keySignals: ["RSI oversold", "volume spike"],
      recommendedActions: ["buy ETH"],
    });

    const result = parseStructuredOutput(content, MarketAnalysisSchema);
    expect(result.trend).toBe("bullish");
    expect(result.confidence).toBe(0.85);
    expect(result.keySignals).toHaveLength(2);
  });

  it("parses valid TradeDecision JSON", () => {
    const content = JSON.stringify({
      action: "swap",
      params: { tokenIn: "USDC", tokenOut: "ETH" },
      reasoning: "ETH undervalued vs 20-day mean",
      confidence: 0.72,
    });

    const result = parseStructuredOutput(content, TradeDecisionSchema);
    expect(result.action).toBe("swap");
    expect(result.confidence).toBe(0.72);
  });

  it("parses valid RiskAssessment JSON", () => {
    const content = JSON.stringify({
      riskScore: 45,
      approved: true,
      concerns: ["slippage risk"],
    });

    const result = parseStructuredOutput(content, RiskAssessmentSchema);
    expect(result.approved).toBe(true);
    expect(result.riskScore).toBe(45);
  });

  it("parses valid Reflection JSON", () => {
    const content = JSON.stringify({
      reward: 0.8,
      learnings: ["wait for lower gas"],
      adjustments: { maxGas: 50 },
    });

    const result = parseStructuredOutput(content, ReflectionSchema);
    expect(result.reward).toBe(0.8);
  });

  it("extracts JSON from markdown code fences", () => {
    const content = '```json\n{"trend":"neutral","confidence":0.5,"keySignals":[],"recommendedActions":[]}\n```';
    const result = parseStructuredOutput(content, MarketAnalysisSchema);
    expect(result.trend).toBe("neutral");
  });

  it("extracts JSON from mixed text", () => {
    const content = 'Here is my analysis:\n{"trend":"bearish","confidence":0.3,"keySignals":["high volume selling"],"recommendedActions":["reduce exposure"]}';
    const result = parseStructuredOutput(content, MarketAnalysisSchema);
    expect(result.trend).toBe("bearish");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseStructuredOutput("not json at all", MarketAnalysisSchema)).toThrow(
      "Failed to parse structured LLM output",
    );
  });

  it("throws on schema validation failure", () => {
    const content = JSON.stringify({ trend: "invalid_trend", confidence: 2 });
    expect(() => parseStructuredOutput(content, MarketAnalysisSchema)).toThrow();
  });
});
