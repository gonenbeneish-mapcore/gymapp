import type { Equipment, SessionExercise } from "../data/types";

/** Fallback jump when we know nothing about the equipment's steps. */
export const DEFAULT_STEP_KG = 2.5;

/** What we know about how the weight can go up on this exercise. */
export type WeightSteps = {
  equipment: Equipment;
  /** One plate on the stack (from the user, or the maker's spec). */
  plateKg?: number;
  /** Extra weight a lever adds on top of the selected plate. */
  addOnKg?: number;
  /** Heaviest plate setting. */
  stackKg?: number;
};

/**
 * The next weight up from `lastKg`:
 * - "plate" or "add-on": the next setting the machine can really make (plates, plus the add-on lever)
 * - "step": a plain 2.5 kg jump when the plate size isn't known (or the add-on size, if the machine has one)
 * - "top": already at the heaviest setting
 * - null: bodyweight, or nothing sensible to suggest
 */
export type NextWeight = { kg: number; how: "plate" | "add-on" | "step" } | { how: "top" } | null;

const EPS = 0.01;
const round = (n: number) => Math.round(n * 100) / 100;

export function nextWeight(lastKg: number, s: WeightSteps): NextWeight {
  if (s.equipment === "bodyweight" || lastKg <= 0) return null;
  const addOn = s.addOnKg ?? 0;
  const maxKg = s.stackKg !== undefined ? s.stackKg + addOn : Infinity;

  if (s.plateKg && s.plateKg > 0) {
    const plate = s.plateKg;
    // Settings near the current weight: k plates, with or without the add-on.
    const k0 = Math.max(1, Math.floor((lastKg + EPS) / plate));
    for (let k = k0; k <= k0 + 2; k++) {
      for (const [kg, how] of [
        [k * plate, "plate"],
        [k * plate + addOn, "add-on"],
      ] as const) {
        if (how === "add-on" && !addOn) continue;
        if (kg > lastKg + EPS) {
          if (kg > maxKg + EPS) return { how: "top" };
          return { kg: round(kg), how };
        }
      }
    }
    return null;
  }

  const step = addOn > 0 ? addOn : DEFAULT_STEP_KG;
  const kg = round(lastKg + step);
  if (kg > maxKg + EPS) return { how: "top" };
  return { kg, how: addOn > 0 ? "add-on" : "step" };
}

export type AddWeightHint = { lastKg: number; topReps: number; next: Exclude<NextWeight, null> };

const isWork = (type: string) => type !== "warmup";

/**
 * Double progression: when last time every work set reached the top of the rep
 * range, suggest the next weight up. `current` is the exercise in today's workout
 * (its sets carry the plan's range); `last` is the last time it was done.
 * Returns null when there's no range, no history, a set fell short, today's
 * weight is already higher than last time, or there's no next weight (bodyweight).
 */
export function addWeightHint(
  current: SessionExercise,
  last: SessionExercise | undefined,
  steps: WeightSteps,
): AddWeightHint | null {
  if (!last) return null;
  const tops = current.sets.filter((s) => isWork(s.type) && s.targetRepsMax).map((s) => s.targetRepsMax!);
  if (!tops.length) return null;
  const topReps = Math.max(...tops);
  const lastWork = last.sets.filter((s) => s.done && isWork(s.type));
  if (!lastWork.length || lastWork.some((s) => s.reps < topReps)) return null;
  const lastKg = Math.max(...lastWork.map((s) => s.kg));
  const todayKg = Math.max(0, ...current.sets.filter((s) => isWork(s.type)).map((s) => s.kg));
  if (todayKg > lastKg) return null;
  const next = nextWeight(lastKg, steps);
  return next ? { lastKg, topReps, next } : null;
}
