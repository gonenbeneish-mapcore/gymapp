import type { CatalogEntry } from "./exercises/entry";
import { MACHINES } from "./exercises/machines";
import { FREE_WEIGHTS } from "./exercises/freeWeights";
import { CABLES } from "./exercises/cables";
import { BODYWEIGHT } from "./exercises/bodyweight";

/**
 * Built-in exercises. Text is our own; pictures default to a muscle map until
 * the user adds a photo of their gym's machine. Bump CATALOG_VERSION when this changes.
 */
export const CATALOG_VERSION = 5;

export const CATALOG: CatalogEntry[] = [...MACHINES, ...FREE_WEIGHTS, ...CABLES, ...BODYWEIGHT];

type StarterWorkout = {
  name: string;
  exercises: { id: string; sets: number; kg: number; reps: number }[];
};

/** Example plans so the app is usable on day one. The user can edit or delete them. */
export const STARTER_WORKOUTS: StarterWorkout[] = [
  {
    name: "Push Day",
    exercises: [
      { id: "shoulder-press", sets: 3, kg: 30, reps: 12 },
      { id: "chest-press", sets: 4, kg: 45, reps: 10 },
      { id: "incline-db-press", sets: 3, kg: 20, reps: 8 },
      { id: "pec-fly", sets: 3, kg: 35, reps: 12 },
      { id: "triceps-pushdown", sets: 4, kg: 25, reps: 12 },
      { id: "lateral-raise", sets: 3, kg: 8, reps: 15 },
    ],
  },
  {
    name: "Pull Day",
    exercises: [
      { id: "lat-pulldown", sets: 4, kg: 50, reps: 10 },
      { id: "seated-row", sets: 3, kg: 45, reps: 10 },
      { id: "cable-row", sets: 3, kg: 40, reps: 12 },
      { id: "biceps-curl", sets: 3, kg: 12, reps: 10 },
    ],
  },
  {
    name: "Leg Day",
    exercises: [
      { id: "leg-press", sets: 4, kg: 100, reps: 10 },
      { id: "leg-extension", sets: 3, kg: 40, reps: 12 },
      { id: "seated-leg-curl", sets: 3, kg: 35, reps: 12 },
      { id: "calf-raise", sets: 3, kg: 50, reps: 15 },
      { id: "plank", sets: 3, kg: 0, reps: 45 },
    ],
  },
];
