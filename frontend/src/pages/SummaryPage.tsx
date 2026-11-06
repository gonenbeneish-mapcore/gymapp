import { useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import clsx from "clsx";
import { useCompletedSessions, useExerciseMap, useSession } from "../data/hooks";
import { saveFeedback } from "../data/sessions";
import { compareWith, doneSetCount, findRecords, volume } from "../domain/session";
import { clock, kg, thousands } from "../domain/format";
import { Button } from "../ui/Button";
import { CheckIcon, TrophyIcon } from "../ui/icons";

const FEEL = ["Easy", "Light", "Solid", "Hard", "Max"];

export function SummaryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = useSession(id);
  const completed = useCompletedSessions();
  const exercises = useExerciseMap();
  const [feel, setFeel] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState<string | undefined>(undefined);

  const data = useMemo(() => {
    if (!session || !completed) return null;
    const earlier = completed.filter((s) => s.id !== session.id && s.startedAt < session.startedAt);
    const lastSame = earlier.find((s) => s.workoutId && s.workoutId === session.workoutId);
    return {
      records: findRecords(session, earlier),
      comparisons: compareWith(session, lastSame),
      lastSameVolume: lastSame ? volume(lastSame) : undefined,
    };
  }, [session, completed]);

  if (session === null) return <Navigate to="/train" replace />;
  if (!session || !data || !exercises) return <div className="min-h-dvh bg-bg" aria-busy="true" />;
  if (!session.endedAt) return <Navigate to="/session" replace />;

  const name = (exId: string) => exercises.get(exId)?.name ?? exId;
  const vol = volume(session);
  const volDelta = data.lastSameVolume != null ? vol - data.lastSameVolume : undefined;
  const feelValue = feel ?? session.feel;
  const notesValue = notes ?? session.notes ?? "";

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 px-5 pb-[calc(120px+env(safe-area-inset-bottom))] pt-safe">
      <header className="flex items-center gap-3.5 pt-6">
        <div className="flex h-14 w-14 shrink-0 animate-pop items-center justify-center rounded-full bg-accent text-accent-ink">
          <CheckIcon size={28} />
        </div>
        <div>
          <h1 className="font-display text-[30px] font-bold leading-[1.05] tracking-[-0.03em]">Workout done</h1>
          <p className="mt-1 text-sm text-ink-2">
            {session.name} ·{" "}
            {new Date(session.startedAt).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </header>

      {data.records.length > 0 ? (
        <section
          aria-label="New records"
          className="relative animate-rise overflow-hidden rounded-[24px] bg-record px-[18px] pt-[18px] pb-2 text-[#0b0c0e] [animation-delay:.15s]"
        >
          <div className="flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.06em]">
            <TrophyIcon size={18} />
            {data.records.length} new record{data.records.length > 1 ? "s" : ""}
          </div>
          {data.records.map((r, i) => (
            <div key={r.exerciseId} className={clsx("flex items-center gap-3 py-3", i < data.records.length - 1 && "border-b border-black/15")}>
              <div className="min-w-0 flex-1">
                <div className="font-bold">{name(r.exerciseId)}</div>
                <div className="mt-0.5 text-[13px] font-semibold opacity-70">
                  {r.kind === "heaviest" ? "Heaviest set" : `Most reps at ${kg(r.kg)} kg`} · was {kg(r.previous.kg)} × {r.previous.reps}
                </div>
              </div>
              <div className="font-display text-2xl font-bold tabular">
                {kg(r.kg)} × {r.reps}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      <section aria-label="Stats" className="grid animate-rise grid-cols-3 gap-2 [animation-delay:.3s]">
        <Stat value={clock((session.endedAt - session.startedAt) / 1000)} label="Time" />
        <Stat
          value={thousands(vol)}
          label={volDelta != null ? `kg · ${volDelta >= 0 ? "+" : "−"}${thousands(Math.abs(volDelta))}` : "kg lifted"}
          accent={volDelta != null && volDelta > 0}
        />
        <Stat value={String(doneSetCount(session))} label="Sets" />
      </section>

      {data.comparisons.length > 0 ? (
        <section aria-label="Compared with last time" className="flex animate-rise flex-col gap-2.5 [animation-delay:.45s]">
          <h2 className="font-display text-lg font-bold">
            {data.comparisons.some((c) => c.trend !== "new") ? `vs last ${session.name}` : "Best sets"}
          </h2>
          <div className="overflow-hidden rounded-panel bg-surface [&>*+*]:border-t [&>*+*]:border-divider">
            {data.comparisons.map((c) => (
              <div key={c.exerciseId} className="flex items-center gap-3 px-4 py-[11px]">
                <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{name(c.exerciseId)}</span>
                <span className="text-sm text-ink-2 tabular">
                  {kg(c.kg)} × {c.reps}
                </span>
                <TrendMark trend={c.trend} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-label="How it felt" className="flex animate-rise flex-col gap-2.5 [animation-delay:.6s]">
        <h2 className="font-display text-lg font-bold">How did it feel?</h2>
        <div className="grid grid-cols-5 gap-1.5">
          {FEEL.map((label, i) => {
            const on = feelValue === i + 1;
            return (
              <button
                key={label}
                type="button"
                aria-pressed={on}
                onClick={() => setFeel(i + 1)}
                className={clsx("h-12 rounded-full text-[13px]", on ? "bg-ink font-bold text-bg" : "bg-surface font-semibold text-ink-2")}
              >
                {label}
              </button>
            );
          })}
        </div>
        <label htmlFor="notes" className="mt-1 text-[13px] font-semibold text-ink-3">
          Notes
        </label>
        <textarea
          id="notes"
          rows={2}
          value={notesValue}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Machine was taken, did incline first…"
          className="resize-none rounded-[14px] bg-surface px-3.5 py-3 text-ink outline-none placeholder:text-ink-3"
        />
      </section>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md bg-gradient-to-t from-bg from-70% to-transparent px-5 pt-6 pb-[calc(20px+env(safe-area-inset-bottom))]">
        <Button
          size="lg"
          block
          onClick={async () => {
            await saveFeedback(session.id, feelValue, notesValue);
            navigate("/train", { replace: true });
          }}
        >
          Save workout
        </Button>
      </div>
    </div>
  );
}

function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="rounded-[18px] bg-surface p-3.5">
      <div className="font-display text-2xl font-bold tabular">{value}</div>
      <div className={clsx("mt-0.5 text-xs font-semibold", accent ? "text-accent-text" : "text-ink-3")}>{label}</div>
    </div>
  );
}

function TrendMark({ trend }: { trend: "up" | "same" | "down" | "new" }) {
  const map = {
    up: { ch: "▲", cls: "text-accent-text", label: "better than last time" },
    same: { ch: "=", cls: "text-ink-3", label: "same as last time" },
    down: { ch: "▼", cls: "text-record-text", label: "lower than last time" },
    new: { ch: "new", cls: "text-ink-3 text-xs", label: "first time" },
  }[trend];
  return (
    <span aria-label={map.label} className={clsx("w-7 text-right font-extrabold", map.cls)}>
      {map.ch}
    </span>
  );
}
