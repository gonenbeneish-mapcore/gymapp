/** 0:42, 12:05, 1:04:30 */
export function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return (h ? `${h}:` : "") + `${mm}:${String(sec).padStart(2, "0")}`;
}

/** Weights: 47.5, 50, 12.25 — no trailing zeros. */
export function kg(n: number): string {
  return String(Math.round(n * 100) / 100);
}

export function thousands(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function shortDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function minutes(ms: number): string {
  return `${Math.max(1, Math.round(ms / 60000))} min`;
}
