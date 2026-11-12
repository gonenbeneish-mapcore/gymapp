import { describe, expect, it } from "vitest";
import type { Measurement } from "../data/types";
import {
  DAY,
  averageSince,
  bmi,
  bmiCategory,
  changeOver,
  goalEta,
  goalProgress,
  readingChangeOver,
  lowestSince,
  signed,
  trendAt,
  trendSeries,
  waistToHeight,
  weeklyRate,
} from "./measure";

const T0 = new Date(2026, 0, 1, 7, 0).getTime();
const w = (day: number, value: number, hour = 7): Measurement => ({
  id: `${day}-${hour}`,
  kind: "weight",
  value,
  at: T0 + day * DAY + (hour - 7) * 60 * 60 * 1000,
});

describe("trendSeries", () => {
  it("starts at the first reading and moves 10% toward each new one", () => {
    const s = trendSeries([w(0, 80), w(1, 90)]);
    expect(s.map((p) => p.trend)).toEqual([80, 81]);
  });

  it("keeps the lowest reading of each day, oldest first", () => {
    const s = trendSeries([w(1, 79), w(0, 80, 7), w(0, 81, 20)]);
    expect(s.map((p) => p.value)).toEqual([80, 79]);
  });

  it("trendAt returns the trend as of a time", () => {
    const s = trendSeries([w(0, 80), w(10, 90)]);
    expect(trendAt(s, T0 - 1)).toBeUndefined();
    expect(trendAt(s, T0 + 5 * DAY)).toBe(80);
    expect(trendAt(s, T0 + 10 * DAY)).toBe(81);
  });
});

describe("rates and changes", () => {
  // Steady loss of 0.1 kg a day for 60 days.
  const steady = trendSeries(Array.from({ length: 61 }, (_, i) => w(i, 90 - i * 0.1)));
  const now = T0 + 60 * DAY;

  it("weekly rate follows a steady loss (trend lags but the slope matches)", () => {
    expect(weeklyRate(steady, now)).toBeCloseTo(-0.7, 1);
  });

  it("needs two weeks of weigh-ins before giving a rate", () => {
    const short = trendSeries([w(0, 80), w(10, 79)]);
    expect(weeklyRate(short, T0 + 10 * DAY)).toBeNull();
    expect(weeklyRate(trendSeries([w(0, 80)]), T0)).toBeNull();
  });

  it("change over 30 days uses the trend, not single readings", () => {
    const c = changeOver(steady, now, 30)!;
    expect(c).toBeLessThan(-2.5);
    expect(c).toBeGreaterThan(-3.1);
    expect(changeOver(steady, T0, 30)).toBeNull();
  });

  it("averages and lows look back from now", () => {
    expect(averageSince(steady, now, 2)).toBeCloseTo(84.1, 5);
    expect(lowestSince(steady, now, 90)?.value).toBeCloseTo(84, 5);
    expect(averageSince([], now, 7)).toBeNull();
  });
});

describe("readingChangeOver", () => {
  it("compares actual readings, so a 2 cm drop shows as 2 cm", () => {
    const waist = [w(0, 93), w(38, 91)].map((m) => ({ ...m, kind: "waist" as const }));
    expect(readingChangeOver(waist, T0 + 40 * DAY, 30)).toBe(-2);
    expect(readingChangeOver(waist, T0 + 20 * DAY, 30)).toBeNull();
  });
});

describe("goal", () => {
  it("progress works for losing and gaining and is clamped", () => {
    expect(goalProgress(90, 85, 80)).toBe(50);
    expect(goalProgress(70, 72, 75)).toBe(40);
    expect(goalProgress(90, 92, 80)).toBe(0);
    expect(goalProgress(90, 78, 80)).toBe(100);
  });

  it("estimates when the goal is reached only when heading toward it", () => {
    expect(goalEta(85, 80, -0.5, 0)).toBe(10 * 7 * DAY);
    expect(goalEta(85, 80, 0.5, 0)).toBeNull();
    expect(goalEta(85, 80, null, 0)).toBeNull();
    expect(goalEta(85, 80, 0, 0)).toBeNull();
  });
});

describe("body numbers", () => {
  it("BMI and its category", () => {
    expect(bmi(81, 180)).toBeCloseTo(25, 5);
    expect(bmiCategory(24.9)).toBe("Healthy range");
    expect(bmiCategory(25)).toBe("Overweight range");
    expect(bmiCategory(17)).toBe("Underweight");
    expect(bmiCategory(31)).toBe("Obese range");
  });

  it("waist-to-height", () => {
    expect(waistToHeight(90, 180)).toBe(0.5);
  });

  it("signed numbers use a real minus and drop the sign at zero", () => {
    expect(signed(-1.24)).toBe("−1.2");
    expect(signed(0.45)).toBe("+0.5");
    expect(signed(-0.04)).toBe("0.0");
    expect(signed(-0.123, 2)).toBe("−0.12");
  });
});
