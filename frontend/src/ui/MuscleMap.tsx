import type { ReactElement } from "react";
import type { Muscle } from "../data/types";
import { MUSCLE_LABEL } from "../domain/labels";

/**
 * Front and back body outline with the worked muscles filled in.
 * Our own drawing, used as an exercise's picture until the user adds a photo.
 */

type Part = { muscle?: Muscle; shape: ReactElement };

// Shapes for one side of the body, centred on x = 0. They are mirrored for the other side.
const FRONT_SIDE: Part[] = [
  { muscle: "shoulders", shape: <ellipse cx={-25} cy={47} rx={8.5} ry={9.5} /> },
  { muscle: "chest", shape: <path d="M-2 40C-10 39-19 41-22 47C-24 54-21 61-13 63C-7 64-3 62-2 59Z" /> },
  { muscle: "biceps", shape: <ellipse cx={-30} cy={70} rx={6} ry={13} transform="rotate(10 -30 70)" /> },
  { shape: <ellipse cx={-35} cy={98} rx={5} ry={14} transform="rotate(12 -35 98)" /> },
  { shape: <circle cx={-39} cy={117} r={4.5} /> },
  { muscle: "core", shape: <path d="M-15 66C-19 76-20 92-17 107L-15.5 107L-15.5 66Z" /> },
  { muscle: "quads", shape: <ellipse cx={-11.5} cy={153} rx={8.5} ry={24} transform="rotate(-4 -11.5 153)" /> },
  { muscle: "adductors", shape: <ellipse cx={-3.6} cy={140} rx={3.1} ry={12.5} /> },
  { shape: <circle cx={-11} cy={181} r={4.5} /> },
  { muscle: "calves", shape: <ellipse cx={-12} cy={203} rx={5.5} ry={17} /> },
  { shape: <ellipse cx={-13} cy={225} rx={6} ry={3} /> },
];

const FRONT_CENTRE: Part[] = [
  { shape: <circle cx={0} cy={15} r={11} /> },
  { shape: <rect x={-4.5} y={26} width={9} height={11} rx={3} /> },
  { muscle: "core", shape: <rect x={-13} y={65} width={26} height={44} rx={8} /> },
  { shape: <path d="M-17 111L17 111L14 125L0 131L-14 125Z" /> },
];

const BACK_SIDE: Part[] = [
  { muscle: "shoulders", shape: <ellipse cx={-25} cy={47} rx={8.5} ry={9.5} /> },
  { muscle: "back", shape: <path d="M-9 60L-15 50C-20 50-22 56-21 64C-20 78-17 92-10.5 104L-9.5 104Z" /> },
  { muscle: "triceps", shape: <ellipse cx={-30} cy={70} rx={6} ry={13} transform="rotate(10 -30 70)" /> },
  { shape: <ellipse cx={-35} cy={98} rx={5} ry={14} transform="rotate(12 -35 98)" /> },
  { shape: <circle cx={-39} cy={117} r={4.5} /> },
  { muscle: "glutes", shape: <ellipse cx={-9} cy={121} rx={9.5} ry={10.5} /> },
  { muscle: "hamstrings", shape: <ellipse cx={-11.5} cy={156} rx={8} ry={21.5} transform="rotate(-4 -11.5 156)" /> },
  { muscle: "adductors", shape: <ellipse cx={-3.4} cy={146} rx={2.8} ry={10} /> },
  { shape: <circle cx={-11} cy={182} r={4} /> },
  { muscle: "calves", shape: <ellipse cx={-12} cy={202} rx={6.5} ry={17} /> },
  { shape: <ellipse cx={-13} cy={225} rx={6} ry={3} /> },
];

const BACK_CENTRE: Part[] = [
  { shape: <circle cx={0} cy={15} r={11} /> },
  { shape: <rect x={-4.5} y={26} width={9} height={11} rx={3} /> },
  { muscle: "back", shape: <path d="M0 33L-14 41L-8.5 62L0 72L8.5 62L14 41Z" /> },
  { muscle: "back", shape: <rect x={-8} y={75} width={16} height={33} rx={5} /> },
];

type Level = "primary" | "secondary" | "none";

function paint(level: Level) {
  if (level === "primary") return { fill: "var(--accent)", stroke: "var(--accent-text)", strokeWidth: 1.2 };
  if (level === "secondary")
    return { fill: "var(--accent)", fillOpacity: 0.38, stroke: "var(--accent-text)", strokeOpacity: 0.55, strokeWidth: 1 };
  return { fill: "var(--text-3)", fillOpacity: 0.22 };
}

function Figure({ side, centre, x, level }: { side: Part[]; centre: Part[]; x: number; level: (m?: Muscle) => Level }) {
  const draw = (parts: Part[], key: string) =>
    parts.map((p, i) => (
      <g key={`${key}${i}`} {...paint(level(p.muscle))}>
        {p.shape}
      </g>
    ));
  return (
    <g transform={`translate(${x} 4)`}>
      {draw(centre, "c")}
      {draw(side, "l")}
      <g transform="scale(-1 1)">{draw(side, "r")}</g>
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
  return (
    <svg viewBox="0 0 230 238" role="img" aria-label={label} className={className}>
      <Figure side={FRONT_SIDE} centre={FRONT_CENTRE} x={60} level={level} />
      <Figure side={BACK_SIDE} centre={BACK_CENTRE} x={170} level={level} />
    </svg>
  );
}
