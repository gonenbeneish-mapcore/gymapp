import { CATALOG, CATALOG_VERSION, STARTER_WORKOUTS } from "./catalog";
import { db as defaultDb, newId, type GymDB } from "./db";
import type { Workout } from "./types";

/**
 * Make sure the built-in catalog is current and, on a brand-new install,
 * add the starter workouts. Safe to call on every launch.
 */
export async function ensureSeeded(db: GymDB = defaultDb) {
  await db.transaction("rw", db.exercises, db.workouts, db.meta, async () => {
    const version = (await db.meta.get("catalogVersion"))?.value;
    if (version !== CATALOG_VERSION) {
      await db.exercises.bulkPut(CATALOG.map((e) => ({ ...e, builtIn: true })));
      await db.meta.put({ key: "catalogVersion", value: CATALOG_VERSION });
    }

    const seeded = await db.meta.get("starterWorkouts");
    if (!seeded) {
      if ((await db.workouts.count()) === 0) {
        const now = Date.now();
        const workouts: Workout[] = STARTER_WORKOUTS.map((w, i) => ({
          id: newId(),
          name: w.name,
          order: i,
          restSeconds: 90,
          createdAt: now,
          exercises: w.exercises.map((x) => ({
            exerciseId: x.id,
            sets: Array.from({ length: x.sets }, () => ({ kg: x.kg, reps: x.reps })),
          })),
        }));
        await db.workouts.bulkAdd(workouts);
      }
      await db.meta.put({ key: "starterWorkouts", value: true });
    }
  });
}
