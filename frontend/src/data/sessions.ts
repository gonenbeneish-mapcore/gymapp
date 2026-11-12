import { db, newId } from "./db";
import type { ExerciseNote, Session } from "./types";
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

/** Merge into an exercise's note; the note is removed once it holds nothing. */
async function patchNote(exerciseId: string, patch: Partial<ExerciseNote>): Promise<void> {
  await db.transaction("rw", db.exerciseNotes, async () => {
    const next: ExerciseNote = { ...(await db.exerciseNotes.get(exerciseId)), ...patch, exerciseId };
    if (!next.mySetup) delete next.mySetup;
    if (!next.plateKg) delete next.plateKg;
    if (next.mySetup || next.plateKg) await db.exerciseNotes.put(next);
    else await db.exerciseNotes.delete(exerciseId);
  });
}

export async function saveSetup(exerciseId: string, mySetup: string): Promise<void> {
  await patchNote(exerciseId, { mySetup: mySetup.trim() || undefined });
}

/** Plate weight for a machine; `undefined` clears it. */
export async function savePlateKg(exerciseId: string, plateKg: number | undefined): Promise<void> {
  await patchNote(exerciseId, { plateKg: plateKg && plateKg > 0 ? plateKg : undefined });
}
