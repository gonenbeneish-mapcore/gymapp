import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

/** Outline icon on a 24px grid: 1.8px stroke, round caps and joins. */
function Outline({ size = 24, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Solid icon: shapes filled with currentColor, details cut out in `cutout`. */
function Solid({ size = 24, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

const CUTOUT = "var(--tab-cutout)";

/* ---------- Tab icons (outline + solid) ---------- */

export const TrainIcon = (p: IconProps) => (
  <Outline {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
    <path d="m9.2 15.2 2 2 3.8-3.9" />
  </Outline>
);
export const TrainIconSolid = (p: IconProps) => (
  <Solid {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3.5" fill="currentColor" />
    <path d="M8 3v4M16 3v4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    <path d="M3.5 10h17" stroke={CUTOUT} strokeWidth={1.6} />
    <path
      d="m9.2 15.2 2 2 3.8-3.9"
      stroke={CUTOUT}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Solid>
);

export const ExercisesIcon = (p: IconProps) => (
  <Outline {...p}>
    <rect x="2.5" y="9.5" width="2.5" height="5" rx="1" />
    <rect x="5" y="6.5" width="3.5" height="11" rx="1.3" />
    <rect x="15.5" y="6.5" width="3.5" height="11" rx="1.3" />
    <rect x="19" y="9.5" width="2.5" height="5" rx="1" />
    <path d="M8.5 12h7" />
  </Outline>
);
export const ExercisesIconSolid = (p: IconProps) => (
  <Solid {...p}>
    <rect x="2.5" y="9.5" width="2.5" height="5" rx="1" fill="currentColor" />
    <rect x="5" y="6.5" width="3.5" height="11" rx="1.3" fill="currentColor" />
    <rect x="15.5" y="6.5" width="3.5" height="11" rx="1.3" fill="currentColor" />
    <rect x="19" y="9.5" width="2.5" height="5" rx="1" fill="currentColor" />
    <path d="M8.5 12h7" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" />
  </Solid>
);

export const MeasureIcon = (p: IconProps) => (
  <Outline {...p}>
    <circle cx="9" cy="11.5" r="6.5" />
    <circle cx="9" cy="11.5" r="2" />
    <path d="M9 18h12v-3.5M14.5 18v-2M18 18v-2" />
  </Outline>
);
export const MeasureIconSolid = (p: IconProps) => (
  <Solid {...p}>
    <circle cx="9" cy="11.5" r="6.5" fill="currentColor" />
    <circle cx="9" cy="11.5" r="2" fill={CUTOUT} />
    <path
      d="M9 18h12v-3.5M14.5 18v-2M18 18v-2"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Solid>
);

export const HistoryIcon = (p: IconProps) => (
  <Outline {...p}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5" />
    <path d="M3.5 4.5v4h4" />
    <path d="M12 8v4.3l2.8 1.8" />
  </Outline>
);
export const HistoryIconSolid = (p: IconProps) => (
  <Solid {...p}>
    <circle cx="12" cy="12" r="8.5" fill="currentColor" />
    <path
      d="M12 8v4.3l2.8 1.8"
      stroke={CUTOUT}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Solid>
);

/* ---------- General icons ---------- */

export const CheckIcon = (p: IconProps) => (
  <Outline strokeWidth={3} {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Outline>
);
export const ChevronRightIcon = (p: IconProps) => (
  <Outline strokeWidth={2} {...p}>
    <path d="m9 6 6 6-6 6" />
  </Outline>
);
export const ChevronLeftIcon = (p: IconProps) => (
  <Outline strokeWidth={2} {...p}>
    <path d="m15 6-6 6 6 6" />
  </Outline>
);
export const ChevronDownIcon = (p: IconProps) => (
  <Outline strokeWidth={2} {...p}>
    <path d="m6 9 6 6 6-6" />
  </Outline>
);
export const CalendarIcon = (p: IconProps) => (
  <Outline {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Outline>
);
export const PlusIcon = (p: IconProps) => (
  <Outline strokeWidth={2.2} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Outline>
);
export const PlayIcon = ({ size = 18, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
    <path d="M7 4.5v15l13-7.5z" />
  </svg>
);
export const SlidersIcon = (p: IconProps) => (
  <Outline {...p}>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </Outline>
);
export const SearchIcon = (p: IconProps) => (
  <Outline strokeWidth={2} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Outline>
);
export const DownloadIcon = (p: IconProps) => (
  <Outline strokeWidth={2} {...p}>
    <path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" />
  </Outline>
);
export const TrophyIcon = (p: IconProps) => (
  <Outline strokeWidth={2} {...p}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8" />
  </Outline>
);
export const BackspaceIcon = (p: IconProps) => (
  <Outline strokeWidth={2} {...p}>
    <path d="M20 6H9l-5 6 5 6h11a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1z" />
    <path d="m12.5 10 4 4m0-4-4 4" />
  </Outline>
);
export const MachineIcon = (p: IconProps) => (
  <Outline {...p}>
    <rect x="5" y="3" width="14" height="18" rx="2.5" />
    <path d="M9 8h6M9 12h6M9 16h6" />
  </Outline>
);
export const CableIcon = (p: IconProps) => (
  <Outline {...p}>
    <circle cx="12" cy="5" r="2.2" />
    <path d="M12 7.2V17M8.5 20h7M12 17l-3.5 3M12 17l3.5 3" />
  </Outline>
);
export const BodyweightIcon = (p: IconProps) => (
  <Outline {...p}>
    <circle cx="12" cy="4.5" r="2" />
    <path d="M12 7v7M7 10h10M9 21l3-7 3 7" />
  </Outline>
);
