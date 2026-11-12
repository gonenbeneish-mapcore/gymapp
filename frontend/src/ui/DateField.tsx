import { useState } from "react";
import clsx from "clsx";
import { CalendarIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "./icons";
import { Sheet } from "./Sheet";
import { dateLabel, fromDateInput, monthGrid, shiftMonth, toDateInput } from "../domain/dates";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * A date shown as a chip. Tapping it opens our own month calendar in a sheet,
 * so it looks and works the same on iPhone and on a computer.
 */
export function DateField({
  value,
  max,
  onChange,
  label = "Date",
  marked,
}: {
  value: string;
  /** Latest day that can be picked (usually today). */
  max: string;
  onChange: (value: string) => void;
  label?: string;
  /** Days that already have an entry get a small dot. */
  marked?: Set<string>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={`${label}: ${dateLabel(value, max)}. Change date`}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="mx-auto flex h-11 items-center gap-2 rounded-full bg-surface-2 px-4 text-[15px] font-semibold text-ink active:bg-surface-3"
      >
        <CalendarIcon size={16} className="text-ink-2" />
        <span>{dateLabel(value, max)}</span>
        <ChevronDownIcon size={14} className="text-ink-3" />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        {open ? (
          <Calendar
            value={value}
            max={max}
            marked={marked}
            onPick={(d) => {
              onChange(d);
              setOpen(false);
            }}
          />
        ) : null}
      </Sheet>
    </>
  );
}

type Mode = "days" | "months" | "years";

/** How many years back the year step offers. */
const YEARS_BACK = 14;

function Calendar({
  value,
  max,
  marked,
  onPick,
}: {
  value: string;
  max: string;
  marked?: Set<string>;
  onPick: (value: string) => void;
}) {
  const start = fromDateInput(value);
  const [view, setView] = useState({ year: start.getFullYear(), month: start.getMonth() });
  const [mode, setMode] = useState<Mode>("days");
  const maxDate = fromDateInput(max);
  const maxYear = maxDate.getFullYear();
  const atLatestMonth = view.year > maxYear || (view.year === maxYear && view.month >= maxDate.getMonth());
  const yesterday = toDateInput(new Date(maxYear, maxDate.getMonth(), maxDate.getDate() - 1).getTime());
  const title = new Date(view.year, view.month, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  if (mode === "years") {
    const years = Array.from({ length: YEARS_BACK + 1 }, (_, i) => maxYear - i);
    return (
      <div className="flex flex-col gap-3">
        <StepHeader title="Pick a year" onBack={() => setMode("days")} />
        <div className="grid grid-cols-3 gap-2">
          {years.map((y) => (
            <ChoiceButton
              key={y}
              selected={y === view.year}
              onClick={() => {
                setView((v) => ({ year: y, month: y === maxYear ? Math.min(v.month, maxDate.getMonth()) : v.month }));
                setMode("months");
              }}
            >
              {y}
            </ChoiceButton>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "months") {
    return (
      <div className="flex flex-col gap-3">
        <StepHeader title={`Pick a month in ${view.year}`} onBack={() => setMode("years")} backLabel="Back to years" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }, (_, m) => (
            <ChoiceButton
              key={m}
              selected={m === view.month}
              disabled={view.year === maxYear && m > maxDate.getMonth()}
              onClick={() => {
                setView({ year: view.year, month: m });
                setMode("days");
              }}
            >
              {new Date(view.year, m, 1).toLocaleDateString("en-GB", { month: "short" })}
            </ChoiceButton>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setView((v) => shiftMonth(v.year, v.month, -1))}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-ink active:bg-surface-3"
        >
          <ChevronLeftIcon size={20} />
        </button>
        <button
          type="button"
          aria-label={`${title}. Change month or year`}
          onClick={() => setMode("years")}
          className="flex h-11 items-center gap-1.5 rounded-full px-3 font-display text-lg font-bold active:bg-surface-2"
        >
          <span aria-live="polite">{title}</span>
          <ChevronDownIcon size={16} className="text-ink-3" />
        </button>
        <button
          type="button"
          aria-label="Next month"
          disabled={atLatestMonth}
          onClick={() => setView((v) => shiftMonth(v.year, v.month, 1))}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-ink active:bg-surface-3 disabled:opacity-30"
        >
          <ChevronRightIcon size={20} />
        </button>
      </div>

      <div role="grid" aria-label={title} className="flex flex-col gap-1">
        <div role="row" className="grid grid-cols-7 text-center text-xs font-semibold text-ink-3">
          {WEEKDAYS.map((d) => (
            <span key={d} role="columnheader" aria-label={d}>
              {d[0]}
            </span>
          ))}
        </div>
        {monthGrid(view.year, view.month).map((week, i) => (
          <div key={i} role="row" className="grid grid-cols-7 gap-1">
            {week.map((day, j) => {
              if (!day) return <span key={j} role="gridcell" />;
              const selected = day === value;
              const isToday = day === max;
              const future = day > max;
              const has = marked?.has(day);
              return (
                <span key={day} role="gridcell">
                  <button
                    type="button"
                    disabled={future}
                    aria-pressed={selected}
                    aria-label={
                      fromDateInput(day).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) +
                      (isToday ? ", today" : "") +
                      (has ? ", has an entry" : "")
                    }
                    onClick={() => onPick(day)}
                    className={clsx(
                      "relative flex h-11 w-full flex-col items-center justify-center rounded-[14px] font-display text-[17px] font-semibold tabular transition-colors",
                      selected
                        ? "bg-accent text-accent-ink"
                        : isToday
                          ? "bg-surface-2 text-ink ring-2 ring-inset ring-[var(--muscle-hit)]"
                          : "text-ink active:bg-surface-2",
                      future && "text-ink-3 opacity-40",
                    )}
                  >
                    {Number(day.slice(8))}
                    {has ? (
                      <span
                        aria-hidden="true"
                        className={clsx(
                          "absolute bottom-1.5 h-1 w-1 rounded-full",
                          selected ? "bg-accent-ink" : "bg-[var(--muscle-hit)]",
                        )}
                      />
                    ) : null}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={() => onPick(max)}
          className="h-12 rounded-[14px] bg-surface-2 text-[15px] font-semibold text-ink active:bg-surface-3"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => onPick(yesterday)}
          className="h-12 rounded-[14px] bg-surface-2 text-[15px] font-semibold text-ink active:bg-surface-3"
        >
          Yesterday
        </button>
      </div>
    </div>
  );
}

function StepHeader({ title, onBack, backLabel = "Back to days" }: { title: string; onBack: () => void; backLabel?: string }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label={backLabel}
        onClick={onBack}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink active:bg-surface-3"
      >
        <ChevronLeftIcon size={20} />
      </button>
      <h2 className="font-display text-lg font-bold">{title}</h2>
    </div>
  );
}

function ChoiceButton({
  selected,
  disabled,
  onClick,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: string | number;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "h-14 rounded-[14px] font-display text-[17px] font-semibold tabular transition-colors",
        selected ? "bg-accent text-accent-ink" : "bg-surface-2 text-ink active:bg-surface-3",
        disabled && "opacity-30",
      )}
    >
      {children}
    </button>
  );
}
