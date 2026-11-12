import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Screen, ScreenHeader } from "../ui/layout";
import { ExerciseBrowser } from "./ExerciseBrowser";
import { EQUIPMENT_LIST as EQUIPMENT, MUSCLE_LIST as MUSCLES } from "../domain/labels";
import type { ExerciseFilter } from "../domain/exerciseSearch";

export function ExercisesPage() {
  // Filters are copied into the URL so they survive opening an exercise and coming back.
  // The browser's own state stays the source of truth, so fast typing never loses letters.
  const [params, setParams] = useSearchParams();
  const [initial] = useState<ExerciseFilter>(() => ({
    query: params.get("q") ?? "",
    equipment: EQUIPMENT.find((e) => e === params.get("eq")),
    muscle: MUSCLES.find((m) => m === params.get("m")),
  }));

  const mirror = useCallback(
    ({ query, equipment, muscle }: ExerciseFilter) => {
      const next = new URLSearchParams();
      if (query) next.set("q", query);
      if (equipment) next.set("eq", equipment);
      if (muscle) next.set("m", muscle);
      setParams((prev) => (next.toString() !== prev.toString() ? next : prev), { replace: true });
    },
    [setParams],
  );

  return (
    <Screen className="gap-4">
      <ScreenHeader title="Exercises" />
      <ExerciseBrowser initial={initial} onFiltersChange={mirror} />
    </Screen>
  );
}
