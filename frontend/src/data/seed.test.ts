import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { GymDB } from "./db";
import { ensureSeeded } from "./seed";
import { CATALOG } from "./catalog";

describe("ensureSeeded", () => {
  it("adds catalog and starter workouts once", async () => {
    const db = new GymDB("seed-test-1");
    await ensureSeeded(db);
    await ensureSeeded(db);
    expect(await db.exercises.count()).toBe(CATALOG.length);
    expect(await db.workouts.count()).toBe(3);
  });

  it("does not bring back starter workouts the user deleted", async () => {
    const db = new GymDB("seed-test-2");
    await ensureSeeded(db);
    await db.workouts.clear();
    await ensureSeeded(db);
    expect(await db.workouts.count()).toBe(0);
  });

  it("every workout exercise exists in the catalog", async () => {
    const db = new GymDB("seed-test-3");
    await ensureSeeded(db);
    const ids = new Set((await db.exercises.toArray()).map((e) => e.id));
    for (const w of await db.workouts.toArray()) {
      for (const x of w.exercises) expect(ids.has(x.exerciseId)).toBe(true);
    }
    for (const e of CATALOG) for (const alt of e.alternatives) expect(ids.has(alt)).toBe(true);
  });
});
