export type NumberPadOptions = {
  /** Max digits after the decimal point (0 = whole numbers only). */
  decimals?: number;
  /** Max digits before the decimal point. */
  maxInt?: number;
  /** Amount the − / + buttons change the value by. */
  step?: number;
};

/** Pure reducer for key presses, exported for tests. */
export function pressKey(
  current: string,
  key: string,
  fresh: boolean,
  { decimals = 1, maxInt = 3 }: NumberPadOptions,
): string {
  if (key === "del") return fresh ? "" : current.slice(0, -1);
  const base = fresh ? "" : current;
  if (key === ".") {
    if (decimals === 0 || base.includes(".")) return base;
    return (base || "0") + ".";
  }
  const dot = base.indexOf(".");
  if (dot !== -1 && base.length - dot - 1 >= decimals) return base;
  if (dot === -1 && base.replace(/^0+/, "").length >= maxInt) return base;
  const next = base === "0" ? key : base + key;
  return next;
}

export function stepValue(current: string, delta: number, decimals = 1): string {
  const n = Number.parseFloat(current) || 0;
  const v = Math.max(0, Math.round((n + delta) * 10 ** decimals) / 10 ** decimals);
  return decimals ? v.toFixed(decimals).replace(/\.0+$/, "") : String(Math.round(v));
}
