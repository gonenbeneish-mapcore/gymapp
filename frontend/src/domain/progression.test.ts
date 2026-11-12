import { describe, expect, it } from "vitest";
import type { SessionExercise, SessionSet } from "../data/types";
import { addWeightHint, nextWeight } from "./progression";

const set = (kg: number, reps: number, extra: Partial<SessionSet> = {}): SessionSet => ({
  kg,
  reps,
  type: "normal",
  done: true,
  ...extra,
});
const ex = (sets: SessionSet[]): SessionExercise => ({ key: "k", exerciseId: "chest-press", restSeconds: 90, sets });
const free = { equipment: "free" as const };

// Today's plan: 3 × 8–12 at 45 kg, not started yet.
const today = ex([0, 1, 2].map(() => set(45, 12, { done: false, targetReps: 8, targetRepsMax: 12 })));

describe("nextWeight", () => {
  it("adds 2.5 kg when nothing else is known", () => {
    expect(nextWeight(45, free)).toEqual({ kg: 47.5, how: "step" });
  });

  it("uses the machine's add-on lever when the plate size isn't known", () => {
    expect(nextWeight(45, { equipment: "machine", addOnKg: 2.5 })).toEqual({ kg: 47.5, how: "add-on" });
  });

  it("steps through real machine settings: plate, plate + add-on, next plate", () => {
    const vitality = { equipment: "machine" as const, plateKg: 5, addOnKg: 2.5, stackKg: 109 };
    expect(nextWeight(45, vitality)).toEqual({ kg: 47.5, how: "add-on" });
    expect(nextWeight(47.5, vitality)).toEqual({ kg: 50, how: "plate" });
    const noLever = { equipment: "machine" as const, plateKg: 4.5 };
    expect(nextWeight(45, noLever)).toEqual({ kg: 49.5, how: "plate" });
  });

  it("knows when you're at the top of the stack", () => {
    const stack = { equipment: "machine" as const, plateKg: 5, addOnKg: 2.5, stackKg: 77 };
    expect(nextWeight(75, stack)).toEqual({ kg: 77.5, how: "add-on" });
    expect(nextWeight(77.5, stack)).toEqual({ how: "top" });
    expect(nextWeight(90, { equipment: "machine", stackKg: 91 })).toEqual({ how: "top" });
  });

  it("has nothing for bodyweight or zero weight", () => {
    expect(nextWeight(0, free)).toBeNull();
    expect(nextWeight(10, { equipment: "bodyweight" })).toBeNull();
  });
});

describe("addWeightHint", () => {
  it("suggests the next weight when every work set hit the top of the range", () => {
    const last = ex([set(20, 15, { type: "warmup" }), set(45, 12), set(45, 13), set(45, 12)]);
    expect(addWeightHint(today, last, free)).toEqual({ lastKg: 45, topReps: 12, next: { kg: 47.5, how: "step" } });
  });

  it("stays quiet when a set fell short", () => {
    const last = ex([set(45, 12), set(45, 11), set(45, 10)]);
    expect(addWeightHint(today, last, free)).toBeNull();
  });

  it("stays quiet without a range, without history, or once today's weight is already higher", () => {
    const last = ex([set(45, 12), set(45, 12), set(45, 12)]);
    const fixed = ex([set(45, 10, { done: false, targetReps: 10 })]);
    expect(addWeightHint(fixed, last, free)).toBeNull();
    expect(addWeightHint(today, undefined, free)).toBeNull();
    const heavier = ex(today.sets.map((s) => ({ ...s, kg: 47.5 })));
    expect(addWeightHint(heavier, last, free)).toBeNull();
  });

  it("ignores unlogged sets, and says so when the stack is maxed out", () => {
    const partial = ex([set(45, 12), set(45, 12), set(45, 4, { done: false })]);
    expect(addWeightHint(today, partial, free)?.next).toEqual({ kg: 47.5, how: "step" });
    const bodyweight = ex([set(0, 15), set(0, 15)]);
    expect(addWeightHint(today, bodyweight, free)).toBeNull();
    const maxed = ex([set(45, 12), set(45, 12)]);
    expect(addWeightHint(today, maxed, { equipment: "machine", stackKg: 45 })?.next).toEqual({ how: "top" });
  });
});
