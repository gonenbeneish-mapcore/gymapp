import Dexie, { type EntityTable } from "dexie";
import type { Exercise, ExerciseNote, Session, Workout } from "./types";

export class GymDB extends Dexie {
  exercises!: EntityTable<Exercise, "id">;
  exerciseNotes!: EntityTable<ExerciseNote, "exerciseId">;
  workouts!: EntityTable<Workout, "id">;
  sessions!: EntityTable<Session, "id">;
  meta!: EntityTable<{ key: string; value: unknown }, "key">;

  constructor(name = "gymapp") {
    super(name);
    this.version(1).stores({
      exercises: "id, name, equipment, *primary",
      exerciseNotes: "exerciseId",
      workouts: "id, order",
      sessions: "id, startedAt, endedAt, workoutId",
      meta: "key",
    });
  }
}

export const db = new GymDB();

export function newId(): string {
  return crypto.randomUUID();
}
