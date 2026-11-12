import { db as defaultDb, newId, type GymDB } from "./db";
import type { MeasureKind, Measurement, Profile } from "./types";

const PROFILE_KEY = "profile";

export async function addMeasurement(kind: MeasureKind, value: number, at = Date.now(), db: GymDB = defaultDb): Promise<string> {
  const id = newId();
  await db.measurements.add({ id, kind, value, at });
  return id;
}

export async function updateMeasurement(id: string, value: number, at: number, db: GymDB = defaultDb): Promise<void> {
  await db.measurements.update(id, { value, at });
}

export async function deleteMeasurement(id: string, db: GymDB = defaultDb): Promise<void> {
  await db.measurements.delete(id);
}

/** Oldest first. */
export async function measurementsOf(kind: MeasureKind, db: GymDB = defaultDb): Promise<Measurement[]> {
  return db.measurements.where("[kind+at]").between([kind, -Infinity], [kind, Infinity]).toArray();
}

export async function getProfile(db: GymDB = defaultDb): Promise<Profile> {
  const v = (await db.meta.get(PROFILE_KEY))?.value;
  return v && typeof v === "object" ? (v as Profile) : {};
}

export async function saveProfile(patch: Partial<Profile>, db: GymDB = defaultDb): Promise<void> {
  await db.transaction("rw", db.meta, async () => {
    const next = { ...(await getProfile(db)), ...patch };
    await db.meta.put({ key: PROFILE_KEY, value: next });
  });
}
