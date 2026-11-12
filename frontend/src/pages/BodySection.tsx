import { useState } from "react";
import { Section } from "../ui/layout";
import { GroupedList, ListRow } from "../ui/list";
import { NumberPadSheet } from "../ui/NumberPad";
import { useProfile } from "../data/hooks";
import { saveProfile } from "../data/measure";
import { kg } from "../domain/format";

type Field = "heightCm" | "goalKg";

const FIELDS: Record<Field, { title: string; unit: string; min: number; max: number; decimals: number; step: number }> = {
  heightCm: { title: "Height", unit: "cm", min: 100, max: 250, decimals: 0, step: 1 },
  goalKg: { title: "Goal weight", unit: "kg", min: 30, max: 300, decimals: 1, step: 0.5 },
};

/** Height and goal weight, used by the Measure tab. */
export function BodySection() {
  const profile = useProfile();
  const [editing, setEditing] = useState<Field | null>(null);
  const [error, setError] = useState<string | null>(null);

  const value = (f: Field) => {
    const v = profile?.[f];
    return v == null ? "Not set" : `${kg(v)} ${FIELDS[f].unit}`;
  };

  return (
    <Section title="Body">
      <GroupedList>
        <ListRow title="Height" subtitle="For BMI and waist-to-height" trailing={<Value text={value("heightCm")} />} onClick={() => setEditing("heightCm")} chevron />
        <ListRow title="Goal weight" subtitle="For the goal bar on Measure" trailing={<Value text={value("goalKg")} />} onClick={() => setEditing("goalKg")} chevron />
      </GroupedList>
      {error ? (
        <p role="alert" className="text-sm font-semibold text-record-text">
          {error}
        </p>
      ) : null}
      {editing ? (
        <NumberPadSheet
          open
          title={FIELDS[editing].title}
          unit={FIELDS[editing].unit}
          initial={profile?.[editing] != null ? kg(profile[editing]!) : ""}
          options={{ decimals: FIELDS[editing].decimals, maxInt: 3, step: FIELDS[editing].step }}
          onClose={() => setEditing(null)}
          onDone={(raw) => {
            const f = editing;
            setEditing(null);
            const n = Number.parseFloat(raw);
            const { min, max, unit, title } = FIELDS[f];
            if (!Number.isFinite(n) || n < min || n > max) {
              setError(`${title} should be between ${min} and ${max} ${unit}.`);
              return;
            }
            setError(null);
            void saveProfile({ [f]: n });
          }}
        />
      ) : null}
    </Section>
  );
}

function Value({ text }: { text: string }) {
  return <span className="text-[15px] font-semibold text-ink-2 tabular">{text}</span>;
}
