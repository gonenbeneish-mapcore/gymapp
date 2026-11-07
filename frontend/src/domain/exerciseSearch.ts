import type { Equipment, Exercise, Muscle } from "../data/types";
import { EQUIPMENT_LABEL, MUSCLE_LABEL } from "./labels";

export type ExerciseFilter = {
  query?: string;
  equipment?: Equipment;
  /** Matches exercises where this is a main muscle. */
  muscle?: Muscle;
};

/** Lower case with spaces and punctuation removed, so "pushup" finds "Push-up". */
function squash(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function haystack(e: Exercise) {
  return squash(
    [
      e.name,
      EQUIPMENT_LABEL[e.equipment],
      ...e.primary.map((m) => MUSCLE_LABEL[m]),
      ...e.secondary.map((m) => MUSCLE_LABEL[m]),
      e.source?.brand ?? "",
      e.source?.model ?? "",
    ].join(" "),
  );
}

/** Exercises matching every word of the query and the chosen filters, sorted by name. */
export function filterExercises(all: Iterable<Exercise>, f: ExerciseFilter): Exercise[] {
  const words = (f.query ?? "").split(/\s+/).map(squash).filter(Boolean);
  const out: Exercise[] = [];
  for (const e of all) {
    if (f.equipment && e.equipment !== f.equipment) continue;
    if (f.muscle && !e.primary.includes(f.muscle)) continue;
    if (words.length) {
      const h = haystack(e);
      if (!words.every((w) => h.includes(w))) continue;
    }
    out.push(e);
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** "Machine · Chest, Triceps" — the subtitle used in lists. */
export function exerciseMeta(e: Exercise) {
  return `${EQUIPMENT_LABEL[e.equipment]} · ${e.primary.map((m) => MUSCLE_LABEL[m]).join(", ")}`;
}
