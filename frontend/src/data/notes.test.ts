import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { db } from "./db";
import { savePlateKg, saveSetup } from "./sessions";

describe("exercise notes", () => {
  it("keeps setup and plate weight side by side, and removes the note when both are empty", async () => {
    await saveSetup("chest-press", "Seat 4");
    await savePlateKg("chest-press", 5);
    expect(await db.exerciseNotes.get("chest-press")).toEqual({ exerciseId: "chest-press", mySetup: "Seat 4", plateKg: 5 });

    await saveSetup("chest-press", "  ");
    expect(await db.exerciseNotes.get("chest-press")).toEqual({ exerciseId: "chest-press", plateKg: 5 });

    await savePlateKg("chest-press", undefined);
    expect(await db.exerciseNotes.get("chest-press")).toBeUndefined();
  });
});
