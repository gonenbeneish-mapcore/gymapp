import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { GymDB } from "./db";
import { createWorkout, deleteWorkout, updateWorkout } from "./workouts";
import { addExercise, renameWorkout } from "../domain/workout";

let n = 0;
const freshDb = () => new GymDB(`workouts-test-${n++}`);

describe("saved workouts", () => {
  it("creates workouts at the end of the rotation", async () => {
    const db = freshDb();
    const a = await createWorkout("A", db);
    const b = await createWorkout("B", db);
    const all = await db.workouts.orderBy("order").toArray();
    expect(all.map((w) => [w.id, w.name])).toEqual([
      [a, "A"],
      [b, "B"],
    ]);
  });

  it("saves edits and deletes", async () => {
    const db = freshDb();
    const id = await createWorkout(undefined, db);
    await updateWorkout(id, (w) => addExercise(renameWorkout(w, "Legs"), "leg-press"), db);
    const w = await db.workouts.get(id);
    expect(w?.name).toBe("Legs");
    expect(w?.exercises.map((x) => x.exerciseId)).toEqual(["leg-press"]);
    await deleteWorkout(id, db);
    expect(await db.workouts.get(id)).toBeUndefined();
  });
});
