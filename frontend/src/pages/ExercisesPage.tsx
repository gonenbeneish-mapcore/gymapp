import { Screen, ScreenHeader } from "../ui/layout";
import { EmptyState } from "../ui/EmptyState";
import { ExercisesIcon } from "../ui/icons";

export function ExercisesPage() {
  return (
    <Screen>
      <ScreenHeader title="Exercises" />
      <EmptyState
        icon={<ExercisesIcon size={28} />}
        title="Exercise bank is next"
        body="Machines from your gym, free weights and your own exercises — each with a picture, how-to and an optional video."
      />
    </Screen>
  );
}
