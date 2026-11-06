import { NavLink } from "react-router-dom";
import clsx from "clsx";
import type { ComponentType, SVGProps } from "react";
import {
  ExercisesIcon,
  ExercisesIconSolid,
  HistoryIcon,
  HistoryIconSolid,
  MeasureIcon,
  MeasureIconSolid,
  TrainIcon,
  TrainIconSolid,
} from "./icons";

type Icon = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

const tabs: { to: string; label: string; icon: Icon; active: Icon }[] = [
  { to: "/train", label: "Train", icon: TrainIcon, active: TrainIconSolid },
  { to: "/exercises", label: "Exercises", icon: ExercisesIcon, active: ExercisesIconSolid },
  { to: "/measure", label: "Measure", icon: MeasureIcon, active: MeasureIconSolid },
  { to: "/history", label: "History", icon: HistoryIcon, active: HistoryIconSolid },
];

export function TabBar() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-divider backdrop-blur-xl pb-safe"
      style={{ background: "var(--tab-bar)" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-4 px-2.5 pt-2 pb-1.5">
        {tabs.map(({ to, label, icon: Icon, active: ActiveIcon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                "flex min-h-[52px] flex-col items-center justify-center gap-[3px] text-[11px]",
                isActive ? "font-bold text-ink" : "font-semibold text-ink-3",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={clsx(
                    "flex h-[30px] w-14 items-center justify-center rounded-full transition-colors",
                    isActive && "bg-accent-soft",
                  )}
                  style={isActive ? { color: "var(--tab-active)" } : undefined}
                >
                  {isActive ? <ActiveIcon /> : <Icon />}
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
