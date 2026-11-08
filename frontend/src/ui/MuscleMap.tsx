import type { Muscle } from "../data/types";
import { MUSCLE_LABEL } from "../domain/labels";
import { BACK_OUTLINE, BACK_PARTS, FRONT_OUTLINE, FRONT_PARTS, type BodyPart } from "./bodyDrawing";

/**
 * Front and back body with the worked muscles filled in: main muscles solid,
 * helper muscles faded. Used as an exercise's picture until the user adds a photo.
 * Colours come from the --body-* and --muscle-hit tokens, so it follows the theme and accent.
 */

type Level = "primary" | "secondary" | "none";

function fillFor(part: BodyPart, level: Level) {
  if (level === "primary") return { fill: "var(--muscle-hit)" };
  if (level === "secondary") return { fill: "var(--muscle-hit)", fillOpacity: 0.42 };
  if (part.head) return { fill: "var(--body-head)" };
  if (part.muscle) return { fill: "var(--body-muscle)" };
  return { fill: "var(--body)" };
}

function View({ outline, parts, level }: { outline: string; parts: BodyPart[]; level: (m?: Muscle) => Level }) {
  return (
    <g>
      <path d={outline} fill="var(--body)" stroke="var(--body-outline)" strokeWidth={7} strokeLinejoin="round" />
      {parts.map((p, i) => (
        <path
          key={i}
          d={p.d}
          {...fillFor(p, level(p.muscle))}
          stroke="var(--body-line)"
          strokeWidth={5}
          strokeLinejoin="round"
        />
      ))}
    </g>
  );
}

export function MuscleMap({
  primary,
  secondary,
  className,
}: {
  primary: Muscle[];
  secondary: Muscle[];
  className?: string;
}) {
  const level = (m?: Muscle): Level =>
    !m ? "none" : primary.includes(m) ? "primary" : secondary.includes(m) ? "secondary" : "none";
  const label =
    `Muscles worked: ${primary.map((m) => MUSCLE_LABEL[m]).join(", ")}` +
    (secondary.length ? `; also ${secondary.map((m) => MUSCLE_LABEL[m]).join(", ")}` : "");
  // Front view sits at x 0–724 and back view at 724–1448; the viewBox trims the empty margin.
  return (
    <svg viewBox="40 86 1368 1276" role="img" aria-label={label} className={className}>
      <View outline={FRONT_OUTLINE} parts={FRONT_PARTS} level={level} />
      <View outline={BACK_OUTLINE} parts={BACK_PARTS} level={level} />
    </svg>
  );
}
