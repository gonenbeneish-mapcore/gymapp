import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useActiveSession, useCompletedSessions, useExerciseMap, useNotesMap } from "../data/hooks";
import { addWeightHint } from "../domain/progression";
import { discardSession, finishSession, saveSetup, updateSession } from "../data/sessions";
import type { Session, SessionSet } from "../data/types";
import {
  addSet,
  adjustRest,
  applyWeight,
  lastPerformance,
  doneSetCount,
  editSet,
  isExerciseComplete,
  nextOpenExercise,
  nextSetType,
  toggleSet,
} from "../domain/session";
import { EQUIPMENT_LABEL, MUSCLE_LABEL, SET_TYPE_LABEL, SET_TYPE_MARK } from "../domain/labels";
import { clock, kg } from "../domain/format";
import { useNow } from "../lib/useNow";
import { useWakeLock } from "../lib/useWakeLock";
import { CheckIcon, ChevronDownIcon, SlidersIcon } from "../ui/icons";
import { NumberPadSheet } from "../ui/NumberPad";
import { Sheet } from "../ui/Sheet";
import { Button } from "../ui/Button";

type PadTarget = { exIndex: number; setIndex: number; field: "kg" | "reps" };

export function SessionPage() {
  const session = useActiveSession();
  const exercises = useExerciseMap();
  const notes = useNotesMap();
  useWakeLock(!!session);

  if (session === null) return <Navigate to="/train" replace />;
  if (!session || !exercises || !notes) return <div className="min-h-dvh bg-bg" aria-busy="true" />;
  return <ActiveSession session={session} exercises={exercises} notes={notes} />;
}

function ActiveSession({
  session,
  exercises,
  notes,
}: {
  session: Session;
  exercises: NonNullable<ReturnType<typeof useExerciseMap>>;
  notes: NonNullable<ReturnType<typeof useNotesMap>>;
}) {
  const navigate = useNavigate();
  const now = useNow(250);
  const [pad, setPad] = useState<PadTarget | null>(null);
  const [finishOpen, setFinishOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const cur = Math.min(session.currentIndex, session.exercises.length - 1);
  const ex = session.exercises[cur];
  const info = ex ? exercises.get(ex.exerciseId) : undefined;
  const setup = ex ? notes.get(ex.exerciseId)?.mySetup : undefined;
  const completed = useCompletedSessions();
  // The plan's rep target for this exercise ("8–12"), and whether it's time to add weight.
  const work = ex ? ex.sets.filter((x) => x.type !== "warmup" && x.targetReps != null) : [];
  const target = work.length
    ? (() => {
        const lo = Math.min(...work.map((x) => x.targetReps!));
        const hi = Math.max(...work.map((x) => x.targetRepsMax ?? x.targetReps!));
        return hi > lo ? `${lo}–${hi}` : String(lo);
      })()
    : null;
  const hint =
    ex && info && completed
      ? addWeightHint(ex, lastPerformance(ex.exerciseId, completed.filter((c) => c.id !== session.id)), {
          equipment: info.equipment,
          plateKg: notes.get(ex.exerciseId)?.plateKg ?? info.machine?.plateKg,
          addOnKg: info.machine?.addOnKg,
          stackKg: info.machine?.stackKg,
        })
      : null;
  const firstOpen = ex ? ex.sets.findIndex((s) => !s.done) : -1;
  const completeCount = session.exercises.filter(isExerciseComplete).length;
  const totalSets = session.exercises.reduce((n, x) => n + x.sets.length, 0);
  const update = (fn: (s: Session) => Session) => updateSession(session.id, fn);

  useEffect(() => {
    chipRefs.current[cur]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [cur]);

  const restLeftMs = session.restEndsAt != null ? session.restEndsAt - now : null;
  const resting = restLeftMs != null && restLeftMs > 0;
  const restOver = restLeftMs != null && restLeftMs <= 0;

  const nextUp = (() => {
    if (!ex) return "";
    if (firstOpen !== -1) {
      const s = ex.sets[firstOpen];
      return `set ${setLabel(ex.sets, firstOpen)} · ${kg(s.kg)} kg × ${s.reps}`;
    }
    const n = nextOpenExercise(session, cur);
    return n === -1 ? "all done — tap Finish" : (exercises.get(session.exercises[n].exerciseId)?.name ?? "next exercise");
  })();

  function onToggle(setIndex: number) {
    void update((s) => {
      let next = toggleSet(s, cur, setIndex, Date.now());
      const nowDone = next.exercises[cur].sets[setIndex].done;
      if (nowDone && isExerciseComplete(next.exercises[cur])) {
        const n = nextOpenExercise(next, cur);
        if (n !== -1) next = { ...next, currentIndex: n };
      }
      return next;
    });
  }

  if (!ex) return <Navigate to="/train" replace />;

  return (
    <div className="mx-auto min-h-dvh max-w-md pb-[calc(200px+env(safe-area-inset-bottom))] pt-safe">
      <header className="flex items-center justify-between gap-2 px-4 pt-2">
        <Link
          to="/train"
          aria-label="Minimise workout"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink"
        >
          <ChevronDownIcon size={20} />
        </Link>
        <div className="text-center">
          <div className="font-display text-[22px] font-bold tabular tracking-[-0.01em]">
            {clock((now - session.startedAt) / 1000)}
          </div>
          <div className="text-xs font-semibold text-ink-3">
            {session.name} · {completeCount} of {session.exercises.length} done
          </div>
        </div>
        <Button size="sm" onClick={() => setFinishOpen(true)}>
          Finish
        </Button>
      </header>

      <nav aria-label="Exercises in this workout" className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-4">
        {session.exercises.map((x, i) => {
          const name = exercises.get(x.exerciseId)?.name ?? x.exerciseId;
          const n = x.sets.filter((s) => s.done).length;
          const complete = isExerciseComplete(x);
          const isCur = i === cur;
          return (
            <button
              key={x.key}
              ref={(el) => {
                chipRefs.current[i] = el;
              }}
              type="button"
              aria-current={isCur ? "step" : undefined}
              aria-label={`${name}, ${n} of ${x.sets.length} sets done`}
              onClick={() => void update((s) => ({ ...s, currentIndex: i }))}
              className={clsx(
                "flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm",
                isCur ? "bg-ink font-bold text-bg" : "bg-surface font-semibold",
                !isCur && complete ? "text-ink-3" : !isCur && "text-ink",
              )}
            >
              {complete && !isCur ? <CheckIcon size={15} className="text-accent-text" /> : null}
              {name}
              {!complete || isCur ? (
                <span className={clsx("text-xs", isCur ? "text-bg opacity-60" : "text-ink-3")}>
                  {n}/{x.sets.length}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="mt-[18px] flex flex-col gap-4 px-4">
        <section>
          <h1 className="font-display text-[30px] font-bold leading-[1.05] tracking-[-0.03em]">
            {info?.name ?? ex.exerciseId}
          </h1>
          {info ? (
            <div className="mt-1.5 text-sm text-ink-2">
              {EQUIPMENT_LABEL[info.equipment]} · {info.primary.map((m) => MUSCLE_LABEL[m]).join(", ")}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setSetupOpen(true)}
            className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-full bg-surface pl-2.5 pr-3 text-[13px] font-semibold text-ink"
          >
            <SlidersIcon size={14} className="text-ink-3" />
            {setup ?? <span className="text-ink-3">Add my setup (seat, pads…)</span>}
          </button>
          {target ? (
            <div className="mt-2 text-sm text-ink-2">
              Aim for <strong className="font-semibold text-ink">{target} reps</strong> a set
            </div>
          ) : null}
        </section>

        {hint ? (
          <section
            aria-label="Time to add weight"
            className="flex items-center gap-3 rounded-[18px] bg-accent-soft px-4 py-3 animate-rise"
          >
            <div className="min-w-0 flex-1 text-sm text-ink">
              <div className="font-bold text-accent-text">
                {hint.next.how === "top" ? "Top of the stack" : "Time to go heavier"}
              </div>
              <div className="mt-0.5 text-ink-2">
                Last time you hit {hint.topReps}+ reps on every set at {kg(hint.lastKg)} kg.
                {hint.next.how === "top"
                  ? " This machine can't go heavier, so add reps or slow the lowering down."
                  : hint.next.how === "add-on"
                    ? " Flip the add-on lever."
                    : hint.next.how === "plate"
                      ? " Move the pin one plate down."
                      : ""}
              </div>
            </div>
            {hint.next.how !== "top" ? (
              <button
                type="button"
                onClick={() => {
                  const next = hint.next;
                  if (next.how !== "top") void update((s) => applyWeight(s, cur, next.kg));
                }}
                className="h-11 shrink-0 rounded-[14px] bg-accent px-3.5 text-sm font-bold text-accent-ink"
              >
                Use {kg(hint.next.kg)} kg
              </button>
            ) : null}
          </section>
        ) : null}

        <section aria-label="Sets" className="flex flex-col gap-1">
          <div className="grid grid-cols-[34px_1fr_74px_58px_48px] gap-2 px-2 pb-1 text-[11px] font-bold uppercase tracking-[0.06em] text-ink-3">
            <span className="text-center">Set</span>
            <span>Previous</span>
            <span className="text-center">kg</span>
            <span className="text-center">Reps</span>
            <span />
          </div>
          {ex.sets.map((set, i) => (
            <SetRow
              key={i}
              label={setLabel(ex.sets, i)}
              set={set}
              state={set.done ? "done" : i === firstOpen ? "active" : "later"}
              onType={() => void update((s) => editSet(s, cur, i, { type: nextSetType(set.type) }))}
              onKg={() => setPad({ exIndex: cur, setIndex: i, field: "kg" })}
              onReps={() => setPad({ exIndex: cur, setIndex: i, field: "reps" })}
              onToggle={() => onToggle(i)}
            />
          ))}
          <button
            type="button"
            onClick={() => void update((s) => addSet(s, cur))}
            className="mt-0.5 h-11 rounded-[14px] text-sm font-semibold text-ink-2"
          >
            + Add set
          </button>
        </section>
      </div>

      {resting ? (
        <div
          role="timer"
          aria-label="Rest timer"
          className="fixed inset-x-3 bottom-[calc(16px+env(safe-area-inset-bottom))] z-20 mx-auto flex max-w-[calc(28rem-24px)] animate-slideup flex-col gap-3.5 rounded-[26px] bg-surface-2 p-4 shadow-float"
        >
          <div className="flex items-center gap-3.5">
            <RestRing fraction={session.restTotalMs ? restLeftMs! / session.restTotalMs : 0} />
            <div className="min-w-0 flex-1">
              <div className="font-display text-[40px] font-bold leading-none tabular tracking-[-0.02em]">
                {clock(Math.ceil(restLeftMs! / 1000))}
              </div>
              <div className="mt-1 truncate text-[13px] text-ink-2">Then {nextUp}</div>
            </div>
          </div>
          <div className="grid grid-cols-[1fr_1fr_1.3fr] gap-2">
            <button
              type="button"
              aria-label="Remove 15 seconds"
              onClick={() => void update((s) => adjustRest(s, -15000, Date.now()))}
              className="h-12 rounded-[14px] bg-surface-3 text-base font-bold"
            >
              −15s
            </button>
            <button
              type="button"
              aria-label="Add 15 seconds"
              onClick={() => void update((s) => adjustRest(s, 15000, Date.now()))}
              className="h-12 rounded-[14px] bg-surface-3 text-base font-bold"
            >
              +15s
            </button>
            <button
              type="button"
              onClick={() => void update((s) => ({ ...s, restEndsAt: null }))}
              className="h-12 rounded-[14px] bg-ink text-base font-bold text-bg"
            >
              Skip rest
            </button>
          </div>
        </div>
      ) : restOver ? (
        <div
          role="status"
          className="fixed inset-x-3 bottom-[calc(16px+env(safe-area-inset-bottom))] z-20 mx-auto flex max-w-[calc(28rem-24px)] animate-restpulse items-center gap-3 rounded-[26px] bg-record p-[18px] text-[#0b0c0e]"
        >
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-extrabold uppercase tracking-[0.06em]">Rest's over — go</div>
            <div className="mt-1 truncate font-display text-[22px] font-bold">
              {nextUp.charAt(0).toUpperCase() + nextUp.slice(1)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void update((s) => ({ ...s, restEndsAt: null }))}
            className="h-[52px] rounded-2xl bg-[#0b0c0e] px-[18px] text-base font-bold text-record"
          >
            OK
          </button>
        </div>
      ) : null}

      {pad ? (
        <NumberPadSheet
          open
          title={pad.field === "kg" ? "Weight" : "Reps"}
          unit={pad.field === "kg" ? "kg" : "reps"}
          initial={kg(session.exercises[pad.exIndex].sets[pad.setIndex][pad.field])}
          options={pad.field === "kg" ? { decimals: 2, maxInt: 3, step: 2.5 } : { decimals: 0, maxInt: 3, step: 1 }}
          onClose={() => setPad(null)}
          onDone={(v) => {
            const n = Number.parseFloat(v) || 0;
            const target = pad;
            setPad(null);
            void update((s) => editSet(s, target.exIndex, target.setIndex, { [target.field]: n }));
          }}
        />
      ) : null}

      <Sheet
        open={finishOpen}
        onClose={() => {
          setFinishOpen(false);
          setConfirmDiscard(false);
        }}
        title="Finish workout"
      >
        {confirmDiscard ? (
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-2xl font-bold">Discard this workout?</h2>
            <p className="text-sm text-ink-2">All sets logged in this workout will be deleted. This can't be undone.</p>
            <Button
              size="lg"
              block
              className="!bg-record !text-[#0b0c0e]"
              onClick={async () => {
                await discardSession(session.id);
                navigate("/train", { replace: true });
              }}
            >
              Discard workout
            </Button>
            <Button size="lg" variant="secondary" block onClick={() => setConfirmDiscard(false)}>
              Keep it
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-2xl font-bold">Finish {session.name}?</h2>
            <p className="text-sm text-ink-2">
              {doneSetCount(session)} of {totalSets} sets logged. Unticked sets won't be saved.
            </p>
            <Button
              size="lg"
              block
              disabled={doneSetCount(session) === 0}
              onClick={async () => {
                await finishSession(session.id);
                navigate(`/session/${session.id}/done`, { replace: true });
              }}
            >
              Finish workout
            </Button>
            <Button size="lg" variant="secondary" block onClick={() => setFinishOpen(false)}>
              Keep going
            </Button>
            <button
              type="button"
              onClick={() => setConfirmDiscard(true)}
              className="h-11 text-sm font-semibold text-record-text"
            >
              Discard workout
            </button>
          </div>
        )}
      </Sheet>

      <SetupSheet
        open={setupOpen}
        exerciseName={info?.name ?? ""}
        initial={setup ?? ""}
        onClose={() => setSetupOpen(false)}
        onSave={async (v) => {
          await saveSetup(ex.exerciseId, v);
          setSetupOpen(false);
        }}
      />
    </div>
  );
}

/** "W", "D", "F" for special sets; normal sets are numbered 1, 2, 3 skipping warm-ups. */
function setLabel(sets: SessionSet[], i: number): string {
  const t = sets[i].type;
  if (t !== "normal") return SET_TYPE_MARK[t];
  return String(sets.slice(0, i + 1).filter((s) => s.type === "normal").length);
}

function SetRow({
  label,
  set,
  state,
  onType,
  onKg,
  onReps,
  onToggle,
}: {
  label: string;
  set: SessionSet;
  state: "done" | "active" | "later";
  onType: () => void;
  onKg: () => void;
  onReps: () => void;
  onToggle: () => void;
}) {
  const prev = set.prevKg != null && set.prevReps != null ? `${kg(set.prevKg)} × ${set.prevReps}` : "—";
  const valueCls = clsx(
    "h-12 rounded-[14px] font-display text-xl font-bold tabular",
    state === "active" ? "bg-surface-3 text-ink" : "bg-transparent",
    state === "done" && "text-ink",
    state === "later" && "text-ink-3",
  );
  return (
    <div
      className={clsx(
        "grid grid-cols-[34px_1fr_74px_58px_48px] items-center gap-2 rounded-[18px] px-2",
        state === "active" ? "bg-surface py-2.5" : "py-1.5",
        state === "done" && "animate-flash",
      )}
    >
      <button
        type="button"
        onClick={onType}
        aria-label={`Set ${label}, ${SET_TYPE_LABEL[set.type]}. Tap to change type`}
        className={clsx(
          "h-11 rounded-xl font-display text-base font-bold",
          set.type === "normal" ? (state === "active" ? "text-ink" : "text-ink-3") : "text-record-text",
        )}
      >
        {label}
      </button>
      <span className="truncate text-[13px] text-ink-3 tabular">{prev}</span>
      <button type="button" aria-label={`Weight ${kg(set.kg)} kilograms, edit`} onClick={onKg} className={valueCls}>
        {kg(set.kg)}
      </button>
      <button type="button" aria-label={`${set.reps} reps, edit`} onClick={onReps} className={valueCls}>
        {set.reps}
      </button>
      <button
        type="button"
        onClick={onToggle}
        aria-label={set.done ? `Undo set ${label}` : `Log set ${label}`}
        aria-pressed={set.done}
        className={clsx(
          "flex h-12 w-12 items-center justify-center rounded-full",
          set.done && "animate-pop bg-accent text-accent-ink",
          state === "active" && "border-2 border-accent text-accent-text",
          state === "later" && "border-2 border-surface-3 text-ink-3",
        )}
      >
        <CheckIcon size={22} strokeWidth={set.done ? 3 : 2.6} />
      </button>
    </div>
  );
}

function RestRing({ fraction }: { fraction: number }) {
  const C = 169.6;
  const f = Math.max(0, Math.min(1, fraction));
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <circle cx="32" cy="32" r="27" fill="none" stroke="var(--surface-3)" strokeWidth="6" />
      <circle
        cx="32"
        cy="32"
        r="27"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={C}
        strokeDashoffset={C * (1 - f)}
        transform="rotate(-90 32 32)"
        style={{ transition: "stroke-dashoffset .25s linear" }}
      />
    </svg>
  );
}

function SetupSheet({
  open,
  exerciseName,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  exerciseName: string;
  initial: string;
  onClose: () => void;
  onSave: (v: string) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="My setup">
      {open ? <SetupForm exerciseName={exerciseName} initial={initial} onSave={onSave} /> : null}
    </Sheet>
  );
}

function SetupForm({ exerciseName, initial, onSave }: { exerciseName: string; initial: string; onSave: (v: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(value);
      }}
    >
      <h2 className="font-display text-2xl font-bold">My setup</h2>
      <label htmlFor="setup" className="text-sm text-ink-2">
        How you set up {exerciseName || "this machine"} — shown every time you do it.
      </label>
      <input
        id="setup"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Seat 4 · Back pad 2 · Wide grip"
        className="h-12 rounded-[14px] bg-surface-2 px-4 text-ink outline-none placeholder:text-ink-3"
      />
      <Button size="lg" block type="submit">
        Save
      </Button>
    </form>
  );
}
