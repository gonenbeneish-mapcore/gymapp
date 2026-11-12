import { describe, expect, it } from "vitest";
import type { Session, Workout } from "../data/types";
import {
  addSet,
  applyWeight,
  adjustRest,
  compareWith,
  createSessionFromWorkout,
  findRecords,
  withEntryKeys,
  nextOpenExercise,
  nextSetType,
  nextWorkout,
  toggleSet,
  volume,
  weekDays,
} from "./session";

const plan = (id: string, name: string, order: number): Workout => ({
  id,
  name,
  order,
  restSeconds: 90,
  createdAt: 0,
  exercises: [
    { exerciseId: "chest-press", sets: [{ kg: 45, reps: 10 }, { kg: 45, reps: 10 }] },
    { exerciseId: "pec-fly", restSeconds: 60, sets: [{ kg: 35, reps: 12 }] },
  ],
});

function done(id: string, workoutId: string, at: number, chest: [number, number][]): Session {
  return {
    id,
    workoutId,
    name: "x",
    startedAt: at,
    endedAt: at + 1000,
    currentIndex: 0,
    exercises: [
      {
        key: `${id}:0`,
        exerciseId: "chest-press",
        restSeconds: 90,
        sets: chest.map(([kg, reps]) => ({ kg, reps, type: "normal", done: true })),
      },
    ],
  };
}

describe("createSessionFromWorkout", () => {
  it("uses the plan when there is no history", () => {
    const s = createSessionFromWorkout(plan("w1", "Push", 0), [], "s1", 100);
    expect(s.exercises[0].sets[0]).toMatchObject({ kg: 45, reps: 10, done: false, prevKg: undefined });
    expect(s.exercises[1].restSeconds).toBe(60);
    expect(s.exercises[0].restSeconds).toBe(90);
  });

  it("pre-fills from last time and keeps it as Previous", () => {
    const history = [done("old", "w1", 50, [[47.5, 9], [47.5, 8]])];
    const s = createSessionFromWorkout(plan("w1", "Push", 0), history, "s1", 100);
    expect(s.exercises[0].sets[0]).toMatchObject({ kg: 47.5, reps: 9, prevKg: 47.5, prevReps: 9 });
    expect(s.exercises[0].sets[1]).toMatchObject({ kg: 47.5, reps: 8 });
    // exercise never done before → plan values
    expect(s.exercises[1].sets[0]).toMatchObject({ kg: 35, reps: 12, prevKg: undefined });
  });

  it("keeps the plan's numbers as each set's target, even when pre-filled from last time", () => {
    const history = [done("old", "w1", 50, [[47.5, 9]])];
    const s = createSessionFromWorkout(plan("w1", "Push", 0), history, "s1", 100);
    expect(s.exercises[0].sets[0]).toMatchObject({ kg: 47.5, targetKg: 45, targetReps: 10 });
    expect(s.exercises[1].sets[0]).toMatchObject({ targetKg: 35, targetReps: 12 });
  });

  it("gives every exercise a unique key", () => {
    const s = createSessionFromWorkout(plan("w1", "Push", 0), [], "s1", 100);
    expect(s.exercises.map((e) => e.key)).toEqual(["s1:0", "s1:1"]);
  });
});

describe("withEntryKeys", () => {
  it("adds keys to old sessions and keeps existing ones", () => {
    const old = { id: "s9", exercises: [{ exerciseId: "a" }, { key: "keep", exerciseId: "b" }] };
    expect(withEntryKeys(old).exercises.map((e) => e.key)).toEqual(["s9:0", "keep"]);
  });

  it("never leaves two exercises with the same key", () => {
    const clash = { id: "s9", exercises: [{ key: "s9:1" }, {}, { key: "s9:1" }] };
    const keys = withEntryKeys(clash).exercises.map((e) => e.key);
    expect(new Set(keys).size).toBe(3);
  });
});

describe("toggleSet and rest", () => {
  const base = createSessionFromWorkout(plan("w1", "Push", 0), [], "s1", 0);

  it("starts the exercise's rest when a set is ticked", () => {
    const s = toggleSet(base, 1, 0, 1000);
    expect(s.exercises[1].sets[0].done).toBe(true);
    expect(s.restEndsAt).toBe(61000);
  });

  it("does not start rest before a drop set", () => {
    const withDrop = { ...base, exercises: base.exercises.map((e, i) => (i === 0 ? { ...e, sets: [e.sets[0], { ...e.sets[1], type: "drop" as const }] } : e)) };
    const s = toggleSet(withDrop, 0, 0, 1000);
    expect(s.restEndsAt).toBeNull();
  });

  it("un-ticking clears doneAt and keeps the timer", () => {
    const a = toggleSet(base, 0, 0, 1000);
    const b = toggleSet(a, 0, 0, 2000);
    expect(b.exercises[0].sets[0]).toMatchObject({ done: false, doneAt: undefined });
    expect(b.restEndsAt).toBe(a.restEndsAt);
  });

  it("adjustRest never goes below now", () => {
    const a = toggleSet(base, 0, 0, 0); // ends at 90s
    expect(adjustRest(a, -15000, 0).restEndsAt).toBe(75000);
    expect(adjustRest(a, -200000, 10000).restEndsAt).toBe(10000);
  });

  it("adjustRest adds time from now once the rest has run out", () => {
    const a = toggleSet(base, 0, 0, 0); // ends at 90s
    expect(adjustRest(a, 15000, 100000).restEndsAt).toBe(115000);
    expect(adjustRest(a, 15000, 80000).restEndsAt).toBe(105000);
  });
});

describe("addSet / set types / navigation", () => {
  const base = createSessionFromWorkout(plan("w1", "Push", 0), [], "s1", 0);
  it("adds a copy of the last set", () => {
    const s = addSet(base, 0);
    expect(s.exercises[0].sets).toHaveLength(3);
    expect(s.exercises[0].sets[2]).toMatchObject({ kg: 45, reps: 10, done: false, type: "normal" });
  });
  it("cycles set types", () => {
    expect(nextSetType("normal")).toBe("warmup");
    expect(nextSetType("failure")).toBe("normal");
  });
  it("finds the next unfinished exercise", () => {
    let s = toggleSet(base, 1, 0, 0); // second exercise complete
    expect(nextOpenExercise(s, 1)).toBe(0);
    expect(nextOpenExercise(s, 0)).toBe(-1); // only the current one is left
    s = toggleSet(toggleSet(s, 0, 0, 0), 0, 1, 0);
    expect(nextOpenExercise(s, 1)).toBe(-1);
  });
});

describe("summary", () => {
  it("volume ignores warm-ups and unticked sets", () => {
    const s = done("a", "w1", 0, [[40, 10], [50, 5]]);
    s.exercises[0].sets[0].type = "warmup";
    s.exercises[0].sets.push({ kg: 100, reps: 10, type: "normal", done: false });
    expect(volume(s)).toBe(250);
  });

  it("finds heaviest-set and more-reps records, not first-time ones", () => {
    const earlier = [done("a", "w1", 0, [[47.5, 9]])];
    expect(findRecords(done("b", "w1", 1, [[50, 8]]), earlier)[0]).toMatchObject({ kind: "heaviest", kg: 50, previous: { kg: 47.5, reps: 9 } });
    expect(findRecords(done("c", "w1", 1, [[47.5, 10]]), earlier)[0]).toMatchObject({ kind: "reps" });
    expect(findRecords(done("d", "w1", 1, [[45, 12]]), earlier)).toHaveLength(0);
    expect(findRecords(done("e", "w1", 1, [[60, 1]]), [])).toHaveLength(0);
  });

  it("compares best set with last time", () => {
    const prev = done("a", "w1", 0, [[47.5, 9]]);
    expect(compareWith(done("b", "w1", 1, [[50, 8]]), prev)[0].trend).toBe("up");
    expect(compareWith(done("b", "w1", 1, [[47.5, 9]]), prev)[0].trend).toBe("same");
    expect(compareWith(done("b", "w1", 1, [[45, 9]]), prev)[0].trend).toBe("down");
    expect(compareWith(done("b", "w1", 1, [[45, 9]]), undefined)[0].trend).toBe("new");
  });
});

describe("planning", () => {
  const ws = [plan("p", "Push", 0), plan("l", "Pull", 1), plan("g", "Legs", 2)];
  it("rotates to the plan after the last one done", () => {
    expect(nextWorkout(ws, [])?.id).toBe("p");
    expect(nextWorkout(ws, [done("x", "l", 5, [[1, 1]])])?.id).toBe("g");
    expect(nextWorkout(ws, [done("x", "g", 5, [[1, 1]])])?.id).toBe("p");
  });

  it("weeks start on Monday", () => {
    const days = weekDays(new Date(2026, 10, 6)); // Friday 6 Nov 2026
    expect(days[0].getDate()).toBe(2);
    expect(days[0].getDay()).toBe(1);
    expect(days[6].getDate()).toBe(8);
  });
});

describe("applyWeight", () => {
  it("changes only work sets that aren't done yet", () => {
    const s0 = createSessionFromWorkout(plan("w1", "Push", 0), [], "s1", 0);
    const warm = { ...s0, exercises: s0.exercises.map((e, i) => (i === 0 ? { ...e, sets: [{ ...e.sets[0], type: "warmup" as const }, e.sets[1]] } : e)) };
    const ticked = toggleSet(warm, 0, 1, 0);
    const added = addSet(ticked, 0);
    const s = applyWeight(added, 0, 47.5);
    expect(s.exercises[0].sets.map((x) => x.kg)).toEqual([45, 45, 47.5]);
    expect(s.exercises[1].sets[0].kg).toBe(35);
  });
});
