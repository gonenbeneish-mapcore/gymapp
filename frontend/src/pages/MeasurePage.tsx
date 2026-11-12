import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Screen, ScreenHeader, Section } from "../ui/layout";
import { GroupedList, ListRow } from "../ui/list";
import { Button } from "../ui/Button";
import { Segmented } from "../ui/controls";
import { MeasureIcon, PlusIcon } from "../ui/icons";
import { NumberPadSheet } from "../ui/NumberPad";
import { Sheet } from "../ui/Sheet";
import { DateField } from "../ui/DateField";
import { fromDateInput, toDateInput } from "../domain/dates";
import { useMeasurements, useProfile } from "../data/hooks";
import { addMeasurement, deleteMeasurement, updateMeasurement } from "../data/measure";
import type { MeasureKind, Measurement, Profile } from "../data/types";
import {
  DAY,
  averageSince,
  bmi,
  bmiCategory,
  changeOver,
  goalEta,
  goalProgress,
  lowestSince,
  readingChangeOver,
  signed,
  trendSeries,
  waistToHeight,
  weeklyRate,
  type TrendPoint,
} from "../domain/measure";

type Range = "1M" | "3M" | "6M" | "1Y";
const RANGE_DAYS: Record<Range, number> = { "1M": 30, "3M": 90, "6M": 180, "1Y": 365 };

/** Values outside these are refused as typos. */
const LIMITS: Record<MeasureKind, { min: number; max: number; unit: string }> = {
  weight: { min: 20, max: 350, unit: "kg" },
  waist: { min: 40, max: 200, unit: "cm" },
};

const r1 = (n: number) => n.toFixed(1);

/** What the number pad is logging: a kind, the chosen day ("2026-11-12") and, when editing, the entry. */
type PadTarget = { kind: MeasureKind; date: string; edit?: Measurement };

/** When to timestamp an entry for `date`: now for today, its own time if the day didn't change, else 08:00. */
function timeFor(target: PadTarget): number {
  if (target.edit && toDateInput(target.edit.at) === target.date) return target.edit.at;
  if (target.date === toDateInput(Date.now())) return Date.now();
  const d = fromDateInput(target.date);
  d.setHours(8, 0, 0, 0);
  return d.getTime();
}

export function MeasurePage() {
  const weights = useMeasurements("weight");
  const waists = useMeasurements("waist");
  const profile = useProfile();
  const [pad, setPad] = useState<PadTarget | null>(null);
  const [editing, setEditing] = useState<Measurement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<Range>("3M");
  // Captured once per visit so the numbers don't shift while the page is open.
  const [now] = useState(() => Date.now());

  const series = useMemo(() => (weights ? trendSeries(weights) : undefined), [weights]);
  const lastWeight = weights?.[weights.length - 1];
  const lastWaist = waists?.[waists.length - 1];

  async function save(target: PadTarget, raw: string) {
    const value = Number.parseFloat(raw);
    const { min, max, unit } = LIMITS[target.kind];
    if (!Number.isFinite(value) || value < min || value > max) {
      setError(`${raw || "0"} ${unit} doesn't look right, so it wasn't saved.`);
      return;
    }
    setError(null);
    const at = timeFor(target);
    if (target.edit) await updateMeasurement(target.edit.id, value, at);
    else await addMeasurement(target.kind, value, at);
  }

  // The latest day you can pick; refreshed whenever a sheet opens.
  const [today, setToday] = useState(() => toDateInput(now));
  const openPad = (kind: MeasureKind) => {
    const d = toDateInput(Date.now());
    setToday(d);
    setPad({ kind, date: d });
  };
  const openWeighIn = () => openPad("weight");

  return (
    <Screen className="gap-4">
      <ScreenHeader
        title="Measure"
        action={
          <Button size="sm" icon={<PlusIcon size={16} />} onClick={openWeighIn}>
            Weigh-in
          </Button>
        }
      />

      {error ? (
        <p role="alert" className="rounded-2xl bg-record-soft px-4 py-3 text-sm font-semibold text-record-text">
          {error}
        </p>
      ) : null}

      {!series || !profile ? (
        <div className="h-[260px] rounded-panel bg-surface" aria-busy="true" />
      ) : series.length === 0 ? (
        <FirstWeighIn onWeighIn={openWeighIn} />
      ) : (
        <>
          <TrendCard series={series} profile={profile} now={now} />
          <Segmented
            label="Chart range"
            value={range}
            onChange={setRange}
            className="w-full"
            options={(Object.keys(RANGE_DAYS) as Range[]).map((r) => ({ value: r, label: r }))}
          />
          <WeightChart series={series} days={RANGE_DAYS[range]} now={now} />
          <BmiCard weightKg={series[series.length - 1].trend} heightCm={profile.heightCm} />
          <Tiles
            series={series}
            waists={waists ?? []}
            heightCm={profile.heightCm}
            now={now}
            onLogWaist={() => openPad("waist")}
          />
          <RecentWeighIns series={series} entries={weights ?? []} now={now} onPick={setEditing} />
        </>
      )}

      {pad ? (
        <NumberPadSheet
          open
          title={pad.edit ? "Edit weigh-in" : pad.kind === "weight" ? "Weigh-in" : "Waist"}
          unit={LIMITS[pad.kind].unit}
          initial={r1(pad.edit?.value ?? (pad.kind === "weight" ? lastWeight?.value : lastWaist?.value) ?? 0).replace(/\.0$/, "")}
          options={{ decimals: 1, maxInt: 3, step: pad.kind === "weight" ? 0.1 : 0.5 }}
          header={
            <DateField
              label={pad.kind === "weight" ? "Weigh-in date" : "Measurement date"}
              value={pad.date}
              max={today}
              onChange={(date) => setPad((p) => (p ? { ...p, date } : p))}
            />
          }
          onClose={() => setPad(null)}
          onDone={(v) => {
            const target = pad;
            setPad(null);
            void save(target, v);
          }}
        />
      ) : null}

      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Weigh-in">
        {editing ? (
          <div className="flex flex-col gap-3">
            <div className="text-center">
              <div className="font-display text-[44px] font-bold leading-none tabular">
                {r1(editing.value)}
                <span className="ml-1 text-lg text-ink-3">kg</span>
              </div>
              <div className="mt-2 text-sm text-ink-2">{whenLong(editing.at)}</div>
            </div>
            <Button
              size="lg"
              block
              variant="secondary"
              onClick={() => {
                const m = editing;
                setEditing(null);
                setPad({ kind: "weight", date: toDateInput(m.at), edit: m });
              }}
            >
              Change weight or date
            </Button>
            <Button
              size="lg"
              block
              variant="ghost"
              className="text-record-text"
              onClick={() => {
                const id = editing.id;
                setEditing(null);
                void deleteMeasurement(id);
              }}
            >
              Delete weigh-in
            </Button>
          </div>
        ) : null}
      </Sheet>
    </Screen>
  );
}

function FirstWeighIn({ onWeighIn }: { onWeighIn: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-panel bg-surface px-6 py-10 text-center animate-rise">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-text">
        <MeasureIcon size={28} />
      </span>
      <h2 className="font-display text-xl font-bold">Log your first weigh-in</h2>
      <p className="max-w-[280px] text-[15px] text-ink-2">
        Weigh yourself in the morning, after the toilet and before eating. After a few days you'll see your trend
        weight, which smooths out the day-to-day ups and downs.
      </p>
      <Button size="md" icon={<PlusIcon size={16} />} onClick={onWeighIn}>
        Weigh-in
      </Button>
    </div>
  );
}

function TrendCard({ series, profile, now }: { series: TrendPoint[]; profile: Profile; now: number }) {
  const last = series[series.length - 1];
  const rate = weeklyRate(series, now);
  const change30 = changeOver(series, now, 30);
  const goal = profile.goalKg;
  const start = series[0].trend;
  const eta = goal != null ? goalEta(last.trend, goal, rate, now) : null;

  return (
    <section aria-label="Weight trend" className="flex flex-col gap-4 rounded-panel bg-surface p-[18px] animate-rise">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.08em] text-ink-3">Trend weight</div>
          <div className="mt-1 font-display text-[44px] font-bold leading-none tabular">
            {r1(last.trend)}
            <span className="text-lg text-ink-3"> kg</span>
          </div>
          <div className="mt-1.5 text-[13px] text-ink-2">
            {lastReadingLabel(last.at, now)}: {r1(last.value)} kg
          </div>
        </div>
        <div className="text-right">
          {rate !== null ? (
            <span className="inline-block rounded-full bg-accent-soft px-2.5 py-1 text-[13px] font-bold text-accent-text">
              {signed(rate, 2)} kg/wk
            </span>
          ) : (
            <span className="inline-block max-w-[120px] text-xs text-ink-3">Weekly rate after 2 weeks of weigh-ins</span>
          )}
          {change30 !== null ? (
            <div className="mt-1.5 text-xs text-ink-3">{signed(change30)} kg in 30 days</div>
          ) : null}
        </div>
      </div>

      {goal != null ? (
        <div>
          <div className="flex justify-between text-xs font-semibold text-ink-3">
            <span>Start {r1(start)}</span>
            <span>Goal {r1(goal)} kg</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded bg-surface-3">
            <div className="h-2 rounded bg-accent" style={{ width: `${goalProgress(start, last.trend, goal)}%` }} />
          </div>
          <div className="mt-2 text-[13px] text-ink-2">
            {Math.abs(last.trend - goal) < 0.25
              ? "You're at your goal."
              : eta !== null
                ? `At this pace you reach ${r1(goal)} kg around ${new Date(eta).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}.`
                : rate === null
                  ? "A goal date shows once there are two weeks of weigh-ins."
                  : "Not heading toward your goal right now."}
          </div>
        </div>
      ) : (
        <Link to="/settings" className="text-[13px] font-semibold text-accent-text">
          Set a goal weight in Settings
        </Link>
      )}
    </section>
  );
}

function WeightChart({ series, days, now }: { series: TrendPoint[]; days: number; now: number }) {
  const W = 300;
  const H = 170;
  const start = now - days * DAY;
  const inRange = series.filter((p) => p.at >= start);
  // Include the reading just before the range so the trend line runs in from the left edge.
  const before = series.filter((p) => p.at < start).at(-1);
  const linePoints = before ? [before, ...inRange] : inRange;

  if (!inRange.length) {
    return (
      <div className="rounded-panel bg-surface px-4 py-8 text-center text-sm text-ink-2">
        No weigh-ins in this period.
      </div>
    );
  }

  const values = inRange.flatMap((p) => [p.value, p.trend]);
  let lo = Math.min(...values) - 0.3;
  let hi = Math.max(...values) + 0.3;
  if (hi - lo < 1) {
    const mid = (hi + lo) / 2;
    lo = mid - 0.5;
    hi = mid + 0.5;
  }
  const x = (t: number) => 4 + ((t - start) / (now - start)) * (W - 8);
  const y = (v: number) => 4 + ((hi - v) / (hi - lo)) * (H - 8);
  const r = days > 120 ? 1.8 : 2.6;
  const trendPath = linePoints.map((p, i) => `${i ? "L" : "M"}${x(p.at).toFixed(1)} ${y(p.trend).toFixed(1)}`).join(" ");
  const last = inRange[inRange.length - 1];
  const fmt = (t: number) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  return (
    <section aria-label="Weight chart" className="flex flex-col gap-2 rounded-panel bg-surface px-3.5 pb-3 pt-4">
      <div className="flex gap-3.5 text-xs font-semibold text-ink-2" aria-hidden="true">
        <span className="flex items-center gap-1.5">
          <span className="h-[3px] w-4 rounded bg-[var(--muscle-hit)]" />
          Trend
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-[7px] w-[7px] rounded-full bg-ink-3" />
          Weigh-ins
        </span>
      </div>
      <div className="flex gap-1.5">
        <div className="flex h-[170px] w-8 shrink-0 flex-col justify-between text-right text-[11px] text-ink-3 tabular" aria-hidden="true">
          <span>{r1(hi)}</span>
          <span>{r1((hi + lo) / 2)}</span>
          <span>{r1(lo)}</span>
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-[170px] min-w-0 flex-1"
          role="img"
          aria-label={`Trend weight over the last ${days} days, from ${r1(linePoints[0].trend)} to ${r1(last.trend)} kg`}
        >
          <defs>
            <clipPath id="chart-area">
              <rect x="0" y="0" width={W} height={H} />
            </clipPath>
          </defs>
          <path d={`M0 4H${W}M0 ${H / 2}H${W}M0 ${H - 4}H${W}`} stroke="var(--divider)" strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
          <g fill="var(--text-3)">
            {inRange.map((p) => (
              <ellipse key={p.at} cx={x(p.at)} cy={y(p.value)} rx={r} ry={r} />
            ))}
          </g>
          <path
            d={trendPath}
            clipPath="url(#chart-area)"
            fill="none"
            stroke="var(--muscle-hit)"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div className="flex justify-between pl-[38px] text-[11px] text-ink-3" aria-hidden="true">
        <span>{fmt(start)}</span>
        <span>{fmt((start + now) / 2)}</span>
        <span>Today</span>
      </div>
    </section>
  );
}

/** Bar from BMI 15 to 35; each band's share of that width. */
const BMI_BANDS = [
  { from: 15, upTo: 18.5, color: "#5C7FA8" },
  { from: 18.5, upTo: 25, color: "#8FB33A" },
  { from: 25, upTo: 30, color: "#D98A3D" },
  { from: 30, upTo: 35, color: "#B85C4A" },
].map((b) => ({ ...b, width: ((b.upTo - b.from) / 20) * 100 }));

function BmiCard({ weightKg, heightCm }: { weightKg: number; heightCm?: number }) {
  if (!heightCm) {
    return (
      <Link to="/settings" className="flex flex-col gap-1 rounded-panel bg-surface p-4">
        <span className="text-[15px] font-bold">BMI and waist-to-height</span>
        <span className="text-[13px] text-accent-text">Add your height in Settings to see them</span>
      </Link>
    );
  }
  const value = bmi(weightKg, heightCm);
  const pos = Math.max(0, Math.min(100, ((value - 15) / 20) * 100));
  return (
    <section aria-label="BMI" className="flex flex-col gap-2.5 rounded-panel bg-surface p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[15px] font-bold">BMI</h2>
        <div>
          <span className="font-display text-2xl font-bold tabular">{r1(value)}</span>
          <span className="ml-2 text-[13px] font-bold text-record-text">{bmiCategory(value)}</span>
        </div>
      </div>
      <div className="relative pt-1.5">
        <div className="flex h-2.5 overflow-hidden rounded-[5px]" aria-hidden="true">
          {BMI_BANDS.map((b) => (
            <div key={b.upTo} style={{ width: `${b.width}%`, background: b.color }} />
          ))}
        </div>
        <div
          className="absolute top-0 h-[22px] w-1 -translate-x-1/2 rounded-sm bg-ink"
          style={{ left: `${pos}%`, boxShadow: "0 0 0 2px var(--surface)" }}
          aria-hidden="true"
        />
        <div className="mt-2 flex text-[11px] text-ink-3" aria-hidden="true">
          <span className="w-[17.5%]">18.5</span>
          <span className="w-[32.5%] text-right">25</span>
          <span className="w-[25%] text-right">30</span>
        </div>
      </div>
      <p className="text-[13px] leading-relaxed text-ink-2">
        BMI can't tell muscle from fat, so it reads high for people who lift. Waist-to-height is the better check.
      </p>
      <Link to="/settings" className="text-[13px] font-semibold text-accent-text">
        Based on height {heightCm} cm · change in Settings
      </Link>
    </section>
  );
}

function Tiles({
  series,
  waists,
  heightCm,
  now,
  onLogWaist,
}: {
  series: TrendPoint[];
  waists: Measurement[];
  heightCm?: number;
  now: number;
  onLogWaist: () => void;
}) {
  const lastWaist = waists[waists.length - 1];
  const waistChange = readingChangeOver(waists, now, 30);
  const avg7 = averageSince(series, now, 7);
  const low90 = lowestSince(series, now, 90);

  return (
    <section aria-label="Body numbers" className="grid grid-cols-2 gap-2.5">
      {heightCm && lastWaist ? (
        <Tile
          label="Waist ÷ height"
          value={waistToHeight(lastWaist.value, heightCm).toFixed(2)}
          sub="Healthy is under 0.50"
        />
      ) : null}
      <button type="button" onClick={onLogWaist} className="text-left">
        {lastWaist ? (
          <Tile
            label="Waist"
            value={r1(lastWaist.value).replace(/\.0$/, "")}
            unit="cm"
            sub={waistChange !== null ? `${signed(waistChange)} cm in 30 days · tap to log` : "Tap to log a new one"}
          />
        ) : (
          <Tile label="Waist" value="—" sub="Tap to log it. Measure at the belly button." />
        )}
      </button>
      {avg7 !== null ? <Tile label="7-day average" value={r1(avg7)} unit="kg" sub="Of your recent weigh-ins" /> : null}
      {low90 ? (
        <Tile
          label="Lowest, 90 days"
          value={r1(low90.value)}
          unit="kg"
          sub={new Date(low90.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
        />
      ) : null}
    </section>
  );
}

function Tile({ label, value, unit, sub }: { label: string; value: string; unit?: string; sub: string }) {
  return (
    <div className="h-full rounded-[18px] bg-surface p-3.5">
      <div className="text-xs font-bold uppercase tracking-[0.06em] text-ink-3">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold tabular">
        {value}
        {unit ? <span className="text-[13px] text-ink-3"> {unit}</span> : null}
      </div>
      <div className="mt-0.5 text-xs text-ink-2">{sub}</div>
    </div>
  );
}

function RecentWeighIns({
  series,
  entries,
  now,
  onPick,
}: {
  series: TrendPoint[];
  entries: Measurement[];
  now: number;
  onPick: (m: Measurement) => void;
}) {
  const recent = [...series].reverse().slice(0, 6);
  const byAt = new Map(entries.map((e) => [e.at, e]));
  return (
    <Section title="Recent weigh-ins">
      <GroupedList>
        {recent.map((p, i) => {
          const older = recent[i + 1];
          const entry = byAt.get(p.at);
          return (
            <ListRow
              key={p.at}
              title={whenShort(p.at, now)}
              trailing={
                <span className="flex items-baseline gap-3 tabular">
                  {older ? <span className="text-[13px] text-ink-3">{signed(p.value - older.value)}</span> : null}
                  <span className="font-display text-base font-bold">{r1(p.value)}</span>
                </span>
              }
              onClick={entry ? () => onPick(entry) : undefined}
            />
          );
        })}
      </GroupedList>
    </Section>
  );
}

/** "Scale today", "Scale yesterday" or "Last weigh-in Fri 6 Nov". */
function lastReadingLabel(at: number, now: number): string {
  const w = whenShort(at, now);
  return w === "Today" || w === "Yesterday" ? `Scale ${w.toLowerCase()}` : `Last weigh-in ${w}`;
}

function whenShort(at: number, now: number): string {
  const d = new Date(at);
  const n = new Date(now);
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOfDay(n) - startOfDay(d)) / DAY);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

function whenLong(at: number): string {
  return new Date(at).toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}
