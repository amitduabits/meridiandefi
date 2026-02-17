import { describe, it, expect } from "vitest";
import { PreFlightValidator } from "./preflight.js";
import type { ActionParams, PortfolioSnapshot } from "./preflight.js";
import type { RiskLimits } from "../types/risk.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultLimits(overrides?: Partial<RiskLimits>): RiskLimits {
  return {
    maxPositionSizeUsd: 10_000,
    maxPortfolioExposurePct: 100,
    maxSlippageBps: 100,
    maxGasCostPct: 1,
    maxDailyLossPct: 10,
    maxDrawdownPct: 20,
    maxOpenPositions: 20,
    maxDailyTrades: 50,
    ...overrides,
  };
}

function defaultPortfolio(overrides?: Partial<PortfolioSnapshot>): PortfolioSnapshot {
  return {
    totalValueUsd: 100_000,
    // Deployed = 60k out of 100k = 60%. Adding a 5k trade => 65% < 100%.
    positionValues: [30_000, 20_000, 10_000],
    openPositions: 3,
    dailyTradeCount: 5,
    dayStartEquityUsd: 100_000,
    currentEquityUsd: 98_000,
    ...overrides,
  };
}

function defaultAction(overrides?: Partial<ActionParams>): ActionParams {
  return {
    action: "SWAP",
    tradeValueUsd: 5_000,
    estimatedSlippageBps: 30,
    gasCostUsd: 10,
    chainId: 1,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PreFlightValidator", () => {
  // -----------------------------------------------------------------------
  // Construction
  // -----------------------------------------------------------------------

  it("constructs with valid limits", () => {
    const validator = new PreFlightValidator(defaultLimits());
    expect(validator).toBeDefined();
  });

  it("throws on invalid limits", () => {
    expect(() => {
      new PreFlightValidator({ maxPositionSizeUsd: -1 } as RiskLimits);
    }).toThrow("Invalid risk limits");
  });

  // -----------------------------------------------------------------------
  // All checks pass
  // -----------------------------------------------------------------------

  it("allows a valid action with low risk score", () => {
    const validator = new PreFlightValidator(defaultLimits());
    const decision = validator.validate(defaultAction(), defaultPortfolio());

    expect(decision.allowed).toBe(true);
    expect(decision.riskScore).toBeLessThan(50);
    expect(decision.warnings.length).toBe(0);
    expect(decision.reason).toBe("All pre-flight checks passed");
  });

  // -----------------------------------------------------------------------
  // Position size checks
  // -----------------------------------------------------------------------

  describe("position size", () => {
    it("rejects when trade exceeds maxPositionSizeUsd", () => {
      const validator = new PreFlightValidator(defaultLimits({ maxPositionSizeUsd: 1_000 }));
      const action = defaultAction({ tradeValueUsd: 5_000 });
      const decision = validator.validate(action, defaultPortfolio());

      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain("Position size");
      expect(decision.modifications?.suggestedTradeValueUsd).toBe(1_000);
    });

    it("warns when trade is > 80% of position size limit", () => {
      const validator = new PreFlightValidator(defaultLimits({ maxPositionSizeUsd: 6_000 }));
      const action = defaultAction({ tradeValueUsd: 5_000 }); // 83% of 6000
      const decision = validator.validate(action, defaultPortfolio());

      expect(decision.allowed).toBe(true);
      expect(decision.warnings.some((w) => w.includes("% of limit"))).toBe(true);
    });

    it("passes cleanly when well within limits", () => {
      const validator = new PreFlightValidator(defaultLimits({ maxPositionSizeUsd: 50_000 }));
      const action = defaultAction({ tradeValueUsd: 5_000 }); // 10%
      const decision = validator.validate(action, defaultPortfolio());

      expect(decision.allowed).toBe(true);
      expect(decision.warnings.length).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // Portfolio exposure checks
  // -----------------------------------------------------------------------

  describe("portfolio exposure", () => {
    it("rejects when new exposure exceeds limit", () => {
      // Deployed = 80k, trade = 25k => new deployed = 105k => 105% > 100%.
      const validator = new PreFlightValidator(defaultLimits({ maxPortfolioExposurePct: 100 }));
      const portfolio = defaultPortfolio({
        totalValueUsd: 100_000,
        positionValues: [50_000, 30_000],
      });
      const action = defaultAction({ tradeValueUsd: 25_000 });

      const decision = validator.validate(action, portfolio);
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain("Portfolio exposure");
    });

    it("allows when within exposure limits", () => {
      // Deployed = 30k, trade = 5k => 35k => 35% < 100%.
      const validator = new PreFlightValidator(defaultLimits({ maxPortfolioExposurePct: 100 }));
      const portfolio = defaultPortfolio({
        totalValueUsd: 100_000,
        positionValues: [20_000, 10_000],
      });
      const action = defaultAction({ tradeValueUsd: 5_000 });

      const decision = validator.validate(action, portfolio);
      expect(decision.allowed).toBe(true);
    });

    it("handles zero portfolio value gracefully", () => {
      const validator = new PreFlightValidator(defaultLimits());
      const portfolio = defaultPortfolio({ totalValueUsd: 0 });
      const decision = validator.validate(defaultAction(), portfolio);

      // Should not crash; the exposure check passes for zero portfolio.
      expect(decision).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // Gas cost checks
  // -----------------------------------------------------------------------

  describe("gas cost", () => {
    it("rejects when gas cost exceeds limit", () => {
      const validator = new PreFlightValidator(defaultLimits({ maxGasCostPct: 1 }));
      const action = defaultAction({ tradeValueUsd: 100, gasCostUsd: 5 }); // 5%

      const decision = validator.validate(action, defaultPortfolio());
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain("Gas cost");
    });

    it("allows when gas cost is within limit", () => {
      const validator = new PreFlightValidator(defaultLimits({ maxGasCostPct: 1 }));
      const action = defaultAction({ tradeValueUsd: 5_000, gasCostUsd: 10 }); // 0.2%

      const decision = validator.validate(action, defaultPortfolio());
      expect(decision.allowed).toBe(true);
    });

    it("warns when gas cost approaches limit", () => {
      const validator = new PreFlightValidator(defaultLimits({ maxGasCostPct: 1 }));
      const action = defaultAction({ tradeValueUsd: 1_000, gasCostUsd: 8 }); // 0.8% => 80% of 1% limit

      const decision = validator.validate(action, defaultPortfolio());
      expect(decision.allowed).toBe(true);
      expect(decision.warnings.some((w) => w.includes("Gas cost"))).toBe(true);
    });

    it("rejects when trade value is zero or negative", () => {
      const validator = new PreFlightValidator(defaultLimits());
      const action = defaultAction({ tradeValueUsd: 0, gasCostUsd: 1 });

      const decision = validator.validate(action, defaultPortfolio());
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain("Trade value must be positive");
    });
  });

  // -----------------------------------------------------------------------
  // Slippage checks
  // -----------------------------------------------------------------------

  describe("slippage", () => {
    it("rejects when slippage exceeds limit", () => {
      const validator = new PreFlightValidator(defaultLimits({ maxSlippageBps: 50 }));
      const action = defaultAction({ estimatedSlippageBps: 100 });

      const decision = validator.validate(action, defaultPortfolio());
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain("slippage");
      expect(decision.modifications?.suggestedSlippageBps).toBe(50);
    });

    it("allows when slippage is within limit", () => {
      const validator = new PreFlightValidator(defaultLimits({ maxSlippageBps: 100 }));
      const action = defaultAction({ estimatedSlippageBps: 30 });

      const decision = validator.validate(action, defaultPortfolio());
      expect(decision.allowed).toBe(true);
    });

    it("warns when slippage is close to limit", () => {
      const validator = new PreFlightValidator(defaultLimits({ maxSlippageBps: 100 }));
      const action = defaultAction({ estimatedSlippageBps: 85 }); // 85% of 100

      const decision = validator.validate(action, defaultPortfolio());
      expect(decision.allowed).toBe(true);
      expect(decision.warnings.some((w) => w.includes("Slippage"))).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Daily loss checks
  // -----------------------------------------------------------------------

  describe("daily loss", () => {
    it("rejects when daily loss limit is breached", () => {
      const validator = new PreFlightValidator(defaultLimits({ maxDailyLossPct: 5 }));
      const portfolio = defaultPortfolio({
        dayStartEquityUsd: 100_000,
        currentEquityUsd: 94_000, // 6% loss
      });

      const decision = validator.validate(defaultAction(), portfolio);
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain("Daily loss");
    });

    it("allows when daily loss is within limit", () => {
      const validator = new PreFlightValidator(defaultLimits({ maxDailyLossPct: 10 }));
      const portfolio = defaultPortfolio({
        dayStartEquityUsd: 100_000,
        currentEquityUsd: 98_000, // 2% loss
      });

      const decision = validator.validate(defaultAction(), portfolio);
      expect(decision.allowed).toBe(true);
    });

    it("warns when daily loss approaches limit", () => {
      const validator = new PreFlightValidator(defaultLimits({ maxDailyLossPct: 10 }));
      const portfolio = defaultPortfolio({
        dayStartEquityUsd: 100_000,
        currentEquityUsd: 92_000, // 8% loss => 80% of 10% limit
      });

      const decision = validator.validate(defaultAction(), portfolio);
      expect(decision.allowed).toBe(true);
      expect(decision.warnings.some((w) => w.includes("Daily loss"))).toBe(true);
    });

    it("handles zero dayStartEquityUsd gracefully", () => {
      const validator = new PreFlightValidator(defaultLimits());
      const portfolio = defaultPortfolio({ dayStartEquityUsd: 0 });

      const decision = validator.validate(defaultAction(), portfolio);
      // Should not crash.
      expect(decision).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // Daily trade limit
  // -----------------------------------------------------------------------

  describe("daily trade limit", () => {
    it("rejects when daily trade count is at limit", () => {
      const validator = new PreFlightValidator(defaultLimits({ maxDailyTrades: 10 }));
      const portfolio = defaultPortfolio({ dailyTradeCount: 10 });

      const decision = validator.validate(defaultAction(), portfolio);
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain("Daily trade count");
    });

    it("allows when daily trade count is under limit", () => {
      const validator = new PreFlightValidator(defaultLimits({ maxDailyTrades: 50 }));
      const portfolio = defaultPortfolio({ dailyTradeCount: 5 });

      const decision = validator.validate(defaultAction(), portfolio);
      expect(decision.allowed).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Open position limit
  // -----------------------------------------------------------------------

  describe("open position limit", () => {
    it("rejects when open positions are at limit", () => {
      const validator = new PreFlightValidator(defaultLimits({ maxOpenPositions: 3 }));
      const portfolio = defaultPortfolio({ openPositions: 3 });

      const decision = validator.validate(defaultAction(), portfolio);
      expect(decision.allowed).toBe(false);
      expect(decision.reason).toContain("Open positions");
    });

    it("allows when open positions are under limit", () => {
      const validator = new PreFlightValidator(defaultLimits({ maxOpenPositions: 20 }));
      const portfolio = defaultPortfolio({ openPositions: 3 });

      const decision = validator.validate(defaultAction(), portfolio);
      expect(decision.allowed).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Multiple failures
  // -----------------------------------------------------------------------

  it("reports multiple failure reasons", () => {
    const validator = new PreFlightValidator(defaultLimits({
      maxPositionSizeUsd: 100,
      maxSlippageBps: 10,
    }));
    const action = defaultAction({
      tradeValueUsd: 5_000,
      estimatedSlippageBps: 50,
    });

    const decision = validator.validate(action, defaultPortfolio());
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("Position size");
    expect(decision.reason).toContain("slippage");
  });

  // -----------------------------------------------------------------------
  // Risk score
  // -----------------------------------------------------------------------

  it("assigns higher risk score to riskier actions", () => {
    const validator = new PreFlightValidator(defaultLimits());

    const safeAction = defaultAction({
      tradeValueUsd: 100,
      estimatedSlippageBps: 5,
      gasCostUsd: 0.01,
    });
    const riskyAction = defaultAction({
      tradeValueUsd: 9_500, // 95% of 10k limit
      estimatedSlippageBps: 90, // 90% of 100bps limit
      gasCostUsd: 8, // close to 1% of 9500
    });

    const safeDecision = validator.validate(safeAction, defaultPortfolio());
    const riskyDecision = validator.validate(riskyAction, defaultPortfolio());

    expect(riskyDecision.riskScore).toBeGreaterThan(safeDecision.riskScore);
  });

  it("clamps risk score to 0-100 range", () => {
    const validator = new PreFlightValidator(defaultLimits({
      maxPositionSizeUsd: 100,
      maxSlippageBps: 10,
      maxGasCostPct: 0.01,
      maxDailyLossPct: 1,
      maxOpenPositions: 1,
      maxDailyTrades: 1,
    }));
    const action = defaultAction({
      tradeValueUsd: 50_000,
      estimatedSlippageBps: 500,
      gasCostUsd: 1_000,
    });
    const portfolio = defaultPortfolio({
      dayStartEquityUsd: 100_000,
      currentEquityUsd: 50_000,
      openPositions: 5,
      dailyTradeCount: 10,
    });

    const decision = validator.validate(action, portfolio);
    expect(decision.riskScore).toBeLessThanOrEqual(100);
    expect(decision.riskScore).toBeGreaterThanOrEqual(0);
  });
});
