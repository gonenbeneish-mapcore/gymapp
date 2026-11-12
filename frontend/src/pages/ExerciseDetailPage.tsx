import { useEffect, useMemo, useState } from "react";
import { NumberPadSheet } from "../ui/NumberPad";
import { savePlateKg } from "../data/sessions";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { GroupedList, ListRow } from "../ui/list";
import { ChevronLeftIcon, PlayIcon } from "../ui/icons";
import { ExerciseThumb } from "../ui/ExerciseThumb";
import { MuscleMap } from "../ui/MuscleMap";
import { useCompletedSessions, useExercise, useExerciseMap, useExerciseNote } from "../data/hooks";
import type { Exercise, MachineSpec } from "../data/types";
import { EQUIPMENT_LABEL, MUSCLE_LABEL } from "../domain/labels";
import { exerciseMeta } from "../domain/exerciseSearch";
import { exerciseHistory, type SetRef } from "../domain/exerciseStats";
import { kg, shortDate } from "../domain/format";

export function ExerciseDetailPage() {
  const { id } = useParams();
  const exercise = useExercise(id);

  // Opening an alternative reuses this page, so start each exercise at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (exercise === undefined) return <div className="min-h-dvh bg-bg" aria-busy="true" />;
  if (exercise === null) return <Navigate to="/exercises" replace />;
  return <Detail exercise={exercise} />;
}

function Detail({ exercise: e }: { exercise: Exercise }) {
  const navigate = useNavigate();
  const location = useLocation();
  const note = useExerciseNote(e.id);
  const completed = useCompletedSessions();
  const all = useExerciseMap();
  const history = useMemo(() => (completed ? exerciseHistory(e.id, completed) : undefined), [e.id, completed]);
  const alternatives = (all ? e.alternatives.map((a) => all.get(a)) : []).filter((a): a is Exercise => !!a);

  // Back returns to the list with its filters; a link opened directly goes to the bank.
  const back = () => (location.key === "default" ? navigate("/exercises") : navigate(-1));

  return (
    <main className="mx-auto flex w-full max-w-md flex-col pb-[calc(40px+env(safe-area-inset-bottom))]">
      <div className="relative bg-surface pt-safe">
        <button
          type="button"
          onClick={back}
          aria-label="Back to exercises"
          className="absolute left-4 top-[calc(env(safe-area-inset-top)+12px)] z-10 flex h-11 w-11 items-center justify-center rounded-[14px] bg-[color-mix(in_srgb,var(--bg)_75%,transparent)] text-ink backdrop-blur"
        >
          <ChevronLeftIcon size={20} />
        </button>
        <Hero key={e.id} exercise={e} />
      </div>

      <div className="flex flex-col gap-6 px-5 pt-5">
        <header className="animate-rise">
          <h1 className="font-display text-[30px] font-bold leading-[1.1] tracking-[-0.02em]">{e.name}</h1>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Tag>{EQUIPMENT_LABEL[e.equipment]}</Tag>
            {e.source ? <Tag>{[e.source.brand, e.source.model].filter(Boolean).join(" ")}</Tag> : null}
          </div>
          <p className="mt-3.5 text-[15px] leading-relaxed text-ink-2">{e.description}</p>
        </header>

        <section aria-labelledby="muscles" className="flex flex-col gap-2.5 rounded-panel bg-surface p-4">
          <h2 id="muscles" className="text-[15px] font-bold">
            Muscles worked
          </h2>
          <MuscleLine label="Main" items={e.primary.map((m) => MUSCLE_LABEL[m])} strong />
          {e.secondary.length ? <MuscleLine label="Also" items={e.secondary.map((m) => MUSCLE_LABEL[m])} /> : null}
          {e.image ? (
            <div className="mt-2 flex flex-col items-center gap-2.5">
              <MuscleMap primary={e.primary} secondary={e.secondary} className="h-[200px] w-auto" />
              <MuscleLegend />
            </div>
          ) : null}
        </section>

        {e.equipment === "machine" ? <MachineInfo exerciseId={e.id} spec={e.machine ?? {}} plateKg={note?.plateKg} /> : null}

        {history ? <YourHistory times={history.times} last={history.last} best={history.best} /> : null}

        {note?.mySetup ? (
          <section aria-labelledby="setup" className="flex flex-col gap-1.5 rounded-panel bg-surface p-4">
            <h2 id="setup" className="text-[15px] font-bold">
              My setup
            </h2>
            <p className="whitespace-pre-line text-[15px] text-ink-2">{note.mySetup}</p>
          </section>
        ) : null}

        {e.videoUrl ? (
          <a
            href={e.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-surface font-semibold text-accent-text"
          >
            <PlayIcon size={16} />
            Watch how it's done
          </a>
        ) : null}

        <section aria-labelledby="howto" className="flex flex-col gap-3">
          <h2 id="howto" className="text-[15px] font-bold">
            How to do it
          </h2>
          <ol className="flex flex-col gap-2.5">
            {e.steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-snug text-ink-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-surface text-[13px] font-bold text-accent-text">
                  {i + 1}
                </span>
                <span className="pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
        </section>

        {e.mistakes.length ? (
          <section aria-labelledby="mistakes" className="flex flex-col gap-2 rounded-panel bg-record-soft p-4">
            <h2 id="mistakes" className="text-[15px] font-bold text-record-text">
              Common mistakes
            </h2>
            <ul className="flex list-disc flex-col gap-1.5 pl-[18px] text-[14px] leading-snug text-ink-2">
              {e.mistakes.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {alternatives.length ? (
          <section aria-labelledby="alts" className="flex flex-col gap-3">
            <h2 id="alts" className="text-[15px] font-bold">
              {e.equipment === "machine" ? "Machine taken? Try instead" : "Try instead"}
            </h2>
            <GroupedList>
              {alternatives.map((a) => (
                <ListRow
                  key={a.id}
                  to={`/exercises/${a.id}`}
                  leading={<ExerciseThumb key={a.id} exercise={a} />}
                  title={a.name}
                  subtitle={exerciseMeta(a)}
                  chevron
                />
              ))}
            </GroupedList>
          </section>
        ) : null}
      </div>
    </main>
  );
}

/** The machine's photo when there is one (and it loads), otherwise the muscle chart. */
function Hero({ exercise: e }: { exercise: Exercise }) {
  const [broken, setBroken] = useState(false);
  if (e.image && !broken) {
    return (
      <div className="px-5 pb-4 pt-[68px]">
        {/* Product photos have a white background, so they sit on a light panel in both themes. */}
        <div className="flex justify-center rounded-panel bg-[#f4f5f6] p-3">
          <img
            src={e.image}
            alt={`${e.name} machine`}
            onError={() => setBroken(true)}
            className="h-[260px] w-full object-contain"
          />
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 px-5 pb-4 pt-14">
      <MuscleMap primary={e.primary} secondary={e.secondary} className="h-[270px] w-auto" />
      <MuscleLegend />
    </div>
  );
}

function MuscleLegend() {
  return (
    <div className="flex items-center gap-4 text-xs font-semibold text-ink-2" aria-hidden="true">
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--muscle-hit)]" />
        Main
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[var(--muscle-hit)] opacity-40" />
        Also works
      </span>
    </div>
  );
}

function MachineInfo({ exerciseId, spec, plateKg }: { exerciseId: string; spec: MachineSpec; plateKg?: number }) {
  const [editing, setEditing] = useState(false);
  const rows: [string, string][] = [];
  if (spec.stackKg) rows.push(["Weight stack", `Up to ${kg(spec.stackKg)} kg`]);
  if (spec.addOnKg) rows.push(["Add-on weight", `+${kg(spec.addOnKg)} kg with the lever`]);
  if (spec.adjust) rows.push(["Adjust", spec.adjust.length ? spec.adjust.join(" · ") : "Nothing to adjust, just sit and go"]);
  const plate = plateKg ?? spec.plateKg;
  const fromSpec = rows.length > 0;
  return (
    <section aria-labelledby="machine" className="flex flex-col gap-2.5 rounded-panel bg-surface p-4">
      <h2 id="machine" className="text-[15px] font-bold">
        The machine
      </h2>
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline gap-3 text-[15px]">
          <span className="w-[104px] shrink-0 text-[13px] font-semibold text-ink-3">{label}</span>
          <span className="text-ink">{value}</span>
        </div>
      ))}
      <button type="button" onClick={() => setEditing(true)} className="flex items-baseline gap-3 text-left text-[15px]">
        <span className="w-[104px] shrink-0 text-[13px] font-semibold text-ink-3">Plate weight</span>
        {plate ? (
          <span className="text-ink">
            {kg(plate)} kg a plate <span className="text-[13px] font-semibold text-accent-text">· change</span>
          </span>
        ) : (
          <span className="font-semibold text-accent-text">Add it (check one plate at the gym)</span>
        )}
      </button>
      <p className="text-xs text-ink-3">
        {plate ? "Used to suggest the next weight this machine can really make. " : "With it, the app suggests weights this machine can really make. "}
        {fromSpec ? "The other details are from the maker's specs for the current model; older machines can differ." : ""}
      </p>
      {editing ? (
        <NumberPadSheet
          open
          title="Weight of one plate"
          unit="kg"
          initial={plate ? kg(plate) : ""}
          options={{ decimals: 2, maxInt: 2, step: 0.5 }}
          onClose={() => setEditing(false)}
          onDone={(v) => {
            setEditing(false);
            const n = Number.parseFloat(v);
            void savePlateKg(exerciseId, Number.isFinite(n) && n > 0 && n <= 25 ? n : undefined);
          }}
        />
      ) : null}
    </section>
  );
}

function Tag({ children }: { children: string }) {
  return <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-ink-2">{children}</span>;
}

function MuscleLine({ label, items, strong }: { label: string; items: string[]; strong?: boolean }) {
  return (
    <div className="flex items-baseline gap-3 text-[15px]">
      <span className="w-10 shrink-0 text-[13px] font-semibold text-ink-3">{label}</span>
      <span className={strong ? "font-semibold text-ink" : "text-ink-2"}>{items.join(", ")}</span>
    </div>
  );
}

function YourHistory({ times, last, best }: { times: number; last?: SetRef; best?: SetRef }) {
  const set = (s: SetRef) => (s.kg ? `${kg(s.kg)} kg × ${s.reps}` : `${s.reps} reps`);
  return (
    <section aria-labelledby="yours" className="flex flex-col gap-3 rounded-panel bg-surface p-4">
      <h2 id="yours" className="text-[15px] font-bold">
        Your history
      </h2>
      {times === 0 || !last || !best ? (
        <p className="text-[15px] text-ink-2">Not logged yet. Your best and last sets will show here.</p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Workouts" value={String(times)} />
          <Stat label={`Last · ${shortDate(last.at)}`} value={set(last)} />
          <Stat label={`Best · ${shortDate(best.at)}`} value={set(best)} accent />
        </div>
      )}
    </section>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="min-w-0">
      <div className={`font-display text-[17px] font-bold tabular ${accent ? "text-accent-text" : ""}`}>{value}</div>
      <div className="mt-0.5 truncate text-xs font-semibold text-ink-3">{label}</div>
    </div>
  );
}
