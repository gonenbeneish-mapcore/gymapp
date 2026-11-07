import { describe, expect, it } from "vitest";
import type { Session, SessionSet } from "../data/types";
import { exerciseHistory } from "./exerciseStats";

const set = (kg: number, reps: number, extra: Partial<SessionSet> = {}): SessionSet => ({
  kg,
  reps,
  type: "normal",
  done: true,
  ...extra,
});

const session = (startedAt: number, exerciseId: string, sets: SessionSet[]): Session => ({
  id: String(startedAt),
  name: "W",
  startedAt,
  endedAt: startedAt + 1,
  currentIndex: 0,
  exercises: [{ exerciseId, restSeconds: 90, sets }],
});

describe("exerciseHistory", () => {
  it("is empty when the exercise was never done", () => {
    expect(exerciseHistory("leg-press", [session(1, "chest-press", [set(40, 10)])])).toEqual({ times: 0 });
  });

  it("finds the last and best top sets", () => {
    const h = exerciseHistory("chest-press", [
      session(300, "chest-press", [set(45, 8), set(42.5, 10)]),
      session(100, "chest-press", [set(40, 10)]),
      session(200, "chest-press", [set(50, 6), set(50, 7)]),
    ]);
    expect(h.times).toBe(3);
    expect(h.last).toEqual({ kg: 45, reps: 8, at: 300 });
    expect(h.best).toEqual({ kg: 50, reps: 7, at: 200 });
  });

  it("ignores warm-ups and sets not done", () => {
    const h = exerciseHistory("chest-press", [
      session(100, "chest-press", [set(60, 5, { type: "warmup" }), set(70, 5, { done: false }), set(40, 10)]),
      session(200, "chest-press", [set(80, 3, { done: false })]),
    ]);
    expect(h.times).toBe(1);
    expect(h.best).toEqual({ kg: 40, reps: 10, at: 100 });
  });
});
