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
  /** Path under /exercises/ or a blob key; absent = equipment placeholder. */
  image?: string;
  videoUrl?: string;
  source?: { brand: string; model?: string };
  builtIn: boolean;
};

/** Things the user records about an exercise; never overwritten by catalog updates. */
export type ExerciseNote = {
  exerciseId: string;
  mySetup?: string;
};

export type SetType = "normal" | "warmup" | "drop" | "failure";

export type PlannedSet = { kg: number; reps: number; type?: SetType };

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
