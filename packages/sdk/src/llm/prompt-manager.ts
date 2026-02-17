import Handlebars from "handlebars";

// ---------------------------------------------------------------------------
// Built-in prompt templates (inlined for portability — no file I/O needed).
// ---------------------------------------------------------------------------

const TEMPLATES: Record<string, string> = {
  "market-analysis": [
    "Given this market data: {{data}}, analyze trends for {{tokens}} on {{chains}}.",
    "Return structured JSON with: trend (bullish/bearish/neutral), confidence (0-1),",
    "keySignals (array of strings), recommendedActions (array of strings).",
  ].join("\n"),

  "trade-decision": [
    "Given portfolio: {{portfolio}}, strategy: {{strategy}}, market conditions: {{market}},",
    "decide: should we trade?",
    "Return JSON: {action: 'swap'|'hold'|'rebalance', params: {}, reasoning: string, confidence: number}.",
  ].join("\n"),

  "risk-assessment": [
    "Assess risk for proposed action: {{action}} given portfolio: {{portfolio}} and market: {{market}}.",
    "Return JSON: {riskScore: 0-100, approved: boolean, concerns: string[], modifications?: {}}.",
  ].join("\n"),

  "strategy-parser": [
    "Convert this natural language strategy into a Meridian strategy object:",
    "{{description}}",
    "User risk tolerance: {{riskTolerance}}. Budget: {{budget}}. Chains: {{chains}}.",
    "Return valid JSON matching: {id, name, version, description, triggers[], actions[], constraints, params}.",
  ].join("\n"),

  "agent-reflect": [
    "Evaluate the outcome of action: {{action}}. Result: {{result}}.",
    "Was this a good decision? Score -1 to 1.",
    "What should I do differently next time?",
    "Return JSON: {reward: number, learnings: string[], adjustments: {}}.",
  ].join("\n"),
};

// Register helpers.
Handlebars.registerHelper("json", (ctx: unknown) => JSON.stringify(ctx, null, 2));
Handlebars.registerHelper("truncate", (str: string, len: number) =>
  typeof str === "string" && str.length > len ? str.slice(0, len) + "..." : str,
);

// ---------------------------------------------------------------------------
// Prompt Manager
// ---------------------------------------------------------------------------

/** Pre-compiled template cache. */
const compiled = new Map<string, HandlebarsTemplateDelegate>();

/**
 * Render a named prompt template with the given context.
 * Templates are Handlebars-based and cached after first compilation.
 */
export function renderPrompt(templateName: string, context: Record<string, unknown>): string {
  let template = compiled.get(templateName);

  if (!template) {
    const source = TEMPLATES[templateName];
    if (!source) {
      throw new Error(`Unknown prompt template: "${templateName}"`);
    }
    template = Handlebars.compile(source);
    compiled.set(templateName, template);
  }

  return template(context);
}

/** List available template names. */
export function listTemplates(): string[] {
  return Object.keys(TEMPLATES);
}

/** Register a custom template. */
export function registerTemplate(name: string, source: string): void {
  TEMPLATES[name] = source;
  compiled.delete(name); // Invalidate cache.
}
