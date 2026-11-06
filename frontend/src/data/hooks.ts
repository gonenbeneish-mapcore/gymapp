import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import type { Exercise, ExerciseNote, Session, Workout } from "./types";
import { completedSessions, getActiveSession } from "./sessions";

export function useWorkouts(): Workout[] | undefined {
  return useLiveQuery(() => db.workouts.orderBy("order").toArray(), []);
}

export function useExerciseMap(): Map<string, Exercise> | undefined {
  return useLiveQuery(async () => new Map((await db.exercises.toArray()).map((e) => [e.id, e])), []);
}

export function useNotesMap(): Map<string, ExerciseNote> | undefined {
  return useLiveQuery(async () => new Map((await db.exerciseNotes.toArray()).map((n) => [n.exerciseId, n])), []);
}

/** `null` = loaded, nothing in progress; `undefined` = still loading. */
export function useActiveSession(): Session | null | undefined {
  return useLiveQuery(async () => (await getActiveSession()) ?? null, []);
}

export function useCompletedSessions(): Session[] | undefined {
  return useLiveQuery(() => completedSessions(), []);
}

export function useSession(id: string | undefined): Session | null | undefined {
  return useLiveQuery(async () => (id ? ((await db.sessions.get(id)) ?? null) : null), [id]);
}
