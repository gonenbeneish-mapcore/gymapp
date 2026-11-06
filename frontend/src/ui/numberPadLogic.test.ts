import { describe, expect, it } from "vitest";
import { pressKey, stepValue } from "./numberPadLogic";

describe("pressKey", () => {
  const opts = { decimals: 1, maxInt: 3 };
  it("first key replaces the value", () => {
    expect(pressKey("47.5", "5", true, opts)).toBe("5");
  });
  it("limits decimals and integer digits", () => {
    expect(pressKey("52.5", "9", false, opts)).toBe("52.5");
    expect(pressKey("123", "4", false, opts)).toBe("123");
    expect(pressKey("52", ".", false, opts)).toBe("52.");
    expect(pressKey("52.", ".", false, opts)).toBe("52.");
  });
  it("whole numbers when decimals is 0", () => {
    expect(pressKey("12", ".", false, { decimals: 0 })).toBe("12");
  });
  it("delete", () => {
    expect(pressKey("52.5", "del", false, opts)).toBe("52.");
    expect(pressKey("52.5", "del", true, opts)).toBe("");
  });
});

describe("stepValue", () => {
  it("steps and never goes below zero", () => {
    expect(stepValue("47.5", 2.5)).toBe("50");
    expect(stepValue("1", -2.5)).toBe("0");
    expect(stepValue("10", 1, 0)).toBe("11");
  });
});
