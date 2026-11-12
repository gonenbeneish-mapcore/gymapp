import { useEffect, useMemo, useState } from "react";
import { GroupedList, ListRow } from "../ui/list";
import { Chip } from "../ui/controls";
import { PlusIcon, SearchIcon } from "../ui/icons";
import { ExerciseThumb } from "../ui/ExerciseThumb";
import { useExerciseMap } from "../data/hooks";
import type { Exercise } from "../data/types";
import { EQUIPMENT_LABEL, EQUIPMENT_LIST, MUSCLE_LABEL, MUSCLE_LIST } from "../domain/labels";
import { exerciseMeta, filterExercises, type ExerciseFilter } from "../domain/exerciseSearch";

const EQUIPMENT = EQUIPMENT_LIST;
const MUSCLES = MUSCLE_LIST;
const STRIP = "-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

/**
 * Search box, equipment and muscle chips, and the matching exercises.
 * Without `onPick` each row opens the exercise page; with it, tapping a row picks it.
 */
export function ExerciseBrowser({
  initial = {},
  onFiltersChange,
  onPick,
  picked,
}: {
  initial?: ExerciseFilter;
  onFiltersChange?: (f: ExerciseFilter) => void;
  onPick?: (e: Exercise) => void;
  /** Ids already in the workout, marked in the list. */
  picked?: Set<string>;
}) {
  const exercises = useExerciseMap();
  const [query, setQuery] = useState(initial.query ?? "");
  const [equipment, setEquipment] = useState(initial.equipment);
  const [muscle, setMuscle] = useState(initial.muscle);

  useEffect(() => {
    onFiltersChange?.({ query, equipment, muscle });
  }, [query, equipment, muscle, onFiltersChange]);

  const results = useMemo(
    () => (exercises ? filterExercises(exercises.values(), { query, equipment, muscle }) : undefined),
    [exercises, query, equipment, muscle],
  );

  return (
    <>
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
                  to={onPick ? undefined : `/exercises/${e.id}`}
                  onClick={onPick ? () => onPick(e) : undefined}
                  leading={<ExerciseThumb key={e.id} exercise={e} />}
                  title={e.name}
                  subtitle={picked?.has(e.id) ? `In this workout · ${exerciseMeta(e)}` : exerciseMeta(e)}
                  trailing={
                    onPick ? (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-text">
                        <PlusIcon size={18} />
                      </span>
                    ) : undefined
                  }
                  chevron={!onPick}
                />
              ))}
            </GroupedList>
          )}
        </section>
      )}
    </>
  );
}
