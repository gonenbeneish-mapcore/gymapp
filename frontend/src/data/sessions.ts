import { db, newId } from "./db";
import type { Session } from "./types";
import { createSessionFromWorkout } from "../domain/session";

export async function getActiveSession(): Promise<Session | undefined> {
  return db.sessions.filter((s) => s.endedAt == null).first();
}

/** Completed sessions, newest first. */
export async function completedSessions(): Promise<Session[]> {
  const all = await db.sessions.orderBy("startedAt").reverse().toArray();
  return all.filter((s) => s.endedAt != null);
}

/** Start a workout, or return the one already in progress. */
export async function startWorkout(workoutId: string): Promise<string> {
  return db.transaction("rw", db.sessions, db.workouts, async () => {
    const active = await getActiveSession();
    if (active) return active.id;
    const workout = await db.workouts.get(workoutId);
    if (!workout) throw new Error("Workout not found");
    const session = createSessionFromWorkout(workout, await completedSessions(), newId(), Date.now());
    await db.sessions.add(session);
    return session.id;
  });
}

/** Read-modify-write a session in one transaction. */
export async function updateSession(id: string, fn: (s: Session) => Session): Promise<void> {
  await db.transaction("rw", db.sessions, async () => {
    const s = await db.sessions.get(id);
    if (!s) return;
    await db.sessions.put(fn(s));
  });
}

export async function finishSession(id: string): Promise<void> {
  await updateSession(id, (s) => ({ ...s, endedAt: Date.now(), restEndsAt: null }));
}

export async function discardSession(id: string): Promise<void> {
  await db.sessions.delete(id);
}

export async function saveFeedback(id: string, feel: number | undefined, notes: string): Promise<void> {
  await updateSession(id, (s) => ({ ...s, feel, notes: notes.trim() || undefined }));
}

export async function saveSetup(exerciseId: string, mySetup: string): Promise<void> {
  const value = mySetup.trim();
  if (value) await db.exerciseNotes.put({ exerciseId, mySetup: value });
  else await db.exerciseNotes.delete(exerciseId);
}
