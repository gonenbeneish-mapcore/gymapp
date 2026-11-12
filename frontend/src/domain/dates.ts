/** "2026-11-12" for a local date. */
export function toDateInput(at: number): string {
  const d = new Date(at);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local date from "2026-11-12". */
export function fromDateInput(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "Today · Thu 12 Nov", "Yesterday · Wed 11 Nov", "Mon 3 Nov", or "3 Nov 2025" for another year. */
export function dateLabel(value: string, today: string): string {
  const date = fromDateInput(value);
  const t = fromDateInput(today);
  const yesterday = toDateInput(new Date(t.getFullYear(), t.getMonth(), t.getDate() - 1).getTime());
  const pretty = date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  if (value === today) return `Today · ${pretty}`;
  if (value === yesterday) return `Yesterday · ${pretty}`;
  if (date.getFullYear() !== t.getFullYear()) {
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  return pretty;
}
