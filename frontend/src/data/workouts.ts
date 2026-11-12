import { db as defaultDb, newId, type GymDB } from "./db";
import type { Workout } from "./types";
import { newWorkout } from "../domain/workout";

/** Create an empty workout at the end of the rotation; returns its id. */
export async function createWorkout(name = "New workout", db: GymDB = defaultDb): Promise<string> {
  return db.transaction("rw", db.workouts, async () => {
    const last = await db.workouts.orderBy("order").last();
    const w = newWorkout(newId(), name, (last?.order ?? -1) + 1, Date.now());
    await db.workouts.add(w);
    return w.id;
  });
}

/** Read-modify-write a workout in one transaction (every edit saves straight away). */
export async function updateWorkout(id: string, fn: (w: Workout) => Workout, db: GymDB = defaultDb): Promise<void> {
  await db.transaction("rw", db.workouts, async () => {
    const w = await db.workouts.get(id);
    if (w) await db.workouts.put(fn(w));
  });
}

/** Delete a plan. Past workouts done from it stay in history. */
export async function deleteWorkout(id: string, db: GymDB = defaultDb): Promise<void> {
  await db.workouts.delete(id);
}
