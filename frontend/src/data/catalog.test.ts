import { describe, expect, it } from "vitest";
import { CATALOG, STARTER_WORKOUTS } from "./catalog";

describe("catalog", () => {
  const ids = new Set(CATALOG.map((e) => e.id));

  it("has unique ids and names", () => {
    expect(ids.size).toBe(CATALOG.length);
    expect(new Set(CATALOG.map((e) => e.name.toLowerCase())).size).toBe(CATALOG.length);
  });

  it("covers every kind of equipment", () => {
    for (const eq of ["machine", "free", "cable", "bodyweight"]) {
      expect(CATALOG.filter((e) => e.equipment === eq).length).toBeGreaterThanOrEqual(10);
    }
  });

  it("every exercise is fully written", () => {
    for (const e of CATALOG) {
      expect(e.id, e.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(e.primary.length, e.id).toBeGreaterThan(0);
      expect(e.secondary.some((m) => e.primary.includes(m)), e.id).toBe(false);
      expect(e.description.length, e.id).toBeGreaterThan(20);
      expect(e.steps.length, e.id).toBeGreaterThanOrEqual(3);
      expect(e.mistakes.length, e.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("alternatives point at other exercises in the catalog", () => {
    for (const e of CATALOG) {
      expect(e.alternatives, e.id).not.toContain(e.id);
      for (const a of e.alternatives) expect(ids.has(a), `${e.id} → ${a}`).toBe(true);
    }
  });

  it("starter workouts use catalog exercises", () => {
    for (const w of STARTER_WORKOUTS) for (const x of w.exercises) expect(ids.has(x.id), x.id).toBe(true);
  });
});
