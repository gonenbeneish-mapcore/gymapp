import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { Screen, ScreenHeader, Section } from "../ui/layout";
import { GroupedList, ListRow, Tile } from "../ui/list";
import { buttonClass } from "../ui/buttonClass";
import { Button } from "../ui/Button";
import { Sheet } from "../ui/Sheet";
import { CheckIcon, PlayIcon, SlidersIcon } from "../ui/icons";
import { useActiveSession, useCompletedSessions, useExerciseMap, useWorkouts } from "../data/hooks";
import { startWorkout } from "../data/sessions";
import type { Exercise, Session, Workout } from "../data/types";
import { doneSetCount, nextWorkout, sameDay, volume, weekDays } from "../domain/session";
import { MUSCLE_LABEL } from "../domain/labels";
import { clock, kg, shortDate, thousands } from "../domain/format";
import { useNow } from "../lib/useNow";
import { BackupReminder } from "./BackupReminder";

/** Two-letter tile label from the first word: Push → Ph, Pull → Pl, Leg → Lg. */
function initials(name: string) {
  const word = name.trim().split(/\s+/)[0] ?? "";
  if (word.length < 2) return word.toUpperCase();
  return word[0].toUpperCase() + word[word.length - 1].toLowerCase();
}

function muscleLine(w: Workout, exercises: Map<string, Exercise>) {
  const counts = new Map<string, number>();
  for (const we of w.exercises) {
    for (const m of exercises.get(we.exerciseId)?.primary ?? []) counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([m]) => MUSCLE_LABEL[m as keyof typeof MUSCLE_LABEL])
    .join(" · ");
}

function setCount(w: Workout) {
  return w.exercises.reduce((n, x) => n + x.sets.length, 0);
}

/** Rough duration: each set ≈ 45 s of work plus its rest. */
function estimateMinutes(w: Workout) {
  const sec = w.exercises.reduce((t, x) => t + x.sets.length * (45 + (x.restSeconds ?? w.restSeconds)), 0);
  return Math.round(sec / 60 / 5) * 5;
}

function lastDone(w: Workout, completed: Session[]) {
  return completed.find((s) => s.workoutId === w.id)?.startedAt;
}

export function TrainPage() {
  const navigate = useNavigate();
  const workouts = useWorkouts();
  const exercises = useExerciseMap();
  const completed = useCompletedSessions();
  const active = useActiveSession();
  const [preview, setPreview] = useState<Workout | null>(null);
  const [starting, setStarting] = useState(false);

  const next = useMemo(
    () => (workouts && completed ? nextWorkout(workouts, completed) : undefined),
    [workouts, completed],
  );

  const today = new Date();
  const days = weekDays(today);
  const thisWeek = (completed ?? []).filter((s) => s.startedAt >= days[0].getTime());

  async function start(w: Workout) {
    setStarting(true);
    try {
      await startWorkout(w.id);
      navigate("/session");
    } finally {
      setStarting(false);
    }
  }

  const loading = !workouts || !exercises || !completed || active === undefined;

  return (
    <Screen>
      <ScreenHeader
        kicker={today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        title="Train"
        action={
          <Link
            to="/settings"
            aria-label="Settings"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink"
          >
            <SlidersIcon size={20} />
          </Link>
        }
      />

      {active ? null : <BackupReminder />}

      {loading ? (
        <div className="h-[300px] rounded-hero bg-surface" aria-busy="true" />
      ) : active ? (
        <ResumeCard session={active} />
      ) : next ? (
        <section
          aria-label="Next workout"
          className="flex animate-rise flex-col gap-[18px] rounded-hero bg-[#c8f04a] px-[22px] pt-[22px] pb-5 text-[#0b0c0e] [animation-delay:.05s]"
        >
          <div className="flex items-center justify-between text-[13px] opacity-70">
            <span className="font-bold uppercase tracking-[0.08em]">Next up</span>
            <span className="font-semibold">
              {lastDone(next, completed) ? `Last: ${shortDate(lastDone(next, completed)!)}` : "Not done yet"}
            </span>
          </div>
          <div>
            <h2 className="font-display text-[40px] font-bold leading-none tracking-[-0.03em]">{next.name}</h2>
            <p className="mt-2 text-[15px] font-semibold opacity-75">{muscleLine(next, exercises)}</p>
          </div>
          <div className="flex gap-[22px]">
            {[
              [String(next.exercises.length), "exercises"],
              [String(setCount(next)), "sets"],
              [`~${estimateMinutes(next)}`, "minutes"],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-display text-[22px] font-bold">{n}</div>
                <div className="text-xs font-semibold opacity-70">{l}</div>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={starting}
            onClick={() => start(next)}
            className={buttonClass({ variant: "dark", size: "lg", block: true })}
          >
            <PlayIcon />
            Start workout
          </button>
        </section>
      ) : null}

      <Section
        title="This week"
        action={
          <span className="text-sm text-ink-2">
            <strong className="text-ink">{thisWeek.length}</strong> workout{thisWeek.length === 1 ? "" : "s"} ·{" "}
            {thousands(thisWeek.reduce((t, s) => t + volume(s), 0))} kg
          </span>
        }
        className="animate-rise [animation-delay:.12s]"
      >
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((d) => {
            const trained = thisWeek.some((s) => sameDay(new Date(s.startedAt), d));
            const isToday = sameDay(d, today);
            const label = d.toLocaleDateString("en-GB", { weekday: "short" });
            return (
              <div key={d.getTime()} className="flex flex-col items-center gap-2">
                <div
                  aria-label={`${label}${trained ? ", trained" : ""}`}
                  className={clsx(
                    "flex h-[38px] w-[38px] items-center justify-center rounded-full",
                    trained && "bg-accent text-accent-ink",
                    !trained && isToday && "border-2 border-dashed border-accent",
                    !trained && !isToday && "bg-surface",
                  )}
                >
                  {trained ? <CheckIcon size={16} /> : null}
                </div>
                <span className={clsx("text-xs font-semibold", isToday ? "text-ink" : "text-ink-3")}>{label}</span>
              </div>
            );
          })}
        </div>
      </Section>

      {workouts && workouts.length > 0 ? (
        <Section title="Your workouts" className="animate-rise [animation-delay:.19s]">
          <GroupedList>
            {workouts.map((w) => {
              const last = completed ? lastDone(w, completed) : undefined;
              return (
                <ListRow
                  key={w.id}
                  leading={<Tile>{initials(w.name)}</Tile>}
                  title={w.name}
                  subtitle={`${w.exercises.length} exercises · ${last ? `last ${shortDate(last)}` : "not done yet"}`}
                  chevron
                  onClick={() => setPreview(w)}
                />
              );
            })}
          </GroupedList>
        </Section>
      ) : null}

      <Sheet open={!!preview} onClose={() => setPreview(null)} title={preview?.name ?? "Workout"}>
        {preview && exercises ? (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-display text-[28px] font-bold tracking-[-0.02em]">{preview.name}</h2>
              <p className="mt-1 text-sm text-ink-2">
                {preview.exercises.length} exercises · {setCount(preview)} sets · ~{estimateMinutes(preview)} min
              </p>
            </div>
            <ol className="flex max-h-[45vh] flex-col overflow-y-auto rounded-panel bg-surface-2 [&>*+*]:border-t [&>*+*]:border-divider">
              {preview.exercises.map((x, i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="font-semibold">{exercises.get(x.exerciseId)?.name ?? x.exerciseId}</span>
                  <span className="text-sm text-ink-2 tabular">
                    {x.sets.length} × {x.sets[0]?.reps}
                    {x.sets[0]?.kg ? ` @ ${kg(x.sets[0].kg)} kg` : ""}
                  </span>
                </li>
              ))}
            </ol>
            {active ? (
              <p className="text-center text-sm text-ink-2">Finish the workout in progress first.</p>
            ) : (
              <Button size="lg" block icon={<PlayIcon />} disabled={starting} onClick={() => start(preview)}>
                Start {preview.name}
              </Button>
            )}
          </div>
        ) : null}
      </Sheet>
    </Screen>
  );
}

function ResumeCard({ session }: { session: Session }) {
  const now = useNow(1000);
  const total = session.exercises.reduce((n, x) => n + x.sets.length, 0);
  return (
    <section
      aria-label="Workout in progress"
      className="flex animate-rise flex-col gap-4 rounded-hero bg-[#c8f04a] px-[22px] pt-[22px] pb-5 text-[#0b0c0e]"
    >
      <span className="text-[13px] font-bold uppercase tracking-[0.08em] opacity-70">In progress</span>
      <div>
        <h2 className="font-display text-[40px] font-bold leading-none tracking-[-0.03em]">{session.name}</h2>
        <p className="mt-2 text-[15px] font-semibold tabular opacity-75">
          {clock((now - session.startedAt) / 1000)} · {doneSetCount(session)} of {total} sets
        </p>
      </div>
      <Link to="/session" className={buttonClass({ variant: "dark", size: "lg", block: true })}>
        <PlayIcon />
        Resume workout
      </Link>
    </section>
  );
}
