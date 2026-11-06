import { Screen, ScreenHeader } from "../ui/layout";
import { EmptyState } from "../ui/EmptyState";
import { HistoryIcon } from "../ui/icons";

export function HistoryPage() {
  return (
    <Screen>
      <ScreenHeader title="History" />
      <EmptyState
        icon={<HistoryIcon size={28} />}
        title="No workouts yet"
        body="Finished workouts, records and progress charts will show up here."
      />
    </Screen>
  );
}
