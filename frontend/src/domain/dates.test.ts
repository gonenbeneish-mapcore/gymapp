import { describe, expect, it } from "vitest";
import { dateLabel, fromDateInput, toDateInput } from "./dates";

describe("date field helpers", () => {
  it("round-trips local dates", () => {
    expect(toDateInput(new Date(2026, 10, 12, 23, 59).getTime())).toBe("2026-11-12");
    expect(fromDateInput("2026-01-05").getDate()).toBe(5);
  });

  it("labels today, yesterday, this year and other years", () => {
    expect(dateLabel("2026-11-12", "2026-11-12")).toMatch(/^Today · /);
    expect(dateLabel("2026-11-11", "2026-11-12")).toMatch(/^Yesterday · /);
    expect(dateLabel("2026-03-01", "2026-03-02")).toMatch(/^Yesterday/);
    expect(dateLabel("2026-01-01", "2026-01-02")).toMatch(/^Yesterday/);
    expect(dateLabel("2025-12-31", "2026-01-01")).toMatch(/^Yesterday/);
    expect(dateLabel("2026-11-03", "2026-11-12")).not.toMatch(/Today|Yesterday|2026/);
    expect(dateLabel("2025-11-03", "2026-11-12")).toMatch(/2025/);
  });
});
