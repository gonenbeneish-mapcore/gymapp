import type { Exercise } from "./types";

/**
 * Built-in starter exercises. Text is our own; photos get added per machine
 * as the user photographs their gym. Bump CATALOG_VERSION when this changes.
 */
export const CATALOG_VERSION = 1;

type Entry = Omit<Exercise, "builtIn">;

export const CATALOG: Entry[] = [
  {
    id: "chest-press",
    name: "Chest Press",
    equipment: "machine",
    primary: ["chest"],
    secondary: ["triceps", "shoulders"],
    description:
      "A seated press that pushes the handles straight out from the chest. The machine guides the path, so you can push hard without a spotter.",
    steps: [
      "Set the seat so the handles line up with the middle of your chest.",
      "Sit with your back flat on the pad and shoulder blades pulled back.",
      "Press until your arms are straight without locking the elbows.",
      "Return slowly until you feel a stretch across the chest.",
    ],
    mistakes: ["Seat too low, so the press drifts toward the shoulders.", "Shoulders rolling forward at the end of each rep."],
    alternatives: ["bench-press", "incline-db-press", "push-up"],
  },
  {
    id: "shoulder-press",
    name: "Shoulder Press",
    equipment: "machine",
    primary: ["shoulders"],
    secondary: ["triceps"],
    description: "A seated overhead press on a guided path. Builds the front and side of the shoulders.",
    steps: [
      "Set the seat so the handles start at about shoulder height.",
      "Keep your back against the pad and core braced.",
      "Press up until the arms are nearly straight, then lower under control.",
    ],
    mistakes: ["Arching the lower back off the pad.", "Cutting the range short at the bottom."],
    alternatives: ["lateral-raise"],
  },
  {
    id: "pec-fly",
    name: "Pec Fly",
    equipment: "machine",
    primary: ["chest"],
    secondary: ["shoulders"],
    description: "Brings the arms together in a wide hugging motion to isolate the chest.",
    steps: [
      "Set the seat so the handles are level with your chest.",
      "Keep a slight, fixed bend in the elbows.",
      "Squeeze the handles together in front of you, then open slowly.",
    ],
    mistakes: ["Bending and straightening the elbows, turning it into a press.", "Letting the weight pull the arms too far back."],
    alternatives: ["chest-press", "push-up"],
  },
  {
    id: "incline-db-press",
    name: "Incline Dumbbell Press",
    equipment: "free",
    primary: ["chest"],
    secondary: ["shoulders", "triceps"],
    description: "A dumbbell press on an inclined bench, aimed at the upper chest.",
    steps: [
      "Set the bench to about 30 degrees and sit back with a dumbbell on each knee.",
      "Kick the weights up as you lie back; start with them at chest level.",
      "Press up and slightly in, then lower until you feel a stretch.",
    ],
    mistakes: ["Bench too steep, which shifts the work to the shoulders.", "Bouncing the dumbbells at the bottom."],
    alternatives: ["chest-press", "bench-press"],
  },
  {
    id: "bench-press",
    name: "Bench Press",
    equipment: "free",
    primary: ["chest"],
    secondary: ["triceps", "shoulders"],
    description: "The classic barbell press lying on a flat bench.",
    steps: [
      "Lie with eyes under the bar, feet flat, shoulder blades squeezed together.",
      "Grip a little wider than shoulder width and unrack the bar.",
      "Lower to the lower chest, then press back up over the shoulders.",
    ],
    mistakes: ["Flaring the elbows straight out to the sides.", "Lifting the hips off the bench."],
    alternatives: ["chest-press", "incline-db-press"],
  },
  {
    id: "push-up",
    name: "Push-up",
    equipment: "bodyweight",
    primary: ["chest"],
    secondary: ["triceps", "shoulders", "core"],
    description: "A bodyweight press from the floor. Works anywhere, no equipment needed.",
    steps: [
      "Hands a little wider than shoulders, body in one straight line.",
      "Lower until the chest is just above the floor.",
      "Push back up without letting the hips sag.",
    ],
    mistakes: ["Hips sagging or piking up.", "Only going halfway down."],
    alternatives: ["chest-press", "bench-press"],
  },
  {
    id: "triceps-pushdown",
    name: "Triceps Pushdown",
    equipment: "cable",
    primary: ["triceps"],
    secondary: [],
    description: "Pushes a cable handle or rope down by straightening the elbows.",
    steps: [
      "Stand close to the cable with elbows tucked at your sides.",
      "Push down until the arms are straight.",
      "Let the handle come back up to about chest height, elbows still pinned.",
    ],
    mistakes: ["Elbows drifting forward so the shoulders join in.", "Leaning over the weight."],
    alternatives: ["push-up"],
  },
  {
    id: "lateral-raise",
    name: "Lateral Raise",
    equipment: "free",
    primary: ["shoulders"],
    secondary: [],
    description: "Raises dumbbells out to the sides to build the side of the shoulders.",
    steps: [
      "Stand tall with a light dumbbell in each hand.",
      "Lift the arms out to the sides to shoulder height, elbows slightly bent.",
      "Lower slowly.",
    ],
    mistakes: ["Swinging the body to lift heavier weight.", "Shrugging the shoulders up."],
    alternatives: ["shoulder-press"],
  },
  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    equipment: "machine",
    primary: ["back"],
    secondary: ["biceps"],
    description: "Pulls a bar down to the chest while seated. Builds the width of the back.",
    steps: [
      "Set the thigh pad so your legs are locked in.",
      "Grip the bar a little wider than shoulders and lean back slightly.",
      "Pull the bar to the top of the chest, then let it rise slowly.",
    ],
    mistakes: ["Pulling the bar behind the neck.", "Swinging the body back to move the weight."],
    alternatives: ["seated-row", "cable-row"],
  },
  {
    id: "seated-row",
    name: "Seated Row",
    equipment: "machine",
    primary: ["back"],
    secondary: ["biceps", "shoulders"],
    description: "Pulls handles toward the body while seated with chest support.",
    steps: [
      "Set the chest pad so you can just reach the handles with straight arms.",
      "Pull the handles back, squeezing the shoulder blades together.",
      "Return slowly until the arms are straight.",
    ],
    mistakes: ["Shrugging instead of pulling back.", "Jerking the weight with the lower back."],
    alternatives: ["cable-row", "lat-pulldown"],
  },
  {
    id: "cable-row",
    name: "Cable Row",
    equipment: "cable",
    primary: ["back"],
    secondary: ["biceps"],
    description: "A seated row on a low cable, usually with a close-grip handle.",
    steps: [
      "Sit with knees slightly bent and back straight.",
      "Pull the handle to your belly, elbows close to the body.",
      "Let the arms extend forward again without rounding the back.",
    ],
    mistakes: ["Rocking the torso back and forth.", "Rounding the lower back."],
    alternatives: ["seated-row"],
  },
  {
    id: "biceps-curl",
    name: "Biceps Curl",
    equipment: "free",
    primary: ["biceps"],
    secondary: [],
    description: "Curls dumbbells up by bending the elbows.",
    steps: [
      "Stand with a dumbbell in each hand, palms facing forward.",
      "Curl up while keeping the elbows by your sides.",
      "Lower all the way down slowly.",
    ],
    mistakes: ["Swinging the weights up with the body.", "Elbows moving forward."],
    alternatives: [],
  },
  {
    id: "leg-press",
    name: "Leg Press",
    equipment: "machine",
    primary: ["quads"],
    secondary: ["glutes", "hamstrings"],
    description: "Pushes a sled away with the legs while seated. Heavy leg work without a bar on your back.",
    steps: [
      "Feet shoulder-width on the platform, back flat on the pad.",
      "Lower until the knees are at about 90 degrees.",
      "Press back up without locking the knees.",
    ],
    mistakes: ["Lower back lifting off the pad at the bottom.", "Knees caving inward."],
    alternatives: ["leg-extension"],
  },
  {
    id: "leg-extension",
    name: "Leg Extension",
    equipment: "machine",
    primary: ["quads"],
    secondary: [],
    description: "Straightens the knees against a pad to isolate the front of the thighs.",
    steps: [
      "Line the knee joint up with the machine's pivot.",
      "Set the pad just above the ankles.",
      "Straighten the legs, pause, then lower slowly.",
    ],
    mistakes: ["Kicking the weight up with momentum.", "Lifting the hips off the seat."],
    alternatives: ["leg-press"],
  },
  {
    id: "seated-leg-curl",
    name: "Seated Leg Curl",
    equipment: "machine",
    primary: ["hamstrings"],
    secondary: [],
    description: "Bends the knees against a pad to work the back of the thighs.",
    steps: [
      "Line the knees up with the pivot and lock the thigh pad down.",
      "Curl the lower pad under the seat.",
      "Let it come back up slowly.",
    ],
    mistakes: ["Letting the weight snap back up.", "Hips lifting off the seat."],
    alternatives: [],
  },
  {
    id: "calf-raise",
    name: "Calf Raise",
    equipment: "machine",
    primary: ["calves"],
    secondary: [],
    description: "Rises up onto the toes against resistance.",
    steps: [
      "Balls of the feet on the edge of the platform, heels hanging.",
      "Rise as high as you can onto the toes.",
      "Lower until you feel a stretch in the calves.",
    ],
    mistakes: ["Bouncing at the bottom.", "Using only a small range of motion."],
    alternatives: [],
  },
  {
    id: "plank",
    name: "Plank",
    equipment: "bodyweight",
    primary: ["core"],
    secondary: ["shoulders"],
    description: "Holds a straight body position on the forearms. Log seconds as reps.",
    steps: [
      "Forearms on the floor under the shoulders, legs straight behind.",
      "Squeeze the glutes and brace the stomach.",
      "Hold without letting the hips drop.",
    ],
    mistakes: ["Hips sagging toward the floor.", "Holding the breath."],
    alternatives: [],
  },
];

type StarterWorkout = {
  name: string;
  exercises: { id: string; sets: number; kg: number; reps: number }[];
};

/** Example plans so the app is usable on day one. The user can edit or delete them. */
export const STARTER_WORKOUTS: StarterWorkout[] = [
  {
    name: "Push Day",
    exercises: [
      { id: "shoulder-press", sets: 3, kg: 30, reps: 12 },
      { id: "chest-press", sets: 4, kg: 45, reps: 10 },
      { id: "incline-db-press", sets: 3, kg: 20, reps: 8 },
      { id: "pec-fly", sets: 3, kg: 35, reps: 12 },
      { id: "triceps-pushdown", sets: 4, kg: 25, reps: 12 },
      { id: "lateral-raise", sets: 3, kg: 8, reps: 15 },
    ],
  },
  {
    name: "Pull Day",
    exercises: [
      { id: "lat-pulldown", sets: 4, kg: 50, reps: 10 },
      { id: "seated-row", sets: 3, kg: 45, reps: 10 },
      { id: "cable-row", sets: 3, kg: 40, reps: 12 },
      { id: "biceps-curl", sets: 3, kg: 12, reps: 10 },
    ],
  },
  {
    name: "Leg Day",
    exercises: [
      { id: "leg-press", sets: 4, kg: 100, reps: 10 },
      { id: "leg-extension", sets: 3, kg: 40, reps: 12 },
      { id: "seated-leg-curl", sets: 3, kg: 35, reps: 12 },
      { id: "calf-raise", sets: 3, kg: 50, reps: 15 },
      { id: "plank", sets: 3, kg: 0, reps: 45 },
    ],
  },
];
