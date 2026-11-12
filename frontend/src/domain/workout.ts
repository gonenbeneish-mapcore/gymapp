import type { PlannedSet, Session, Workout, WorkoutExercise } from "../data/types";
import { lastPerformance } from "./session";

/** Edits to a workout plan. Each returns a new workout and leaves the input untouched. */

export const DEFAULT_SETS = 3;
export const DEFAULT_REPS = 10;
export const REST_CHOICES = [30, 45, 60, 90, 120, 150, 180, 240];

export function newWorkout(id: string, name: string, order: number, now: number): Workout {
  return { id, name, order, restSeconds: 90, createdAt: now, exercises: [] };
}

export function renameWorkout(w: Workout, name: string): Workout {
  return { ...w, name };
}

/**
 * Add an exercise at the end. Its sets start from what you last did on it
 * (so a new plan begins at your real weights), otherwise 3 × 10 at 0 kg.
 */
export function addExercise(w: Workout, exerciseId: string, completedNewestFirst: Session[] = []): Workout {
  const last = lastPerformance(exerciseId, completedNewestFirst)?.sets.filter((s) => s.done && s.type !== "warmup");
  const sets: PlannedSet[] = last?.length
    ? last.map((s) => ({ kg: s.kg, reps: s.reps }))
    : Array.from({ length: DEFAULT_SETS }, () => ({ kg: 0, reps: DEFAULT_REPS }));
  return { ...w, exercises: [...w.exercises, { exerciseId, sets }] };
}

export function removeExercise(w: Workout, index: number): Workout {
  return { ...w, exercises: w.exercises.filter((_, i) => i !== index) };
}

/** Move an exercise up (-1) or down (+1); does nothing at the ends. */
export function moveExercise(w: Workout, index: number, delta: -1 | 1): Workout {
  const to = index + delta;
  if (to < 0 || to >= w.exercises.length) return w;
  const exercises = [...w.exercises];
  [exercises[index], exercises[to]] = [exercises[to], exercises[index]];
  return { ...w, exercises };
}

function mapExercise(w: Workout, index: number, fn: (x: WorkoutExercise) => WorkoutExercise): Workout {
  return { ...w, exercises: w.exercises.map((x, i) => (i === index ? fn(x) : x)) };
}

/** Add a set that copies the last one. */
export function addPlannedSet(w: Workout, exIndex: number): Workout {
  return mapExercise(w, exIndex, (x) => {
    const last = x.sets[x.sets.length - 1] ?? { kg: 0, reps: DEFAULT_REPS };
    return { ...x, sets: [...x.sets, { kg: last.kg, reps: last.reps }] };
  });
}

/** Remove a set; an exercise always keeps at least one. */
export function removePlannedSet(w: Workout, exIndex: number, setIndex: number): Workout {
  return mapExercise(w, exIndex, (x) =>
    x.sets.length <= 1 ? x : { ...x, sets: x.sets.filter((_, j) => j !== setIndex) },
  );
}

export function editPlannedSet(w: Workout, exIndex: number, setIndex: number, patch: Partial<PlannedSet>): Workout {
  return mapExercise(w, exIndex, (x) => ({
    ...x,
    sets: x.sets.map((s, j) => (j === setIndex ? { ...s, ...patch } : s)),
  }));
}

/** Rest after each set of this exercise; `undefined` = the workout's default. */
export function setExerciseRest(w: Workout, exIndex: number, seconds: number | undefined): Workout {
  return mapExercise(w, exIndex, (x) => ({ ...x, restSeconds: seconds }));
}

export function setDefaultRest(w: Workout, seconds: number): Workout {
  return { ...w, restSeconds: seconds };
}

/** Common rep ranges offered in the editor. */
export const REP_RANGE_PRESETS: [number, number][] = [
  [5, 8],
  [6, 10],
  [8, 12],
  [10, 15],
  [12, 15],
  [15, 20],
];

/**
 * Give every work set (not warm-ups) of an exercise the same rep target:
 * a range `min`–`max`, or a fixed number when `max` is missing or not above `min`.
 */
export function setRepRange(w: Workout, exIndex: number, min: number, max?: number): Workout {
  const top = max !== undefined && max > min ? max : undefined;
  return mapExercise(w, exIndex, (x) => ({
    ...x,
    sets: x.sets.map((s) => {
      if (s.type === "warmup") return s;
      const next: PlannedSet = { ...s, reps: min };
      if (top === undefined) delete next.repsMax;
      else next.repsMax = top;
      return next;
    }),
  }));
}

/** "8–12" or "10". */
export function repsLabel(s: Pick<PlannedSet, "reps" | "repsMax">): string {
  return s.repsMax && s.repsMax > s.reps ? `${s.reps}–${s.repsMax}` : String(s.reps);
}

/** "8–12", "10", or "Mixed" when the sets differ. */
export function targetLabel(t: { min: number; max?: number } | null): string {
  if (!t) return "Mixed";
  return t.max && t.max > t.min ? `${t.min}–${t.max}` : String(t.min);
}

/** The work sets' shared rep target, if they all have the same one. */
export function sharedRepTarget(x: WorkoutExercise): { min: number; max?: number } | null {
  const work = x.sets.filter((s) => s.type !== "warmup");
  if (!work.length) return null;
  const first = work[0];
  const same = work.every((s) => s.reps === first.reps && (s.repsMax ?? 0) === (first.repsMax ?? 0));
  return same ? { min: first.reps, max: first.repsMax } : null;
}

export function totalSets(w: Workout): number {
  return w.exercises.reduce((n, x) => n + x.sets.length, 0);
}

/** "3 × 12 · 30 kg", or "3 sets · 8–12 reps · 20–25 kg" when the sets differ. */
export function exerciseSummary(x: WorkoutExercise): string {
  const n = x.sets.length;
  const reps = x.sets.map((s) => s.reps);
  const kgs = x.sets.map((s) => s.kg);
  const range = (v: number[], unit = "") => {
    const lo = Math.min(...v);
    const hi = Math.max(...v);
    return (lo === hi ? fmt(lo) : `${fmt(lo)}–${fmt(hi)}`) + unit;
  };
  const weight = Math.max(...kgs) > 0 ? ` · ${range(kgs, " kg")}` : "";
  const target = sharedRepTarget(x);
  if (target && x.sets.every((s) => s.type !== "warmup")) return `${n} × ${repsLabel({ reps: target.min, repsMax: target.max })}${weight}`;
  const sameReps = Math.min(...reps) === Math.max(...reps);
  if (sameReps) return `${n} × ${reps[0]}${weight}`;
  return `${n} sets · ${range(reps)} reps${weight}`;
}

/** "1:30", "2:00", "0:45" */
export function restLabel(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function fmt(n: number): string {
  return String(Math.round(n * 100) / 100);
}
