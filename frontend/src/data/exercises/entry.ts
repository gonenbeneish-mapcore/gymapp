import type { Exercise } from "../types";

/** A built-in catalog exercise as written in source; `builtIn` is added when seeding. */
export type CatalogEntry = Omit<Exercise, "builtIn">;
