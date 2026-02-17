// ---------------------------------------------------------------------------
// Market Analyst agent — scans markets and produces trade signals.
// ---------------------------------------------------------------------------

import type { EventBus, MarketSnapshot } from "@meridian/sdk";

// ---------------------------------------------------------------------------
// Signal types
// ---------------------------------------------------------------------------

export interface TradeSignal {
  id: string;
  token: string;
  direction: "BUY" | "SELL";
  confidence: number;
  reasoning: string;
  suggestedSizePct: number;
  chainId: number;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Analyst
// ---------------------------------------------------------------------------

export class MarketAnalyst {
  private cycle = 0;
  private readonly signals: TradeSignal[] = [];

  constructor(private readonly bus: EventBus) {}

  /** Emit a signal event on the shared bus. */
  private broadcastSignal(signal: TradeSignal): void {
    this.bus.emit("agent:decision", {
      agentId: "analyst",
      record: {
        id: signal.id,
        agentId: "analyst",
        timestamp: signal.timestamp,
        state: "ACTING",
        reasoning: signal.reasoning,
        action: `${signal.direction}_${signal.token}`,
        params: { token: signal.token, sizePct: signal.suggestedSizePct },
        chainId: signal.chainId,
      },
    });
  }

  /**
   * Analyze a market snapshot and produce signals.
   * In a real system, this would call Claude to reason about the data.
   * For the demo, we use rule-based heuristics with mock reasoning.
   */
  async analyze(snapshot: MarketSnapshot): Promise<TradeSignal[]> {
    this.cycle++;
    const newSignals: TradeSignal[] = [];

    const prices = snapshot.prices;
    const gasGwei = Object.values(snapshot.gasPerChain)[0] ?? 50;

    // Simple heuristic: simulate "finding" opportunities based on cycle
    if (this.cycle % 3 === 1) {
      // Every 3rd cycle starting from the 1st, find an ETH opportunity
      const ethPrice = prices["ETH"] ?? 3400;
      const deviation = ((ethPrice - 3400) / 3400) * 100;

      if (Math.abs(deviation) > 1 || this.cycle === 1) {
        const signal: TradeSignal = {
          id: `sig-${this.cycle}-eth`,
          token: "ETH",
          direction: deviation < 0 ? "BUY" : "SELL",
          confidence: 0.72,
          reasoning: [
            `ETH is ${deviation < 0 ? "undervalued" : "overvalued"} by ${Math.abs(deviation).toFixed(1)}% vs 20-day mean.`,
            `Gas is ${gasGwei.toFixed(1)} gwei — ${gasGwei < 5 ? "very cheap" : "acceptable"}.`,
            `On-chain volume elevated 15% above 7-day average.`,
            `Recommending ${deviation < 0 ? "accumulation" : "profit-taking"} with moderate confidence.`,
          ].join(" "),
          suggestedSizePct: 5,
          chainId: 421614,
          timestamp: Date.now(),
        };
        newSignals.push(signal);
      }
    }

    if (this.cycle % 5 === 0) {
      // Every 5th cycle, find an ARB opportunity
      const signal: TradeSignal = {
        id: `sig-${this.cycle}-arb`,
        token: "ARB",
        direction: "BUY",
        confidence: 0.58,
        reasoning: [
          `ARB showing relative strength vs L2 peers.`,
          `TVL on Arbitrum grew 3.2% this week.`,
          `Price approaching key support level.`,
        ].join(" "),
        suggestedSizePct: 3,
        chainId: 421614,
        timestamp: Date.now(),
      };
      newSignals.push(signal);
    }

    for (const signal of newSignals) {
      this.broadcastSignal(signal);
    }
    this.signals.push(...newSignals);
    return newSignals;
  }

  get totalSignals(): number {
    return this.signals.length;
  }
}
