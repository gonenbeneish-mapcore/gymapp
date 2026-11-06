import { describe, expect, it } from "vitest";
import { backupAge, backupIsDue } from "./backupActions";

const day = 86_400_000;
const now = new Date(2026, 10, 6, 12).getTime();

describe("backupAge", () => {
  it("reads naturally", () => {
    expect(backupAge(undefined, now)).toBe("never");
    expect(backupAge(now - 60_000, now)).toBe("today");
    expect(backupAge(now - day, now)).toBe("yesterday");
    expect(backupAge(now - 5 * day, now)).toBe("5 days ago");
    expect(backupAge(now - 60 * day, now)).toMatch(/2026/);
  });
});

describe("backupIsDue", () => {
  it("only nags once there is something to lose", () => {
    expect(backupIsDue(undefined, 0, now)).toBe(false);
    expect(backupIsDue(undefined, 1, now)).toBe(true);
    expect(backupIsDue(now - 3 * day, 5, now)).toBe(false);
    expect(backupIsDue(now - 8 * day, 5, now)).toBe(true);
  });
});
