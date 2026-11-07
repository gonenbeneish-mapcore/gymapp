import type { Equipment, Muscle, SetType } from "../data/types";

export const MUSCLE_LABEL: Record<Muscle, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  adductors: "Inner thighs",
  core: "Core",
};

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  machine: "Machine",
  free: "Free weight",
  cable: "Cable",
  bodyweight: "Bodyweight",
};

/** Short mark shown in the Set column. Normal sets show their number instead. */
export const SET_TYPE_MARK: Record<Exclude<SetType, "normal">, string> = {
  warmup: "W",
  drop: "D",
  failure: "F",
};

export const SET_TYPE_LABEL: Record<SetType, string> = {
  normal: "Normal set",
  warmup: "Warm-up set",
  drop: "Drop set",
  failure: "Set to failure",
};
