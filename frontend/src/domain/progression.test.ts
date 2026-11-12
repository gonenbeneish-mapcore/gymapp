import { describe, expect, it } from "vitest";
import type { SessionExercise, SessionSet } from "../data/types";
import { addWeightHint } from "./progression";

const set = (kg: number, reps: number, extra: Partial<SessionSet> = {}): SessionSet => ({
  kg,
  reps,
  type: "normal",
  done: true,
  ...extra,
});
const ex = (sets: SessionSet[]): SessionExercise => ({ key: "k", exerciseId: "chest-press", restSeconds: 90, sets });

// Today's plan: 3 × 8–12 at 45 kg, not started yet.
const today = ex([0, 1, 2].map(() => set(45, 12, { done: false, targetReps: 8, targetRepsMax: 12 })));

describe("addWeightHint", () => {
  it("suggests more weight when every work set hit the top of the range", () => {
    const last = ex([set(20, 15, { type: "warmup" }), set(45, 12), set(45, 13), set(45, 12)]);
    expect(addWeightHint(today, last, 2.5)).toEqual({ lastKg: 45, topReps: 12, suggestKg: 47.5 });
  });

  it("stays quiet when a set fell short", () => {
    const last = ex([set(45, 12), set(45, 11), set(45, 10)]);
    expect(addWeightHint(today, last, 2.5)).toBeNull();
  });

  it("stays quiet without a range, without history, or once today's weight is already higher", () => {
    const last = ex([set(45, 12), set(45, 12), set(45, 12)]);
    const fixed = ex([set(45, 10, { done: false, targetReps: 10 })]);
    expect(addWeightHint(fixed, last, 2.5)).toBeNull();
    expect(addWeightHint(today, undefined, 2.5)).toBeNull();
    const heavier = ex(today.sets.map((s) => ({ ...s, kg: 47.5 })));
    expect(addWeightHint(heavier, last, 2.5)).toBeNull();
  });

  it("ignores sets that weren't logged and bodyweight work", () => {
    const partial = ex([set(45, 12), set(45, 12), set(45, 4, { done: false })]);
    expect(addWeightHint(today, partial, 2.5)?.suggestKg).toBe(47.5);
    const bodyweight = ex([set(0, 15), set(0, 15)]);
    expect(addWeightHint(today, bodyweight, 2.5)).toBeNull();
    expect(addWeightHint(today, partial, 0)).toBeNull();
  });
});
