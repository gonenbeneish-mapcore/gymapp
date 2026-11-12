export type Equipment = "machine" | "free" | "cable" | "bodyweight";
export type Muscle =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "adductors"
  | "core";

/** What a body measurement records. Weight is in kg, everything else in cm. */
export type MeasureKind = "weight" | "waist";

/** One weigh-in or tape measurement. */
export type Measurement = {
  id: string;
  kind: MeasureKind;
  value: number;
  /** When it was taken (ms since epoch). */
  at: number;
};

/** About the user; drives BMI, waist-to-height and the goal bar. */
export type Profile = {
  heightCm?: number;
  goalKg?: number;
};

/** Facts about a specific machine model (from the maker's spec page). */
export type MachineSpec = {
  /** Heaviest setting on the weight stack, in kg. */
  stackKg?: number;
  /** Extra weight a lever adds on top of the selected plate, in kg. */
  addOnKg?: number;
  /** Weight of one plate on the stack, in kg, when the maker lists it. */
  plateKg?: number;
  /** What can be adjusted before a set; [] = nothing to adjust. */
  adjust?: string[];
};

/** Built-in catalog entry. User-specific notes live in `ExerciseNote`. */
export type Exercise = {
  id: string;
  name: string;
  equipment: Equipment;
  primary: Muscle[];
  secondary: Muscle[];
  description: string;
  steps: string[];
  mistakes: string[];
  alternatives: string[];
  /** Photo URL (e.g. the maker's product photo, cached for offline use); absent = muscle chart. */
  image?: string;
  videoUrl?: string;
  source?: { brand: string; model?: string };
  machine?: MachineSpec;
  builtIn: boolean;
};

/** Things the user records about an exercise; never overwritten by catalog updates. */
export type ExerciseNote = {
  exerciseId: string;
  mySetup?: string;
  /** Weight of one plate on this machine's stack, as measured at the gym. */
  plateKg?: number;
};

export type SetType = "normal" | "warmup" | "drop" | "failure";

/** One planned set. With `repsMax`, the target is a range: `reps` to `repsMax` (e.g. 8–12). */
export type PlannedSet = { kg: number; reps: number; repsMax?: number; type?: SetType };

export type WorkoutExercise = {
  exerciseId: string;
  restSeconds?: number;
  sets: PlannedSet[];
};

/** A saved workout plan (template). */
export type Workout = {
  id: string;
  name: string;
  order: number;
  restSeconds: number;
  exercises: WorkoutExercise[];
  createdAt: number;
};

export type SessionSet = {
  kg: number;
  reps: number;
  type: SetType;
  done: boolean;
  doneAt?: number;
  /** What was done in this set position last time, for the "Previous" column. */
  prevKg?: number;
  prevReps?: number;
  /** What the workout plan asked for in this set, kept so History can show planned vs done. */
  targetKg?: number;
  targetReps?: number;
  /** Top of the plan's rep range for this set, when it has one. */
  targetRepsMax?: number;
};

export type SessionExercise = {
  /** Stable id within the session, so entries can be swapped or reordered without losing track. */
  key: string;
  exerciseId: string;
  restSeconds: number;
  sets: SessionSet[];
};

/** A workout being done or already done. `endedAt` unset = in progress. */
export type Session = {
  id: string;
  workoutId?: string;
  name: string;
  startedAt: number;
  endedAt?: number;
  currentIndex: number;
  restEndsAt?: number | null;
  restTotalMs?: number;
  feel?: number;
  notes?: string;
  exercises: SessionExercise[];
};
