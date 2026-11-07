import type { Session } from "../data/types";

export type SetRef = { kg: number; reps: number; at: number };

export type ExerciseHistory = {
  /** Finished workouts that included at least one done set of this exercise. */
  times: number;
  /** Heaviest done set last time (ties go to more reps). */
  last?: SetRef;
  /** Heaviest done set ever (ties go to more reps, then the earliest). */
  best?: SetRef;
};

function better(a: SetRef, b: SetRef | undefined) {
  return !b || a.kg > b.kg || (a.kg === b.kg && a.reps > b.reps);
}

/** What the user has done with one exercise. Warm-up sets don't count. */
export function exerciseHistory(exerciseId: string, completed: Session[]): ExerciseHistory {
  const sorted = [...completed].sort((a, b) => a.startedAt - b.startedAt);
  const out: ExerciseHistory = { times: 0 };
  for (const s of sorted) {
    let top: SetRef | undefined;
    for (const x of s.exercises) {
      if (x.exerciseId !== exerciseId) continue;
      for (const set of x.sets) {
        if (!set.done || set.type === "warmup") continue;
        const ref = { kg: set.kg, reps: set.reps, at: s.startedAt };
        if (better(ref, top)) top = ref;
      }
    }
    if (!top) continue;
    out.times += 1;
    out.last = top;
    if (better(top, out.best)) out.best = top;
  }
  return out;
}
