import { useState } from "react";
import clsx from "clsx";
import { Button } from "../ui/Button";
import { REP_RANGE_PRESETS } from "../domain/workout";

/**
 * Pick a fixed rep count or a range. With a range, the workout suggests adding
 * weight once every set reaches the top of it.
 */
export function RepRangePicker({
  initial,
  onApply,
}: {
  initial: { min: number; max?: number };
  onApply: (min: number, max?: number) => void;
}) {
  const startsAsRange = !!initial.max && initial.max > initial.min;
  const [useRange, setUseRange] = useState(startsAsRange);
  const [min, setMin] = useState(initial.min);
  const [max, setMax] = useState(startsAsRange ? initial.max! : initial.min + 4);
  const clamp = (n: number) => Math.max(1, Math.min(100, n));

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-center text-[17px] font-bold">Reps per set</h2>
      <div role="radiogroup" aria-label="Rep target" className="grid grid-cols-2 gap-2 rounded-2xl bg-surface-2 p-1">
        <Choice on={!useRange} onClick={() => setUseRange(false)}>
          Fixed number
        </Choice>
        <Choice on={useRange} onClick={() => setUseRange(true)}>
          Range
        </Choice>
      </div>

      {useRange ? (
        <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Common ranges">
          {REP_RANGE_PRESETS.map(([a, b]) => (
            <button
              key={`${a}-${b}`}
              type="button"
              aria-pressed={min === a && max === b}
              onClick={() => {
                setMin(a);
                setMax(b);
              }}
              className={clsx(
                "h-10 rounded-full px-3.5 font-display text-[15px] font-semibold tabular",
                min === a && max === b ? "bg-accent text-accent-ink" : "bg-surface-2 text-ink",
              )}
            >
              {a}–{b}
            </button>
          ))}
        </div>
      ) : null}

      <div className={clsx("grid gap-3", useRange ? "grid-cols-2" : "grid-cols-1")}>
        <Stepper
          label={useRange ? "From" : "Reps"}
          value={min}
          onChange={(n) => {
            const v = clamp(n);
            setMin(v);
            if (useRange && max <= v) setMax(v + 1);
          }}
        />
        {useRange ? <Stepper label="To" value={max} onChange={(n) => setMax(Math.max(min + 1, clamp(n)))} /> : null}
      </div>

      {useRange ? (
        <p className="text-center text-[13px] text-ink-2">
          When you reach {max} reps on every set, the workout suggests adding weight.
        </p>
      ) : null}

      <Button size="lg" block onClick={() => onApply(min, useRange ? max : undefined)}>
        Apply to all work sets
      </Button>
    </div>
  );
}

function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={clsx("h-11 rounded-xl text-[15px] font-semibold", on ? "bg-ink text-bg" : "text-ink-2")}
    >
      {children}
    </button>
  );
}

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface-2 p-3">
      <span className="text-xs font-bold uppercase tracking-[0.08em] text-ink-3">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`${label}: one less`}
          onClick={() => onChange(value - 1)}
          className="h-11 w-11 rounded-xl bg-surface-3 text-xl font-semibold"
        >
          −
        </button>
        <span className="min-w-[2.5ch] text-center font-display text-[28px] font-bold tabular" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          aria-label={`${label}: one more`}
          onClick={() => onChange(value + 1)}
          className="h-11 w-11 rounded-xl bg-surface-3 text-xl font-semibold"
        >
          +
        </button>
      </div>
    </div>
  );
}
