import { useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { Screen, Section } from "../ui/layout";
import { GroupedList, ListRow } from "../ui/list";
import { Segmented } from "../ui/controls";
import { ChevronLeftIcon } from "../ui/icons";
import {
  ACCENTS,
  getAccent,
  getTheme,
  saveAccent,
  saveTheme,
  type AccentId,
  type ThemePref,
} from "../lib/appearance";
import { BackupSection } from "./BackupSection";

export function SettingsPage() {
  const [theme, setTheme] = useState<ThemePref>(getTheme);
  const [accent, setAccent] = useState<AccentId>(getAccent);

  return (
    <Screen withTabBar={false}>
      <header className="flex flex-col gap-1.5 pt-2">
        <Link to="/train" className="-ml-1 flex h-11 items-center gap-1 self-start text-base font-semibold text-accent-text">
          <ChevronLeftIcon size={20} />
          Train
        </Link>
        <h1 className="font-display text-[34px] font-bold leading-[1.05] tracking-[-0.03em]">Settings</h1>
      </header>

      <BackupSection />

      <Section title="Look">
        <div className="flex flex-col gap-4 rounded-panel bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-base font-medium">Theme</span>
            <Segmented
              label="Theme"
              value={theme}
              onChange={(v) => {
                setTheme(v);
                saveTheme(v);
              }}
              options={[
                { value: "system", label: "System" },
                { value: "dark", label: "Dark" },
                { value: "light", label: "Light" },
              ]}
            />
          </div>
          <div>
            <div id="accent-label" className="text-base font-medium">
              Accent colour
            </div>
            <div role="radiogroup" aria-labelledby="accent-label" className="mt-3 flex gap-3">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  role="radio"
                  aria-checked={accent === a.id}
                  aria-label={a.name}
                  onClick={() => {
                    setAccent(a.id);
                    saveAccent(a.id);
                  }}
                  className={clsx(
                    "h-12 w-12 rounded-2xl border-[3px] transition",
                    accent === a.id ? "border-ink" : "border-transparent",
                  )}
                  style={{ background: a.hex }}
                />
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Coming in later steps">
        <GroupedList>
          <ListRow title="Height and goal weight" subtitle="Used by the Measure tab" />
          <ListRow title="Default rest and screen-on" subtitle="Workout options" />
        </GroupedList>
      </Section>

      <Link to="/design" className="text-center text-sm font-semibold text-ink-3">
        Component showcase
      </Link>
    </Screen>
  );
}
