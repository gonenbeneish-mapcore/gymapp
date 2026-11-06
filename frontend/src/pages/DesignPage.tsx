import { useState } from "react";
import { Link } from "react-router-dom";
import { Screen, Section } from "../ui/layout";
import { Button, IconButton } from "../ui/Button";
import { Chip, Segmented, Switch } from "../ui/controls";
import { GroupedList, ListRow, Panel, Tile } from "../ui/list";
import { NumberPadSheet } from "../ui/NumberPad";
import {
  CableIcon,
  ChevronLeftIcon,
  ExercisesIcon,
  ExercisesIconSolid,
  HistoryIcon,
  HistoryIconSolid,
  MachineIcon,
  MeasureIcon,
  MeasureIconSolid,
  PlayIcon,
  PlusIcon,
  TrainIcon,
  TrainIconSolid,
} from "../ui/icons";

/** Developer showcase of the design system. Not linked from the tab bar. */
export function DesignPage() {
  const [seg, setSeg] = useState<"a" | "b">("a");
  const [chip, setChip] = useState("All");
  const [on, setOn] = useState(true);
  const [weight, setWeight] = useState("47.5");
  const [padOpen, setPadOpen] = useState(false);

  return (
    <Screen withTabBar={false}>
      <header className="flex flex-col gap-1.5 pt-2">
        <Link to="/settings" className="-ml-1 flex h-11 items-center gap-1 self-start font-semibold text-accent-text">
          <ChevronLeftIcon size={20} />
          Settings
        </Link>
        <h1 className="font-display text-[34px] font-bold tracking-[-0.03em]">Components</h1>
      </header>

      <Section title="Tab icons">
        <Panel className="grid grid-cols-4 gap-3 text-ink-2">
          {[TrainIcon, ExercisesIcon, MeasureIcon, HistoryIcon].map((I, i) => (
            <div key={i} className="flex justify-center">
              <I size={30} />
            </div>
          ))}
          {[TrainIconSolid, ExercisesIconSolid, MeasureIconSolid, HistoryIconSolid].map((I, i) => (
            <div key={i} className="flex justify-center">
              <span className="flex h-[30px] w-14 items-center justify-center rounded-full bg-accent-soft" style={{ color: "var(--tab-active)" }}>
                <I />
              </span>
            </div>
          ))}
        </Panel>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-col gap-2.5">
          <Button size="lg" block icon={<PlayIcon />}>
            Start workout
          </Button>
          <div className="flex gap-2.5">
            <Button variant="secondary">Secondary</Button>
            <Button variant="inverse">Inverse</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="flex gap-2.5">
            <IconButton aria-label="Add">
              <PlusIcon size={20} />
            </IconButton>
            <Button size="sm">Finish</Button>
          </div>
        </div>
      </Section>

      <Section title="Controls">
        <Segmented
          label="Example"
          value={seg}
          onChange={setSeg}
          options={[
            { value: "a", label: "Workouts" },
            { value: "b", label: "Exercises" },
          ]}
        />
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {["All", "Machine", "Free weight", "Cable", "Bodyweight"].map((c) => (
            <Chip key={c} selected={chip === c} onClick={() => setChip(c)}>
              {c}
            </Chip>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-panel bg-surface p-4">
          <span className="font-medium">Keep screen on</span>
          <Switch checked={on} onChange={setOn} label="Keep screen on" />
        </div>
      </Section>

      <Section title="List">
        <GroupedList>
          <ListRow leading={<Tile><MachineIcon size={22} /></Tile>} title="Chest Press" subtitle="Machine · Chest, Arms" chevron />
          <ListRow leading={<Tile><CableIcon size={22} /></Tile>} title="Triceps Pushdown" subtitle="Cable · Arms" chevron />
        </GroupedList>
      </Section>

      <Section title="Number pad">
        <button
          type="button"
          onClick={() => setPadOpen(true)}
          className="flex h-14 items-center justify-between rounded-panel bg-surface px-4"
        >
          <span className="font-medium">Weight</span>
          <span className="font-display text-xl font-bold tabular">{weight} kg</span>
        </button>
      </Section>

      <NumberPadSheet
        open={padOpen}
        title="Weight"
        unit="kg"
        initial={weight}
        options={{ decimals: 1, step: 2.5 }}
        onClose={() => setPadOpen(false)}
        onDone={(v) => {
          setWeight(v);
          setPadOpen(false);
        }}
      />
    </Screen>
  );
}
