import { describe, expect, it } from "vitest";
import type { Session, Workout } from "../data/types";
import {
  addExercise,
  addPlannedSet,
  editPlannedSet,
  exerciseSummary,
  moveExercise,
  newWorkout,
  removeExercise,
  removePlannedSet,
  renameWorkout,
  repsLabel,
  restLabel,
  setExerciseRest,
  setRepRange,
  sharedRepTarget,
  totalSets,
} from "./workout";

const base = (): Workout => ({
  ...newWorkout("w1", "Push", 0, 1),
  exercises: [
    { exerciseId: "chest-press", sets: [{ kg: 45, reps: 10 }, { kg: 45, reps: 10 }] },
    { exerciseId: "pec-fly", sets: [{ kg: 35, reps: 12 }] },
  ],
});

const doneSession = (exerciseId: string, sets: [number, number, boolean?][]): Session => ({
  id: "s",
  name: "x",
  startedAt: 1,
  endedAt: 2,
  currentIndex: 0,
  exercises: [
    {
      key: "s:0",
      exerciseId,
      restSeconds: 90,
      sets: sets.map(([kg, reps, warm]) => ({ kg, reps, type: warm ? "warmup" : "normal", done: true })),
    },
  ],
});

describe("workout edits", () => {
  it("never changes the original", () => {
    const w = base();
    const copy = structuredClone(w);
    removeExercise(moveExercise(addPlannedSet(w, 0), 0, 1), 1);
    expect(w).toEqual(copy);
  });

  it("adds a new exercise with 3 × 10 when it was never done", () => {
    const w = addExercise(base(), "lat-pulldown");
    expect(w.exercises.at(-1)).toEqual({
      exerciseId: "lat-pulldown",
      sets: [{ kg: 0, reps: 10 }, { kg: 0, reps: 10 }, { kg: 0, reps: 10 }],
    });
  });

  it("starts a new exercise from what you last did, skipping warm-ups", () => {
    const w = addExercise(base(), "lat-pulldown", [doneSession("lat-pulldown", [[20, 12, true], [50, 10], [52.5, 8]])]);
    expect(w.exercises.at(-1)?.sets).toEqual([{ kg: 50, reps: 10 }, { kg: 52.5, reps: 8 }]);
  });

  it("moves exercises up and down, and ignores moves past the ends", () => {
    const w = base();
    expect(moveExercise(w, 0, 1).exercises.map((x) => x.exerciseId)).toEqual(["pec-fly", "chest-press"]);
    expect(moveExercise(w, 0, -1)).toBe(w);
    expect(moveExercise(w, 1, 1)).toBe(w);
  });

  it("adds a set copying the last one and keeps at least one set", () => {
    const w = addPlannedSet(base(), 1);
    expect(w.exercises[1].sets).toEqual([{ kg: 35, reps: 12 }, { kg: 35, reps: 12 }]);
    const one = removePlannedSet(base(), 1, 0);
    expect(one.exercises[1].sets).toHaveLength(1);
    expect(removePlannedSet(base(), 0, 1).exercises[0].sets).toHaveLength(1);
  });

  it("edits one set, renames and sets rest", () => {
    let w = editPlannedSet(base(), 0, 1, { kg: 47.5, type: "drop" });
    expect(w.exercises[0].sets[1]).toEqual({ kg: 47.5, reps: 10, type: "drop" });
    expect(w.exercises[0].sets[0]).toEqual({ kg: 45, reps: 10 });
    w = setExerciseRest(renameWorkout(w, "Chest"), 0, 120);
    expect(w.name).toBe("Chest");
    expect(w.exercises[0].restSeconds).toBe(120);
    expect(totalSets(w)).toBe(3);
  });
});

describe("labels", () => {
  it("summarises an exercise's sets", () => {
    expect(exerciseSummary({ exerciseId: "x", sets: [{ kg: 30, reps: 12 }, { kg: 30, reps: 12 }] })).toBe("2 × 12 · 30 kg");
    expect(exerciseSummary({ exerciseId: "x", sets: [{ kg: 0, reps: 45 }] })).toBe("1 × 45");
    expect(
      exerciseSummary({ exerciseId: "x", sets: [{ kg: 45, reps: 10 }, { kg: 47.5, reps: 8 }] }),
    ).toBe("2 sets · 8–10 reps · 45–47.5 kg");
  });

  it("formats rest", () => {
    expect(restLabel(90)).toBe("1:30");
    expect(restLabel(45)).toBe("0:45");
    expect(restLabel(120)).toBe("2:00");
  });
});

describe("rep ranges", () => {
  it("sets a range on work sets only and can go back to a fixed number", () => {
    let w = editPlannedSet(base(), 0, 0, { type: "warmup", reps: 15 });
    w = setRepRange(w, 0, 8, 12);
    expect(w.exercises[0].sets).toEqual([
      { kg: 45, reps: 15, type: "warmup" },
      { kg: 45, reps: 8, repsMax: 12 },
    ]);
    w = setRepRange(w, 0, 10);
    expect(w.exercises[0].sets[1]).toEqual({ kg: 45, reps: 10 });
    expect(setRepRange(base(), 1, 12, 12).exercises[1].sets[0]).toEqual({ kg: 35, reps: 12 });
  });

  it("labels and summarises ranges", () => {
    expect(repsLabel({ reps: 8, repsMax: 12 })).toBe("8–12");
    expect(repsLabel({ reps: 10 })).toBe("10");
    const w = setRepRange(base(), 0, 8, 12);
    expect(sharedRepTarget(w.exercises[0])).toEqual({ min: 8, max: 12 });
    expect(exerciseSummary(w.exercises[0])).toBe("2 × 8–12 · 45 kg");
    const mixed = editPlannedSet(w, 0, 1, { reps: 6 });
    expect(sharedRepTarget(mixed.exercises[0])).toBeNull();
  });
});
