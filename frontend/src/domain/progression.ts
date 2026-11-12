import type { Equipment, SessionExercise } from "../data/types";

/** How much to add when it's time to go heavier. Machines step by their plates; 2.5 kg is a safe default everywhere. */
export const WEIGHT_STEP: Record<Equipment, number> = { machine: 2.5, free: 2.5, cable: 2.5, bodyweight: 0 };

export type AddWeightHint = { lastKg: number; topReps: number; suggestKg: number };

const isWork = (type: string) => type !== "warmup";

/**
 * Double progression: when last time every work set reached the top of the rep
 * range, suggest adding weight. `current` is the exercise in today's workout
 * (its sets carry the plan's range); `last` is the last time it was done.
 * Returns null when there's no range, no history, a set fell short, or today's
 * weight is already higher than last time.
 */
export function addWeightHint(
  current: SessionExercise,
  last: SessionExercise | undefined,
  step: number,
): AddWeightHint | null {
  if (!last || step <= 0) return null;
  const tops = current.sets.filter((s) => isWork(s.type) && s.targetRepsMax).map((s) => s.targetRepsMax!);
  if (!tops.length) return null;
  const topReps = Math.max(...tops);
  const lastWork = last.sets.filter((s) => s.done && isWork(s.type));
  if (!lastWork.length || lastWork.some((s) => s.reps < topReps)) return null;
  const lastKg = Math.max(...lastWork.map((s) => s.kg));
  if (lastKg <= 0) return null;
  const todayKg = Math.max(0, ...current.sets.filter((s) => isWork(s.type)).map((s) => s.kg));
  if (todayKg > lastKg) return null;
  return { lastKg, topReps, suggestKg: Math.round((lastKg + step) * 100) / 100 };
}
