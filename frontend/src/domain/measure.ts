import type { Measurement } from "../data/types";

export const DAY = 24 * 60 * 60 * 1000;

/** How much each new weigh-in moves the trend (an exponential moving average). */
const TREND_SMOOTHING = 0.1;

export type TrendPoint = { at: number; value: number; trend: number };

function dayKey(at: number): string {
  const d = new Date(at);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * One reading per calendar day (the lowest that day, usually the morning one), oldest first, each with
 * the smoothed trend. Daily scale weight jumps around by a kilo or more from
 * water and food; the trend shows where it is really heading.
 */
export function trendSeries(entries: Measurement[]): TrendPoint[] {
  const byDay = new Map<string, Measurement>();
  for (const e of [...entries].sort((a, b) => a.at - b.at)) {
    const key = dayKey(e.at);
    const kept = byDay.get(key);
    if (!kept || e.value < kept.value) byDay.set(key, e);
  }
  const out: TrendPoint[] = [];
  let trend: number | undefined;
  for (const e of byDay.values()) {
    trend = trend === undefined ? e.value : trend + TREND_SMOOTHING * (e.value - trend);
    out.push({ at: e.at, value: e.value, trend });
  }
  return out;
}

/** Trend as it stood at time `t` (last point on or before it). */
export function trendAt(series: TrendPoint[], t: number): number | undefined {
  let found: number | undefined;
  for (const p of series) {
    if (p.at > t) break;
    found = p.trend;
  }
  return found;
}

/**
 * Trend change per week over the last four weeks (or since the first weigh-in,
 * if that is at least two weeks ago). `null` until there are two weeks of data.
 */
export function weeklyRate(series: TrendPoint[], now: number): number | null {
  if (series.length < 2) return null;
  const last = series[series.length - 1];
  const first = series[0];
  const windowStart = Math.max(now - 28 * DAY, first.at);
  if (last.at - windowStart < 14 * DAY) return null;
  const base = trendAt(series, windowStart);
  if (base === undefined) return null;
  return ((last.trend - base) / (last.at - windowStart)) * 7 * DAY;
}

/** Trend change over the last `days` days; `null` if there is no reading that old. */
export function changeOver(series: TrendPoint[], now: number, days: number): number | null {
  if (!series.length) return null;
  const base = trendAt(series, now - days * DAY);
  return base === undefined ? null : series[series.length - 1].trend - base;
}

/**
 * Change between the latest reading and the last one taken at least `days` ago.
 * For occasional measurements (like waist) where a smoothed trend would hide real change.
 */
export function readingChangeOver(entries: Measurement[], now: number, days: number): number | null {
  const sorted = [...entries].sort((a, b) => a.at - b.at);
  const last = sorted[sorted.length - 1];
  const base = sorted.filter((e) => e.at <= now - days * DAY).at(-1);
  return last && base ? last.value - base.value : null;
}

/** 0–100: how far the trend has moved from the first weigh-in toward the goal. Works for losing or gaining. */
export function goalProgress(start: number, current: number, goal: number): number {
  if (start === goal) return 100;
  const pct = ((start - current) / (start - goal)) * 100;
  return Math.max(0, Math.min(100, pct));
}

/** When the goal would be reached at the current weekly rate; `null` if not heading toward it. */
export function goalEta(current: number, goal: number, ratePerWeek: number | null, now: number): number | null {
  if (ratePerWeek === null || ratePerWeek === 0) return null;
  const weeks = (goal - current) / ratePerWeek;
  if (weeks <= 0 || weeks > 520) return null;
  return now + weeks * 7 * DAY;
}

export function bmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiCategory(b: number): string {
  if (b < 18.5) return "Underweight";
  if (b < 25) return "Healthy range";
  if (b < 30) return "Overweight range";
  return "Obese range";
}

export function waistToHeight(waistCm: number, heightCm: number): number {
  return waistCm / heightCm;
}

/** Average of the readings in the last `days` days; `null` if none. */
export function averageSince(series: TrendPoint[], now: number, days: number): number | null {
  const recent = series.filter((p) => p.at >= now - days * DAY);
  return recent.length ? recent.reduce((a, p) => a + p.value, 0) / recent.length : null;
}

/** Lowest reading in the last `days` days; `null` if none. */
export function lowestSince(series: TrendPoint[], now: number, days: number): TrendPoint | null {
  return series
    .filter((p) => p.at >= now - days * DAY)
    .reduce<TrendPoint | null>((lo, p) => (!lo || p.value < lo.value ? p : lo), null);
}

/** Signed with a real minus sign and one decimal: "+0.4", "−1.2", "0.0". */
export function signed(n: number, decimals = 1): string {
  const r = Number(Math.abs(n).toFixed(decimals));
  if (r === 0) return (0).toFixed(decimals);
  return (n < 0 ? "−" : "+") + r.toFixed(decimals);
}
