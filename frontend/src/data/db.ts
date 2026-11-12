import Dexie, { type EntityTable } from "dexie";
import type { Exercise, ExerciseNote, Measurement, Session, Workout } from "./types";
import { withEntryKeys } from "../domain/session";

export class GymDB extends Dexie {
  exercises!: EntityTable<Exercise, "id">;
  exerciseNotes!: EntityTable<ExerciseNote, "exerciseId">;
  workouts!: EntityTable<Workout, "id">;
  sessions!: EntityTable<Session, "id">;
  measurements!: EntityTable<Measurement, "id">;
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
    // v2: each session exercise gets a stable key.
    this.version(2).upgrade((tx) =>
      tx
        .table("sessions")
        .toCollection()
        .modify((s: Session) => {
          s.exercises = withEntryKeys(s).exercises;
        }),
    );
    // v3: body measurements (weigh-ins, waist).
    this.version(3).stores({ measurements: "id, at, [kind+at]" });
  }
}

export const db = new GymDB();

export function newId(): string {
  return crypto.randomUUID();
}
