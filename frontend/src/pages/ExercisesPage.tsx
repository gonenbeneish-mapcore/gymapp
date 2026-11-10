import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Screen, ScreenHeader } from "../ui/layout";
import { GroupedList, ListRow } from "../ui/list";
import { Chip } from "../ui/controls";
import { SearchIcon } from "../ui/icons";
import { ExerciseThumb } from "../ui/ExerciseThumb";
import { useExerciseMap } from "../data/hooks";
import type { Equipment, Muscle } from "../data/types";
import { EQUIPMENT_LABEL, MUSCLE_LABEL } from "../domain/labels";
import { exerciseMeta, filterExercises } from "../domain/exerciseSearch";

const EQUIPMENT = Object.keys(EQUIPMENT_LABEL) as Equipment[];
const MUSCLES = Object.keys(MUSCLE_LABEL) as Muscle[];
const STRIP = "-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export function ExercisesPage() {
  const exercises = useExerciseMap();
  // Filters are copied into the URL so they survive opening an exercise and coming back.
  // The page's own state stays the source of truth, so fast typing never loses letters.
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(() => params.get("q") ?? "");
  const [equipment, setEquipment] = useState(() => EQUIPMENT.find((e) => e === params.get("eq")));
  const [muscle, setMuscle] = useState(() => MUSCLES.find((m) => m === params.get("m")));

  useEffect(() => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (equipment) next.set("eq", equipment);
    if (muscle) next.set("m", muscle);
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  }, [query, equipment, muscle, params, setParams]);

  const results = useMemo(
    () => (exercises ? filterExercises(exercises.values(), { query, equipment, muscle }) : undefined),
    [exercises, query, equipment, muscle],
  );

  return (
    <Screen className="gap-4">
      <ScreenHeader title="Exercises" />

      <div className="relative animate-rise">
        <label htmlFor="exercise-search" className="sr-only">
          Search exercises
        </label>
        <SearchIcon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          id="exercise-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or muscle"
          autoComplete="off"
          className="h-[50px] w-full rounded-full bg-surface pl-11 pr-4 text-base text-ink outline-none placeholder:text-ink-3 focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>

      <div role="group" aria-label="Equipment" className={STRIP}>
        <Chip selected={!equipment} onClick={() => setEquipment(undefined)}>
          All
        </Chip>
        {EQUIPMENT.map((e) => (
          <Chip key={e} selected={equipment === e} onClick={() => setEquipment(equipment === e ? undefined : e)}>
            {EQUIPMENT_LABEL[e]}
          </Chip>
        ))}
      </div>

      <div role="group" aria-label="Main muscle" className={`${STRIP} -mt-1 gap-1.5`}>
        {MUSCLES.map((m) => (
          <Chip key={m} tone="accent" selected={muscle === m} onClick={() => setMuscle(muscle === m ? undefined : m)}>
            {MUSCLE_LABEL[m]}
          </Chip>
        ))}
      </div>

      {!results ? (
        <div className="h-[400px] rounded-panel bg-surface" aria-busy="true" />
      ) : (
        <section aria-label="Results" className="flex flex-col gap-3">
          <h2 role="status" className="font-display text-lg font-bold">
            {results.length} {results.length === 1 ? "exercise" : "exercises"}
          </h2>
          {results.length === 0 ? (
            <div className="rounded-panel bg-surface px-4 py-8 text-center text-[15px] text-ink-2">
              No exercises match. Try another filter.
            </div>
          ) : (
            <GroupedList>
              {results.map((e) => (
                <ListRow
                  key={e.id}
                  to={`/exercises/${e.id}`}
                  leading={<ExerciseThumb key={e.id} exercise={e} />}
                  title={e.name}
                  subtitle={exerciseMeta(e)}
                  chevron
                />
              ))}
            </GroupedList>
          )}
        </section>
      )}
    </Screen>
  );
}
