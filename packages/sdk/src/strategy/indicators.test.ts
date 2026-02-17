import { describe, it, expect } from "vitest";
import { sma, ema, rsi, macd, bollingerBands, vwap, zScore } from "./indicators.js";

// ---------------------------------------------------------------------------
// SMA
// ---------------------------------------------------------------------------

describe("sma", () => {
  it("computes the correct SMA for [1,2,3,4,5] period 3", () => {
    const result = sma([1, 2, 3, 4, 5], 3);
    expect(result).toHaveLength(3);
    expect(result[0]).toBeCloseTo(2, 10);   // (1+2+3)/3
    expect(result[1]).toBeCloseTo(3, 10);   // (2+3+4)/3
    expect(result[2]).toBeCloseTo(4, 10);   // (3+4+5)/3
  });

  it("returns a single value when period === data length", () => {
    const result = sma([10, 20, 30], 3);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeCloseTo(20, 10);
  });

  it("returns empty when data is shorter than period", () => {
    expect(sma([1, 2], 3)).toHaveLength(0);
  });

  it("throws on period < 1", () => {
    expect(() => sma([1, 2, 3], 0)).toThrow(RangeError);
  });

  it("handles period = 1 (identity)", () => {
    const data = [5, 10, 15];
    expect(sma(data, 1)).toEqual([5, 10, 15]);
  });
});

// ---------------------------------------------------------------------------
// EMA
// ---------------------------------------------------------------------------

describe("ema", () => {
  it("seeds with the SMA of the first period", () => {
    // EMA(3) of [2, 4, 6, 8, 10]
    // Seed = (2+4+6)/3 = 4
    const result = ema([2, 4, 6, 8, 10], 3);
    expect(result).toHaveLength(3);
    expect(result[0]).toBeCloseTo(4, 10); // seed SMA
  });

  it("subsequent values apply the EMA formula", () => {
    // k = 2/(3+1) = 0.5
    // EMA[0] = 4 (seed)
    // EMA[1] = 8*0.5 + 4*0.5 = 6
    // EMA[2] = 10*0.5 + 6*0.5 = 8
    const result = ema([2, 4, 6, 8, 10], 3);
    expect(result[1]).toBeCloseTo(6, 10);
    expect(result[2]).toBeCloseTo(8, 10);
  });

  it("returns empty when data too short", () => {
    expect(ema([1], 5)).toHaveLength(0);
  });

  it("throws on period < 1", () => {
    expect(() => ema([1], 0)).toThrow(RangeError);
  });
});

// ---------------------------------------------------------------------------
// RSI
// ---------------------------------------------------------------------------

describe("rsi", () => {
  it("produces values between 0 and 100", () => {
    const data = [44, 44.34, 44.09, 43.61, 44.33, 44.83, 45.10, 45.42, 45.84,
      46.08, 45.89, 46.03, 45.61, 46.28, 46.28, 46.00, 46.03, 46.41,
      46.22, 45.64];
    const result = rsi(data, 14);
    for (const v of result) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it("returns 100 when price only goes up", () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = rsi(data, 5);
    // All gains, no losses => RSI = 100.
    expect(result[0]).toBeCloseTo(100, 5);
  });

  it("returns 0 when price only goes down", () => {
    const data = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const result = rsi(data, 5);
    // All losses, no gains => RSI = 0.
    expect(result[0]).toBeCloseTo(0, 5);
  });

  it("returns empty when data too short", () => {
    expect(rsi([1, 2, 3], 14)).toHaveLength(0);
  });

  it("length is data.length - period", () => {
    const data = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i));
    const result = rsi(data, 14);
    expect(result).toHaveLength(30 - 14);
  });
});

// ---------------------------------------------------------------------------
// MACD
// ---------------------------------------------------------------------------

describe("macd", () => {
  // Generate a long enough dataset for default MACD(12, 26, 9).
  const data = Array.from({ length: 60 }, (_, i) => 100 + 10 * Math.sin(i * 0.3));

  it("returns macd, signal, and histogram arrays", () => {
    const result = macd(data);
    expect(result).toHaveProperty("macd");
    expect(result).toHaveProperty("signal");
    expect(result).toHaveProperty("histogram");
  });

  it("macd, signal, and histogram have the same length", () => {
    const result = macd(data);
    expect(result.signal.length).toBe(result.macd.length);
    expect(result.histogram.length).toBe(result.macd.length);
  });

  it("histogram equals macd - signal at every point", () => {
    const result = macd(data);
    for (let i = 0; i < result.histogram.length; i++) {
      expect(result.histogram[i]).toBeCloseTo(
        result.macd[i]! - result.signal[i]!,
        10,
      );
    }
  });

  it("works with custom periods", () => {
    const result = macd(data, 5, 10, 3);
    expect(result.macd.length).toBeGreaterThan(0);
    expect(result.signal.length).toBe(result.macd.length);
  });

  it("returns empty arrays when data is too short", () => {
    const result = macd([1, 2, 3]);
    expect(result.macd).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Bollinger Bands
// ---------------------------------------------------------------------------

describe("bollingerBands", () => {
  it("upper > middle > lower for non-constant data", () => {
    const data = Array.from({ length: 30 }, (_, i) => 100 + i * 0.5 + Math.sin(i));
    const { upper, middle, lower } = bollingerBands(data, 20, 2);

    expect(upper.length).toBe(middle.length);
    expect(lower.length).toBe(middle.length);

    for (let i = 0; i < middle.length; i++) {
      expect(upper[i]).toBeGreaterThan(middle[i]!);
      expect(middle[i]).toBeGreaterThan(lower[i]!);
    }
  });

  it("bands collapse to the mean for constant data", () => {
    const data = Array(25).fill(50) as number[];
    const { upper, middle, lower } = bollingerBands(data, 20, 2);

    for (let i = 0; i < middle.length; i++) {
      expect(upper[i]).toBeCloseTo(50, 10);
      expect(middle[i]).toBeCloseTo(50, 10);
      expect(lower[i]).toBeCloseTo(50, 10);
    }
  });

  it("middle band equals SMA", () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const { middle } = bollingerBands(data, 5, 2);
    const smaResult = sma(data, 5);
    expect(middle).toEqual(smaResult);
  });

  it("returns correct lengths", () => {
    const data = Array.from({ length: 30 }, (_, i) => i);
    const { upper, middle, lower } = bollingerBands(data, 10, 2);
    expect(upper).toHaveLength(21);
    expect(middle).toHaveLength(21);
    expect(lower).toHaveLength(21);
  });
});

// ---------------------------------------------------------------------------
// VWAP
// ---------------------------------------------------------------------------

describe("vwap", () => {
  it("computes VWAP from OHLCV data", () => {
    const highs = [12, 13, 14];
    const lows = [10, 11, 12];
    const closes = [11, 12, 13];
    const volumes = [100, 200, 300];

    const result = vwap(highs, lows, closes, volumes);
    expect(result).toHaveLength(3);

    // Manual check: tp0 = (12+10+11)/3 = 11, tp1 = (13+11+12)/3 = 12, tp2 = (14+12+13)/3 = 13
    // vwap0 = (11*100) / 100 = 11
    expect(result[0]).toBeCloseTo(11, 5);
    // vwap1 = (11*100 + 12*200) / 300 = (1100 + 2400) / 300 = 11.6667
    expect(result[1]).toBeCloseTo(3500 / 300, 5);
    // vwap2 = (1100 + 2400 + 13*300) / 600 = 7400 / 600 = 12.3333
    expect(result[2]).toBeCloseTo(7400 / 600, 5);
  });

  it("throws when arrays have mismatched lengths", () => {
    expect(() => vwap([1], [2, 3], [4], [5])).toThrow(RangeError);
  });

  it("returns zeros when all volumes are zero", () => {
    const result = vwap([10], [8], [9], [0]);
    expect(result[0]).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Z-Score
// ---------------------------------------------------------------------------

describe("zScore", () => {
  it("z-score of the mean value is approximately 0", () => {
    // Constant data => every value equals the mean => z = 0.
    const data = [5, 5, 5, 5, 5];
    const result = zScore(data, 3);
    for (const z of result) {
      expect(z).toBeCloseTo(0, 10);
    }
  });

  it("positive z-score when latest value > mean", () => {
    const data = [1, 1, 1, 1, 10];
    const result = zScore(data, 5);
    expect(result[0]).toBeGreaterThan(0);
  });

  it("negative z-score when latest value < mean", () => {
    const data = [10, 10, 10, 10, 1];
    const result = zScore(data, 5);
    expect(result[0]).toBeLessThan(0);
  });

  it("returns correct array length", () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = zScore(data, 5);
    expect(result).toHaveLength(6); // 10 - 5 + 1
  });

  it("returns empty for data shorter than period", () => {
    expect(zScore([1, 2], 5)).toHaveLength(0);
  });

  it("z-score of last element in [1,2,3] period 3 should be positive", () => {
    // mean=2, stddev = sqrt((1+0+1)/3) = sqrt(2/3) ~ 0.8165
    // z = (3 - 2) / 0.8165 ~ 1.2247
    const result = zScore([1, 2, 3], 3);
    expect(result).toHaveLength(1);
    expect(result[0]).toBeCloseTo(1 / Math.sqrt(2 / 3), 5);
  });
});
