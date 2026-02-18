// ---------------------------------------------------------------------------
// NL → Strategy translator.
// Accepts a free-form description and converts it to a structured IStrategy
// using an LLM, with Zod validation and a template fallback.
// ---------------------------------------------------------------------------

import { z } from "zod";
import type { IStrategy } from "../types/strategy.js";
import { TriggerType, ActionType, StrategyConstraintsSchema } from "../types/strategy.js";
import { createLogger } from "../core/logger.js";

const log = createLogger({ module: "NLTranslator" });

// ---------------------------------------------------------------------------
// Minimal UUID v4 (avoids adding a dependency)
// ---------------------------------------------------------------------------

function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------
// LLM gateway dependency interface
// ---------------------------------------------------------------------------

export interface NLTranslatorDeps {
  llmGateway: {
    complete(req: {
      prompt: string;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    }): Promise<{ content: string }>;
  };
}

// ---------------------------------------------------------------------------
// Zod schema for the LLM-generated strategy JSON
// ---------------------------------------------------------------------------

const LLMStrategySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  triggers: z
    .array(
      z.object({
        type: z.string(),
        params: z.record(z.unknown()).optional().default({}),
        description: z.string().optional(),
      }),
    )
    .min(1),
  actions: z
    .array(
      z.object({
        type: z.string(),
        params: z.record(z.unknown()).optional().default({}),
        chainId: z.number().int().positive(),
        protocol: z.string().optional(),
      }),
    )
    .min(1),
  constraints: StrategyConstraintsSchema.partial().optional(),
  params: z.record(z.unknown()).optional().default({}),
});

type LLMStrategy = z.infer<typeof LLMStrategySchema>;

// ---------------------------------------------------------------------------
// Risk-tolerance → constraint defaults
// ---------------------------------------------------------------------------

type RiskTolerance = "conservative" | "moderate" | "aggressive";

const RISK_CONSTRAINTS: Record<RiskTolerance, Partial<z.infer<typeof StrategyConstraintsSchema>>> = {
  conservative: {
    maxPositionPct: 10,
    stopLossPct: -3,
    maxDailyTrades: 5,
    maxSlippageBps: 30,
  },
  moderate: {
    maxPositionPct: 25,
    stopLossPct: -5,
    maxDailyTrades: 10,
    maxSlippageBps: 50,
  },
  aggressive: {
    maxPositionPct: 50,
    stopLossPct: -10,
    maxDailyTrades: 50,
    maxSlippageBps: 100,
  },
};

// ---------------------------------------------------------------------------
// Chain name → chain ID mapping
// ---------------------------------------------------------------------------

const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  mainnet: 1,
  arbitrum: 42161,
  optimism: 10,
  base: 8453,
  polygon: 137,
  avalanche: 43114,
  bsc: 56,
  solana: -1, // handled separately
};

function chainNameToId(name: string): number {
  return CHAIN_IDS[name.toLowerCase()] ?? 1;
}

// ---------------------------------------------------------------------------
// NLTranslator class
// ---------------------------------------------------------------------------

export class NLTranslator {
  private readonly deps: NLTranslatorDeps;

  constructor(deps: NLTranslatorDeps) {
    this.deps = deps;
  }

  /**
   * Translate a free-form natural language strategy description into an
   * IStrategy object.  Uses the LLM to generate the initial JSON, validates
   * it with Zod, then fills in any gaps.
   *
   * @param description   - Human-readable strategy description.
   * @param riskTolerance - Risk profile controlling constraint defaults.
   * @param chains        - Chain names the strategy should operate on.
   */
  async translate(
    description: string,
    riskTolerance: RiskTolerance,
    chains: string[],
  ): Promise<IStrategy> {
    const systemPrompt = this.buildSystemPrompt();
    const prompt = this.buildUserPrompt(description, riskTolerance, chains);

    let raw: string;
    try {
      const response = await this.deps.llmGateway.complete({
        prompt,
        systemPrompt,
        temperature: 0.2,
        maxTokens: 1500,
      });
      raw = response.content;
    } catch (err) {
      log.warn({ err }, "LLM call failed — using template strategy");
      return this.templateStrategy(description, riskTolerance, chains);
    }

    // Extract JSON from the response (may be wrapped in ```json … ```)
    const jsonStr = this.extractJson(raw);
    if (!jsonStr) {
      log.warn("LLM response contained no parseable JSON — using template strategy");
      return this.templateStrategy(description, riskTolerance, chains);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (err) {
      log.warn({ err }, "Failed to JSON.parse LLM response — using template strategy");
      return this.templateStrategy(description, riskTolerance, chains);
    }

    const validated = LLMStrategySchema.safeParse(parsed);
    if (!validated.success) {
      log.warn(
        { issues: validated.error.issues },
        "LLM strategy JSON failed Zod validation — using template strategy",
      );
      return this.templateStrategy(description, riskTolerance, chains);
    }

    return this.toIStrategy(validated.data, riskTolerance, chains);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private buildSystemPrompt(): string {
    return [
      "You are a DeFi strategy assistant that outputs only valid JSON.",
      "When given a strategy description you MUST respond with a single JSON object.",
      "Do NOT include any markdown, explanations, or extra text outside the JSON.",
      "The JSON must match this structure:",
      JSON.stringify(
        {
          name: "string",
          description: "string",
          triggers: [
            {
              type: "PRICE_ABOVE | PRICE_BELOW | PRICE_CHANGE_PCT | INDICATOR | TIME_INTERVAL | PORTFOLIO_DRIFT | GAS_BELOW | CUSTOM",
              params: {},
              description: "optional string",
            },
          ],
          actions: [
            {
              type: "SWAP | ADD_LIQUIDITY | REMOVE_LIQUIDITY | BORROW | REPAY | STAKE | UNSTAKE | BRIDGE | NOTIFY | REBALANCE | CUSTOM",
              params: {},
              chainId: 1,
              protocol: "optional string",
            },
          ],
          constraints: {
            maxPositionPct: 25,
            stopLossPct: -5,
            maxDailyTrades: 10,
            maxSlippageBps: 50,
          },
          params: {},
        },
        null,
        2,
      ),
    ].join("\n");
  }

  private buildUserPrompt(
    description: string,
    riskTolerance: RiskTolerance,
    chains: string[],
  ): string {
    return [
      `Strategy description: ${description}`,
      `Risk tolerance: ${riskTolerance}`,
      `Target chains: ${chains.join(", ")}`,
      "",
      "Respond ONLY with a valid JSON object matching the schema described.",
    ].join("\n");
  }

  private extractJson(text: string): string | null {
    // Try a ```json … ``` block first.
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) return fenced[1]!.trim();

    // Otherwise look for a bare JSON object.
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) return objMatch[0]!.trim();

    return null;
  }

  private toIStrategy(
    data: LLMStrategy,
    riskTolerance: RiskTolerance,
    chains: string[],
  ): IStrategy {
    const riskDefaults = RISK_CONSTRAINTS[riskTolerance];
    const chainIds = chains.map(chainNameToId).filter((id) => id > 0);
    const primaryChainId = chainIds[0] ?? 1;

    const constraintsMerged = StrategyConstraintsSchema.parse({
      ...riskDefaults,
      ...(data.constraints ?? {}),
      ...(chainIds.length > 0 ? { allowedChains: chainIds } : {}),
    });

    // Validate trigger types — replace unknown types with CUSTOM.
    const validTriggerTypes = new Set(Object.values(TriggerType));
    const triggers = data.triggers.map((t) => ({
      type: validTriggerTypes.has(t.type as typeof TriggerType[keyof typeof TriggerType])
        ? (t.type as typeof TriggerType[keyof typeof TriggerType])
        : TriggerType.CUSTOM,
      params: t.params ?? {},
      ...(t.description ? { description: t.description } : {}),
    }));

    // Validate action types — replace unknown types with CUSTOM.
    const validActionTypes = new Set(Object.values(ActionType));
    const actions = data.actions.map((a) => ({
      type: validActionTypes.has(a.type as typeof ActionType[keyof typeof ActionType])
        ? (a.type as typeof ActionType[keyof typeof ActionType])
        : ActionType.CUSTOM,
      params: a.params ?? {},
      chainId: a.chainId ?? primaryChainId,
      ...(a.protocol ? { protocol: a.protocol } : {}),
    }));

    const strategy: IStrategy = {
      id: generateId(),
      name: data.name,
      version: "1.0.0",
      description: data.description,
      triggers,
      actions,
      constraints: constraintsMerged,
      params: data.params ?? {},
    };

    log.info({ strategyName: strategy.name }, "NL strategy translation complete");
    return strategy;
  }

  /** Template strategy used when LLM is unavailable or produces invalid JSON. */
  private templateStrategy(
    description: string,
    riskTolerance: RiskTolerance,
    chains: string[],
  ): IStrategy {
    const riskDefaults = RISK_CONSTRAINTS[riskTolerance];
    const chainIds = chains.map(chainNameToId).filter((id) => id > 0);
    const primaryChainId = chainIds[0] ?? 1;

    const constraints = StrategyConstraintsSchema.parse({
      ...riskDefaults,
      ...(chainIds.length > 0 ? { allowedChains: chainIds } : {}),
    });

    log.info("Using template strategy as fallback");

    return {
      id: generateId(),
      name: "Template Strategy",
      version: "1.0.0",
      description,
      triggers: [
        {
          type: TriggerType.TIME_INTERVAL,
          params: { bars: 10 },
          description: "Execute on a periodic schedule",
        },
      ],
      actions: [
        {
          type: ActionType.NOTIFY,
          params: { message: "Strategy triggered" },
          chainId: primaryChainId,
        },
      ],
      constraints,
      params: { riskTolerance, chains },
    };
  }
}
