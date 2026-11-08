import { z } from "zod";
import { db as defaultDb, type GymDB } from "./db";
import type { Exercise, ExerciseNote, Session, Workout } from "./types";
import { withEntryKeys } from "../domain/session";

export const BACKUP_FORMAT = "gymapp-backup";
export const BACKUP_VERSION = 1;

/** Everything the user created. Built-in catalog exercises are not included — the app ships them. */
export type Backup = {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: number;
  data: {
    workouts: Workout[];
    sessions: Session[];
    exerciseNotes: ExerciseNote[];
    customExercises: Exercise[];
  };
};

const setType = z.enum(["normal", "warmup", "drop", "failure"]);
const muscle = z.enum(["chest", "back", "shoulders", "biceps", "triceps", "quads", "hamstrings", "glutes", "calves", "adductors", "core"]);

const workoutSchema = z.object({
  id: z.string(),
  name: z.string(),
  order: z.number(),
  restSeconds: z.number(),
  createdAt: z.number(),
  exercises: z.array(
    z.object({
      exerciseId: z.string(),
      restSeconds: z.number().optional(),
      sets: z.array(z.object({ kg: z.number(), reps: z.number(), type: setType.optional() })),
    }),
  ),
});

const sessionSchema = z.object({
  id: z.string(),
  workoutId: z.string().optional(),
  name: z.string(),
  startedAt: z.number(),
  endedAt: z.number().optional(),
  currentIndex: z.number(),
  restEndsAt: z.number().nullable().optional(),
  restTotalMs: z.number().optional(),
  feel: z.number().optional(),
  notes: z.string().optional(),
  exercises: z.array(
    z.object({
      key: z.string().optional(),
      exerciseId: z.string(),
      restSeconds: z.number(),
      sets: z.array(
        z.object({
          kg: z.number(),
          reps: z.number(),
          type: setType,
          done: z.boolean(),
          doneAt: z.number().optional(),
          prevKg: z.number().optional(),
          prevReps: z.number().optional(),
          targetKg: z.number().optional(),
          targetReps: z.number().optional(),
        }),
      ),
    }),
  ),
});

const exerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  equipment: z.enum(["machine", "free", "cable", "bodyweight"]),
  primary: z.array(muscle),
  secondary: z.array(muscle),
  description: z.string(),
  steps: z.array(z.string()),
  mistakes: z.array(z.string()),
  alternatives: z.array(z.string()),
  image: z.string().optional(),
  videoUrl: z.string().optional(),
  source: z.object({ brand: z.string(), model: z.string().optional() }).optional(),
  builtIn: z.boolean(),
});

const backupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.number().int().min(1),
  exportedAt: z.number(),
  data: z.object({
    workouts: z.array(workoutSchema),
    sessions: z.array(sessionSchema),
    exerciseNotes: z.array(z.object({ exerciseId: z.string(), mySetup: z.string().optional() })),
    customExercises: z.array(exerciseSchema),
  }),
});

export async function createBackup(db: GymDB = defaultDb, now = Date.now()): Promise<Backup> {
  return db.transaction("r", db.workouts, db.sessions, db.exerciseNotes, db.exercises, async () => ({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now,
    data: {
      workouts: await db.workouts.toArray(),
      sessions: await db.sessions.toArray(),
      exerciseNotes: await db.exerciseNotes.toArray(),
      customExercises: (await db.exercises.toArray()).filter((e) => !e.builtIn),
    },
  }));
}

export type ParseResult = { ok: true; backup: Backup } | { ok: false; error: string };

/** Check a file's text is a GymApp backup this version can read. */
export function parseBackup(text: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "This file isn't a GymApp backup (it's not valid JSON)." };
  }
  if (typeof json !== "object" || json === null || (json as { format?: unknown }).format !== BACKUP_FORMAT) {
    return { ok: false, error: "This file isn't a GymApp backup." };
  }
  const version = (json as { version?: unknown }).version;
  if (typeof version === "number" && version > BACKUP_VERSION) {
    return { ok: false, error: "This backup was made by a newer version of GymApp. Update the app first." };
  }
  const parsed = backupSchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, error: "This backup file is damaged or incomplete, so it can't be restored." };
  }
  // Backups made before session exercises had keys get them here.
  const backup = parsed.data;
  return {
    ok: true,
    backup: { ...backup, data: { ...backup.data, sessions: backup.data.sessions.map(withEntryKeys) } } as Backup,
  };
}

export type BackupSummary = {
  workouts: number;
  completedSessions: number;
  firstSessionAt?: number;
  lastSessionAt?: number;
  exportedAt: number;
};

export function summarize(b: Backup): BackupSummary {
  const done = b.data.sessions.filter((s) => s.endedAt != null).map((s) => s.startedAt).sort((x, y) => x - y);
  return {
    workouts: b.data.workouts.length,
    completedSessions: done.length,
    firstSessionAt: done[0],
    lastSessionAt: done[done.length - 1],
    exportedAt: b.exportedAt,
  };
}

/**
 * Replace everything the user created with the backup's contents.
 * The built-in exercise catalog is kept as is.
 */
export async function restoreBackup(b: Backup, db: GymDB = defaultDb): Promise<void> {
  await db.transaction("rw", [db.workouts, db.sessions, db.exerciseNotes, db.exercises, db.meta], async () => {
    await db.workouts.clear();
    await db.sessions.clear();
    await db.exerciseNotes.clear();
    const custom = (await db.exercises.toArray()).filter((e) => !e.builtIn).map((e) => e.id);
    await db.exercises.bulkDelete(custom);

    const builtInIds = new Set((await db.exercises.toArray()).map((e) => e.id));
    await db.workouts.bulkAdd(b.data.workouts);
    await db.sessions.bulkAdd(b.data.sessions);
    await db.exerciseNotes.bulkAdd(b.data.exerciseNotes);
    // A custom exercise never overwrites a built-in one with the same id.
    await db.exercises.bulkAdd(b.data.customExercises.filter((e) => !builtInIds.has(e.id)));
    // Don't re-add starter plans over restored data later.
    await db.meta.put({ key: "starterWorkouts", value: true });
    await db.meta.put({ key: "lastBackupAt", value: b.exportedAt });
  });
}

export async function getLastBackupAt(db: GymDB = defaultDb): Promise<number | undefined> {
  const v = (await db.meta.get("lastBackupAt"))?.value;
  return typeof v === "number" ? v : undefined;
}

export async function setLastBackupAt(at: number, db: GymDB = defaultDb): Promise<void> {
  await db.meta.put({ key: "lastBackupAt", value: at });
}

export function backupFileName(at: number): string {
  const d = new Date(at);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `gymapp-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}
