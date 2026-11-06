import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { GymDB } from "./db";
import { ensureSeeded } from "./seed";
import { CATALOG } from "./catalog";
import { backupFileName, createBackup, getLastBackupAt, parseBackup, restoreBackup, summarize } from "./backup";
import type { Exercise, Session } from "./types";

let n = 0;
async function freshDb() {
  const db = new GymDB(`backup-test-${n++}`);
  await ensureSeeded(db);
  return db;
}

const session = (id: string, startedAt: number, ended = true): Session => ({
  id,
  name: "Push Day",
  startedAt,
  endedAt: ended ? startedAt + 3_000_000 : undefined,
  currentIndex: 0,
  exercises: [{ exerciseId: "chest-press", restSeconds: 90, sets: [{ kg: 50, reps: 8, type: "normal", done: true }] }],
});

const custom: Exercise = {
  id: "my-cable-fly",
  name: "Cable Fly",
  equipment: "cable",
  primary: ["chest"],
  secondary: [],
  description: "",
  steps: [],
  mistakes: [],
  alternatives: [],
  builtIn: false,
};

describe("backup round trip", () => {
  it("restores exactly what was backed up into a fresh install", async () => {
    const a = await freshDb();
    await a.sessions.bulkAdd([session("s1", 1000), session("s2", 5000), session("live", 9000, false)]);
    await a.exerciseNotes.put({ exerciseId: "chest-press", mySetup: "Seat 4" });
    await a.exercises.put(custom);

    const text = JSON.stringify(await createBackup(a, 42));
    const parsed = parseBackup(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const b = await freshDb();
    await b.sessions.add(session("other", 1));
    await restoreBackup(parsed.backup, b);

    expect((await b.sessions.toArray()).map((s) => s.id).sort()).toEqual(["live", "s1", "s2"]);
    expect(await b.exerciseNotes.get("chest-press")).toEqual({ exerciseId: "chest-press", mySetup: "Seat 4" });
    expect(await b.exercises.get("my-cable-fly")).toMatchObject({ name: "Cable Fly", builtIn: false });
    expect(await b.workouts.count()).toBe(await a.workouts.count());
    expect(await b.exercises.count()).toBe(CATALOG.length + 1);
    expect(await getLastBackupAt(b)).toBe(42);
  });

  it("does not bring the starter plans back after restoring a backup without them", async () => {
    const a = await freshDb();
    await a.workouts.clear();
    const parsed = parseBackup(JSON.stringify(await createBackup(a)));
    const b = await freshDb();
    if (!parsed.ok) throw new Error(parsed.error);
    await restoreBackup(parsed.backup, b);
    await ensureSeeded(b);
    expect(await b.workouts.count()).toBe(0);
  });

  it("leaves built-in exercises out of the file", async () => {
    const a = await freshDb();
    const backup = await createBackup(a);
    expect(backup.data.customExercises).toHaveLength(0);
  });
});

describe("parseBackup", () => {
  it("rejects non-JSON, other files, newer versions and damaged data", () => {
    expect(parseBackup("hello").ok).toBe(false);
    expect(parseBackup(JSON.stringify({ format: "something-else" })).ok).toBe(false);
    const newer = parseBackup(JSON.stringify({ format: "gymapp-backup", version: 99, exportedAt: 1, data: {} }));
    expect(newer.ok === false && newer.error).toMatch(/newer version/);
    const damaged = parseBackup(
      JSON.stringify({ format: "gymapp-backup", version: 1, exportedAt: 1, data: { workouts: [{ id: 1 }], sessions: [], exerciseNotes: [], customExercises: [] } }),
    );
    expect(damaged.ok === false && damaged.error).toMatch(/damaged/);
  });
});

describe("summary and file name", () => {
  it("counts finished sessions and their date range", async () => {
    const a = await freshDb();
    await a.sessions.bulkAdd([session("s1", 2000), session("s2", 1000), session("live", 9000, false)]);
    const s = summarize(await createBackup(a, 7));
    expect(s).toMatchObject({ workouts: 3, completedSessions: 2, firstSessionAt: 1000, lastSessionAt: 2000, exportedAt: 7 });
  });

  it("names the file by local date", () => {
    expect(backupFileName(new Date(2026, 10, 6, 23, 59).getTime())).toBe("gymapp-backup-2026-11-06.json");
  });
});
