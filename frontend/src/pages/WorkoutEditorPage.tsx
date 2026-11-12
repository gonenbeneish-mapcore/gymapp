import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
import { Button } from "../ui/Button";
import { Sheet } from "../ui/Sheet";
import { NumberPadSheet } from "../ui/NumberPad";
import { ChevronDownIcon, ChevronLeftIcon, PlayIcon, PlusIcon } from "../ui/icons";
import { ExerciseThumb } from "../ui/ExerciseThumb";
import { ExerciseBrowser } from "./ExerciseBrowser";
import { RepRangePicker } from "./RepRangePicker";
import { useActiveSession, useCompletedSessions, useExerciseMap, useWorkout } from "../data/hooks";
import { deleteWorkout, updateWorkout } from "../data/workouts";
import { startWorkout } from "../data/sessions";
import type { Exercise, PlannedSet, Workout } from "../data/types";
import {
  REST_CHOICES,
  addExercise,
  addPlannedSet,
  editPlannedSet,
  exerciseSummary,
  moveExercise,
  removeExercise,
  removePlannedSet,
  renameWorkout,
  repsLabel,
  restLabel,
  setExerciseRest,
  setRepRange,
  sharedRepTarget,
  targetLabel,
  totalSets,
} from "../domain/workout";
import { nextSetType } from "../domain/session";
import { SET_TYPE_LABEL, SET_TYPE_MARK } from "../domain/labels";
import { kg } from "../domain/format";

type PadTarget = { ex: number; set: number; field: "kg" | "reps" };

export function WorkoutEditorPage() {
  const { id } = useParams();
  const workout = useWorkout(id);
  if (workout === undefined) return <div className="min-h-dvh bg-bg" aria-busy="true" />;
  if (workout === null) return <Navigate to="/train" replace />;
  return <Editor workout={workout} />;
}

function Editor({ workout: w }: { workout: Workout }) {
  const navigate = useNavigate();
  const exercises = useExerciseMap();
  const completed = useCompletedSessions();
  const active = useActiveSession();
  const [name, setName] = useState(w.name);
  const [open, setOpen] = useState<number | null>(null);
  const [pad, setPad] = useState<PadTarget | null>(null);
  const [restFor, setRestFor] = useState<number | null>(null);
  const [rangeFor, setRangeFor] = useState<number | null>(null);
  const [picking, setPicking] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [starting, setStarting] = useState(false);

  const edit = (fn: (w: Workout) => Workout) => void updateWorkout(w.id, fn);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  function rename(value: string) {
    setName(value);
    edit((x) => renameWorkout(x, value));
  }

  async function start() {
    setStarting(true);
    try {
      await startWorkout(w.id);
      navigate("/session");
    } finally {
      setStarting(false);
    }
  }

  const sets = totalSets(w);
  const padSet = pad ? w.exercises[pad.ex]?.sets[pad.set] : undefined;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pt-safe pb-[calc(110px+env(safe-area-inset-bottom))]">
      <header className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => navigate("/train")}
          className="-ml-1 flex h-11 items-center gap-1 text-base font-semibold text-accent-text"
        >
          <ChevronLeftIcon size={20} />
          Train
        </button>
        <button
          type="button"
          onClick={() => {
            if (!name.trim()) rename("Untitled workout");
            navigate("/train");
          }}
          className="h-11 px-1 text-base font-bold text-accent-text"
        >
          Done
        </button>
      </header>

      <div className="px-1">
        <label htmlFor="workout-name" className="text-xs font-bold uppercase tracking-[0.08em] text-ink-3">
          Workout name
        </label>
        <input
          id="workout-name"
          type="text"
          value={name}
          onChange={(e) => rename(e.target.value)}
          onBlur={() => {
            if (!name.trim()) rename("Untitled workout");
          }}
          placeholder="Push Day"
          autoComplete="off"
          enterKeyHint="done"
          className="mt-1 block w-full border-0 border-b border-divider bg-transparent pb-2 pt-1 font-display text-[30px] font-bold text-ink outline-none placeholder:text-ink-3 focus:border-accent"
        />
        <p className="mt-2 text-sm text-ink-3">
          {w.exercises.length} {w.exercises.length === 1 ? "exercise" : "exercises"} · {sets} {sets === 1 ? "set" : "sets"}
        </p>
      </div>

      <section aria-label="Exercises" className="flex flex-col gap-2">
        {w.exercises.length === 0 ? (
          <p className="rounded-panel bg-surface px-4 py-6 text-center text-[15px] text-ink-2">
            No exercises yet. Add the first one below.
          </p>
        ) : null}
        {w.exercises.map((x, i) => {
          const info = exercises?.get(x.exerciseId);
          const isOpen = open === i;
          const rest = x.restSeconds ?? w.restSeconds;
          return (
            <div
              key={`${x.exerciseId}-${i}`}
              className={clsx("overflow-hidden rounded-[18px] bg-surface", isOpen && "ring-1 ring-inset ring-accent")}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center gap-3 p-3 text-left"
              >
                {info ? <ExerciseThumb exercise={info} /> : null}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-semibold">{info?.name ?? x.exerciseId}</span>
                  <span className="mt-0.5 block text-[13px] text-ink-3 tabular">
                    {exerciseSummary(x)} · rest {restLabel(rest)}
                  </span>
                </span>
                <ChevronDownIcon size={18} className={clsx("shrink-0 text-ink-3 transition-transform", isOpen && "rotate-180")} />
              </button>

              {isOpen ? (
                <div className="flex flex-col gap-2 px-3.5 pb-3.5">
                  <div className="grid grid-cols-[44px_1fr_1fr_36px] gap-2 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-ink-3">
                    <span>Set</span>
                    <span>kg</span>
                    <span>Reps</span>
                    <span />
                  </div>
                  {x.sets.map((s, j) => (
                    <PlannedSetRow
                      key={j}
                      label={setLabel(x.sets, j)}
                      set={s}
                      onType={() => edit((y) => editPlannedSet(y, i, j, { type: nextType(s) }))}
                      onKg={() => setPad({ ex: i, set: j, field: "kg" })}
                      onReps={() => setPad({ ex: i, set: j, field: "reps" })}
                      onRemove={x.sets.length > 1 ? () => edit((y) => removePlannedSet(y, i, j)) : undefined}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => edit((y) => addPlannedSet(y, i))}
                    className="h-11 rounded-xl border border-dashed border-surface-3 text-sm font-semibold text-ink-2"
                  >
                    + Add set
                  </button>
                  <button
                    type="button"
                    onClick={() => setRangeFor(i)}
                    className="flex h-11 items-center justify-between rounded-xl bg-surface-2 px-3.5 text-sm"
                  >
                    <span className="font-semibold">Reps per set</span>
                    <span className="font-display font-bold tabular text-ink-2">{targetLabel(sharedRepTarget(x))}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRestFor(i)}
                    className="flex h-11 items-center justify-between rounded-xl bg-surface-2 px-3.5 text-sm"
                  >
                    <span className="font-semibold">Rest between sets</span>
                    <span className="font-display font-bold tabular text-ink-2">{restLabel(rest)}</span>
                  </button>
                  <div className="flex items-center gap-2 pt-1">
                    <SmallButton
                      label="Move up"
                      disabled={i === 0}
                      onClick={() => {
                        edit((y) => moveExercise(y, i, -1));
                        setOpen(i - 1);
                      }}
                    >
                      ↑ Up
                    </SmallButton>
                    <SmallButton
                      label="Move down"
                      disabled={i === w.exercises.length - 1}
                      onClick={() => {
                        edit((y) => moveExercise(y, i, 1));
                        setOpen(i + 1);
                      }}
                    >
                      ↓ Down
                    </SmallButton>
                    <span className="flex-1" />
                    <button
                      type="button"
                      onClick={() => {
                        edit((y) => removeExercise(y, i));
                        setOpen(null);
                      }}
                      className="h-10 px-2 text-sm font-semibold text-record-text"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setPicking(true)}
          className="flex h-[52px] items-center justify-center gap-2 rounded-2xl border border-dashed border-surface-3 text-[15px] font-bold text-accent-text"
        >
          <PlusIcon size={18} />
          Add exercise
        </button>
      </section>

      <button
        type="button"
        onClick={() => setConfirmDelete(true)}
        className="mt-4 h-11 self-center px-3 text-sm font-semibold text-record-text"
      >
        Delete workout
      </button>

      {w.exercises.length ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-divider bg-bg px-5 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-md">
            {active ? (
              <p className="py-3 text-center text-sm text-ink-2">Finish the workout in progress before starting this one.</p>
            ) : (
              <Button size="lg" block icon={<PlayIcon />} disabled={starting} onClick={start}>
                Start this workout
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {pad && padSet ? (
        <NumberPadSheet
          open
          title={
            pad.field === "kg"
              ? `Set ${setLabel(w.exercises[pad.ex].sets, pad.set)} · weight`
              : padSet.repsMax
                ? `Set ${setLabel(w.exercises[pad.ex].sets, pad.set)} · reps from (up to ${padSet.repsMax})`
                : `Set ${setLabel(w.exercises[pad.ex].sets, pad.set)} · reps`
          }
          unit={pad.field === "kg" ? "kg" : "reps"}
          initial={pad.field === "kg" ? kg(padSet.kg) : String(padSet.reps)}
          options={pad.field === "kg" ? { decimals: 2, maxInt: 3, step: 2.5 } : { decimals: 0, maxInt: 3, step: 1 }}
          onClose={() => setPad(null)}
          onDone={(v) => {
            const target = pad;
            setPad(null);
            const n = Number.parseFloat(v) || 0;
            if (target.field === "kg") {
              edit((y) => editPlannedSet(y, target.ex, target.set, { kg: n }));
            } else {
              const reps = Math.max(1, Math.round(n));
              edit((y) => {
                const top = y.exercises[target.ex]?.sets[target.set]?.repsMax;
                return editPlannedSet(y, target.ex, target.set, { reps, repsMax: top && top > reps ? top : undefined });
              });
            }
          }}
        />
      ) : null}

      <Sheet open={restFor !== null} onClose={() => setRestFor(null)} title="Rest between sets">
        {restFor !== null ? (
          <div className="flex flex-col gap-3">
            <h2 className="text-center text-[17px] font-bold">Rest between sets</h2>
            <div className="grid grid-cols-4 gap-2">
              {REST_CHOICES.map((sec) => {
                const current = (w.exercises[restFor]?.restSeconds ?? w.restSeconds) === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    aria-pressed={current}
                    onClick={() => {
                      const ex = restFor;
                      setRestFor(null);
                      edit((y) => setExerciseRest(y, ex, sec));
                    }}
                    className={clsx(
                      "h-14 rounded-[14px] font-display text-[17px] font-semibold tabular",
                      current ? "bg-accent text-accent-ink" : "bg-surface-2 text-ink",
                    )}
                  >
                    {restLabel(sec)}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </Sheet>

      <Sheet open={rangeFor !== null} onClose={() => setRangeFor(null)} title="Reps per set">
        {rangeFor !== null && w.exercises[rangeFor] ? (
          <RepRangePicker
            initial={sharedRepTarget(w.exercises[rangeFor]) ?? { min: w.exercises[rangeFor].sets[0].reps }}
            onApply={(min, max) => {
              const ex = rangeFor;
              setRangeFor(null);
              edit((y) => setRepRange(y, ex, min, max));
            }}
          />
        ) : null}
      </Sheet>

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete workout">
        <div className="flex flex-col gap-3 text-center">
          <h2 className="text-[17px] font-bold">Delete “{w.name}”?</h2>
          <p className="text-sm text-ink-2">The plan is removed. Workouts you already did from it stay in your history.</p>
          <Button
            size="lg"
            block
            className="!bg-record !text-[#0b0c0e]"
            onClick={async () => {
              await deleteWorkout(w.id);
              navigate("/train", { replace: true });
            }}
          >
            Delete workout
          </Button>
          <Button size="lg" block variant="secondary" onClick={() => setConfirmDelete(false)}>
            Keep it
          </Button>
        </div>
      </Sheet>

      {picking ? (
        <ExercisePicker
          inWorkout={new Set(w.exercises.map((x) => x.exerciseId))}
          onClose={() => setPicking(false)}
          onPick={(e) => {
            setPicking(false);
            edit((y) => addExercise(y, e.id, completed ?? []));
            setOpen(w.exercises.length);
          }}
        />
      ) : null}
    </main>
  );
}

function nextType(s: PlannedSet) {
  return nextSetType(s.type ?? "normal");
}

/** "1", "2", … for normal sets; W, D, F marks for warm-up, drop and failure sets. */
function setLabel(sets: PlannedSet[], i: number): string {
  const t = sets[i].type ?? "normal";
  if (t !== "normal") return SET_TYPE_MARK[t];
  return String(sets.slice(0, i + 1).filter((s) => (s.type ?? "normal") === "normal").length);
}

function PlannedSetRow({
  label,
  set,
  onType,
  onKg,
  onReps,
  onRemove,
}: {
  label: string;
  set: PlannedSet;
  onType: () => void;
  onKg: () => void;
  onReps: () => void;
  onRemove?: () => void;
}) {
  const type = set.type ?? "normal";
  const cell = "h-11 rounded-xl bg-surface-2 font-display text-[17px] font-bold tabular active:bg-surface-3";
  return (
    <div className="grid grid-cols-[44px_1fr_1fr_36px] items-center gap-2">
      <button
        type="button"
        onClick={onType}
        aria-label={`Set ${label}, ${SET_TYPE_LABEL[type]}. Tap to change type`}
        className={clsx(
          "h-11 rounded-xl font-display text-base font-bold",
          type === "normal" ? "text-ink-2" : "bg-accent-soft text-accent-text",
        )}
      >
        {label}
      </button>
      <button type="button" onClick={onKg} aria-label={`Set ${label} weight ${kg(set.kg)} kilograms, edit`} className={cell}>
        {kg(set.kg)}
      </button>
      <button type="button" onClick={onReps} aria-label={`Set ${label} ${repsLabel(set)} reps, edit`} className={cell}>
        {repsLabel(set)}
      </button>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove set ${label}`}
          className="flex h-11 items-center justify-center rounded-xl text-lg text-ink-3 active:bg-surface-2"
        >
          ×
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}

function SmallButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="h-10 rounded-xl bg-surface-2 px-3.5 text-sm font-semibold text-ink active:bg-surface-3 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/** Full-screen exercise bank for adding an exercise to the workout. */
function ExercisePicker({
  inWorkout,
  onClose,
  onPick,
}: {
  inWorkout: Set<string>;
  onClose: () => void;
  onPick: (e: Exercise) => void;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Add exercise" className="fixed inset-0 z-50 overflow-y-auto bg-bg animate-fade">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-5 pt-safe pb-[calc(40px+env(safe-area-inset-bottom))]">
        <header className="flex items-center justify-between pt-2">
          <h1 className="font-display text-[28px] font-bold tracking-[-0.02em]">Add exercise</h1>
          <button type="button" onClick={onClose} className="h-11 px-1 text-base font-semibold text-accent-text">
            Cancel
          </button>
        </header>
        <ExerciseBrowser onPick={onPick} picked={inWorkout} />
      </div>
    </div>,
    document.body,
  );
}
