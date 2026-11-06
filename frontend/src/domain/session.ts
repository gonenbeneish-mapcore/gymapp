import type { Session, SessionExercise, SessionSet, SetType, Workout } from "../data/types";

export const DEFAULT_REST_SECONDS = 90;

/** Done sets that count toward volume and records (warm-ups don't). */
export function workingSets(ex: SessionExercise): SessionSet[] {
  return ex.sets.filter((s) => s.done && s.type !== "warmup");
}

/** Most recent completed session (newest first list) that includes this exercise. */
export function lastPerformance(exerciseId: string, completedNewestFirst: Session[]): SessionExercise | undefined {
  for (const s of completedNewestFirst) {
    const ex = s.exercises.find((e) => e.exerciseId === exerciseId && e.sets.some((x) => x.done));
    if (ex) return ex;
  }
  return undefined;
}

/**
 * Build a new in-progress session from a workout plan. Each set starts with
 * what was actually done last time in that position (so the user just ticks),
 * falling back to the plan. Last time's numbers are also kept for the
 * "Previous" column.
 */
export function createSessionFromWorkout(
  workout: Workout,
  completedNewestFirst: Session[],
  id: string,
  now: number,
): Session {
  const exercises: SessionExercise[] = workout.exercises.map((we) => {
    const prev = lastPerformance(we.exerciseId, completedNewestFirst);
    const prevDone = prev?.sets.filter((s) => s.done) ?? [];
    return {
      exerciseId: we.exerciseId,
      restSeconds: we.restSeconds ?? workout.restSeconds ?? DEFAULT_REST_SECONDS,
      sets: we.sets.map((planned, i) => {
        const p = prevDone[i];
        return {
          kg: p?.kg ?? planned.kg,
          reps: p?.reps ?? planned.reps,
          type: planned.type ?? p?.type ?? "normal",
          done: false,
          prevKg: p?.kg,
          prevReps: p?.reps,
        };
      }),
    };
  });
  return {
    id,
    workoutId: workout.id,
    name: workout.name,
    startedAt: now,
    currentIndex: 0,
    restEndsAt: null,
    exercises,
  };
}

/* ---------- edits (all return a new session) ---------- */

function mapSet(
  s: Session,
  exIndex: number,
  setIndex: number,
  fn: (set: SessionSet) => SessionSet,
): Session {
  return {
    ...s,
    exercises: s.exercises.map((ex, i) =>
      i !== exIndex ? ex : { ...ex, sets: ex.sets.map((set, j) => (j === setIndex ? fn(set) : set)) },
    ),
  };
}

/** Tick or un-tick a set. Ticking starts the rest timer (not before a drop set). */
export function toggleSet(s: Session, exIndex: number, setIndex: number, now: number): Session {
  const ex = s.exercises[exIndex];
  const set = ex?.sets[setIndex];
  if (!ex || !set) return s;
  const done = !set.done;
  let next = mapSet(s, exIndex, setIndex, (x) => ({ ...x, done, doneAt: done ? now : undefined }));
  if (done) {
    const following = ex.sets[setIndex + 1];
    if (following?.type === "drop") {
      next = { ...next, restEndsAt: null };
    } else {
      const ms = ex.restSeconds * 1000;
      next = { ...next, restEndsAt: now + ms, restTotalMs: ms };
    }
  }
  return next;
}

export function editSet(
  s: Session,
  exIndex: number,
  setIndex: number,
  patch: Partial<Pick<SessionSet, "kg" | "reps" | "type">>,
): Session {
  return mapSet(s, exIndex, setIndex, (x) => ({ ...x, ...patch }));
}

const TYPE_CYCLE: SetType[] = ["normal", "warmup", "drop", "failure"];
export function nextSetType(t: SetType): SetType {
  return TYPE_CYCLE[(TYPE_CYCLE.indexOf(t) + 1) % TYPE_CYCLE.length];
}

/** Append a set that copies the last one's numbers. */
export function addSet(s: Session, exIndex: number): Session {
  return {
    ...s,
    exercises: s.exercises.map((ex, i) => {
      if (i !== exIndex) return ex;
      const last = ex.sets[ex.sets.length - 1];
      const set: SessionSet = { kg: last?.kg ?? 0, reps: last?.reps ?? 10, type: "normal", done: false };
      return { ...ex, sets: [...ex.sets, set] };
    }),
  };
}

export function removeSet(s: Session, exIndex: number, setIndex: number): Session {
  return {
    ...s,
    exercises: s.exercises.map((ex, i) =>
      i !== exIndex || ex.sets.length <= 1 ? ex : { ...ex, sets: ex.sets.filter((_, j) => j !== setIndex) },
    ),
  };
}

export function adjustRest(s: Session, deltaMs: number, now: number): Session {
  if (s.restEndsAt == null) return s;
  const end = Math.max(now, s.restEndsAt + deltaMs);
  return { ...s, restEndsAt: end, restTotalMs: Math.max(s.restTotalMs ?? 0, end - now) };
}

export function isExerciseComplete(ex: SessionExercise): boolean {
  return ex.sets.length > 0 && ex.sets.every((x) => x.done);
}

/** Next unfinished exercise after `from`, wrapping around; -1 when all are done. */
export function nextOpenExercise(s: Session, from: number): number {
  const n = s.exercises.length;
  for (let k = 1; k <= n; k++) {
    const j = (from + k) % n;
    if (j !== from && !isExerciseComplete(s.exercises[j])) return j;
  }
  return -1;
}

/* ---------- summary ---------- */

export function volume(s: Session): number {
  return s.exercises.reduce((sum, ex) => sum + workingSets(ex).reduce((a, x) => a + x.kg * x.reps, 0), 0);
}

export function doneSetCount(s: Session): number {
  return s.exercises.reduce((n, ex) => n + ex.sets.filter((x) => x.done).length, 0);
}

function bestSet(sets: SessionSet[]): SessionSet | undefined {
  return sets.reduce<SessionSet | undefined>(
    (best, x) => (!best || x.kg > best.kg || (x.kg === best.kg && x.reps > best.reps) ? x : best),
    undefined,
  );
}

export type RecordResult = {
  exerciseId: string;
  kind: "heaviest" | "reps";
  kg: number;
  reps: number;
  previous: { kg: number; reps: number };
};

/**
 * Personal records in `s` compared with all earlier completed sessions.
 * First time doing an exercise is not a record (nothing to beat).
 */
export function findRecords(s: Session, earlier: Session[]): RecordResult[] {
  const out: RecordResult[] = [];
  for (const ex of s.exercises) {
    const best = bestSet(workingSets(ex));
    if (!best) continue;
    const history = earlier.flatMap((e) =>
      e.exercises.filter((x) => x.exerciseId === ex.exerciseId).flatMap(workingSets),
    );
    const prevBest = bestSet(history);
    if (!prevBest) continue;
    if (best.kg > prevBest.kg) {
      out.push({ exerciseId: ex.exerciseId, kind: "heaviest", kg: best.kg, reps: best.reps, previous: { kg: prevBest.kg, reps: prevBest.reps } });
    } else if (best.kg === prevBest.kg && best.reps > prevBest.reps) {
      out.push({ exerciseId: ex.exerciseId, kind: "reps", kg: best.kg, reps: best.reps, previous: { kg: prevBest.kg, reps: prevBest.reps } });
    }
  }
  return out;
}

export type Comparison = { exerciseId: string; kg: number; reps: number; trend: "up" | "same" | "down" | "new" };

/** Best set per exercise vs the same exercise in `previous` (e.g. last time this workout was done). */
export function compareWith(s: Session, previous: Session | undefined): Comparison[] {
  return s.exercises.flatMap((ex) => {
    const best = bestSet(workingSets(ex));
    if (!best) return [];
    const prevEx = previous?.exercises.find((x) => x.exerciseId === ex.exerciseId);
    const prev = prevEx ? bestSet(workingSets(prevEx)) : undefined;
    let trend: Comparison["trend"] = "new";
    if (prev) {
      const a = best.kg * 1000 + best.reps;
      const b = prev.kg * 1000 + prev.reps;
      trend = a > b ? "up" : a < b ? "down" : "same";
    }
    return [{ exerciseId: ex.exerciseId, kg: best.kg, reps: best.reps, trend }];
  });
}

/* ---------- planning ---------- */

/** The workout after the one done most recently (in plan order); first plan if none done yet. */
export function nextWorkout(workouts: Workout[], completedNewestFirst: Session[]): Workout | undefined {
  const sorted = [...workouts].sort((a, b) => a.order - b.order);
  if (sorted.length === 0) return undefined;
  const lastWithPlan = completedNewestFirst.find((s) => s.workoutId && sorted.some((w) => w.id === s.workoutId));
  if (!lastWithPlan) return sorted[0];
  const idx = sorted.findIndex((w) => w.id === lastWithPlan.workoutId);
  return sorted[(idx + 1) % sorted.length];
}

/** Monday-start week containing `now`, as local-midnight timestamps. */
export function weekDays(now: Date): Date[] {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const mondayOffset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, i) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + i));
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
