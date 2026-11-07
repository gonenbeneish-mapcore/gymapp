import { describe, expect, it } from "vitest";
import { CATALOG } from "../data/catalog";
import type { Exercise } from "../data/types";
import { exerciseMeta, filterExercises } from "./exerciseSearch";

const all: Exercise[] = CATALOG.map((e) => ({ ...e, builtIn: true }));
const names = (list: Exercise[]) => list.map((e) => e.name);

describe("filterExercises", () => {
  it("returns everything sorted by name with no filter", () => {
    const r = filterExercises(all, {});
    expect(r).toHaveLength(all.length);
    expect(names(r)).toEqual([...names(r)].sort((a, b) => a.localeCompare(b)));
  });

  it("ignores case, spaces and hyphens", () => {
    expect(names(filterExercises(all, { query: "PUSHUP" }))).toContain("Push-up");
    expect(names(filterExercises(all, { query: "pull up" }))).toEqual(expect.arrayContaining(["Pull-up", "Assisted Pull-up"]));
  });

  it("needs every word to match", () => {
    expect(names(filterExercises(all, { query: "incline press machine" }))).toEqual(["Incline Chest Press"]);
  });

  it("finds exercises by muscle name", () => {
    const r = filterExercises(all, { query: "inner thighs" });
    expect(names(r)).toContain("Hip Adduction");
  });

  it("filters by equipment and main muscle together", () => {
    const r = filterExercises(all, { equipment: "machine", muscle: "chest" });
    expect(r.length).toBeGreaterThan(2);
    for (const e of r) {
      expect(e.equipment).toBe("machine");
      expect(e.primary).toContain("chest");
    }
    // Triceps only helps on the chest press, so it is not a "triceps" exercise.
    expect(names(filterExercises(all, { muscle: "triceps" }))).not.toContain("Chest Press");
  });

  it("finds a gym's machine by brand and model", () => {
    const custom = { ...all[0], id: "x", name: "My Press", source: { brand: "Precor", model: "RSL0410" } };
    expect(names(filterExercises([...all, custom], { query: "rsl0410" }))).toEqual(["My Press"]);
  });

  it("describes an exercise for lists", () => {
    expect(exerciseMeta(all.find((e) => e.id === "deadlift")!)).toBe("Free weight · Back, Glutes, Hamstrings");
  });
});
