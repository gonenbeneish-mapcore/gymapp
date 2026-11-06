import { Screen, ScreenHeader } from "../ui/layout";
import { EmptyState } from "../ui/EmptyState";
import { MeasureIcon } from "../ui/icons";

export function MeasurePage() {
  return (
    <Screen>
      <ScreenHeader title="Measure" />
      <EmptyState
        icon={<MeasureIcon size={28} />}
        title="Weigh-ins are coming"
        body="Trend weight, weekly rate, BMI and waist-to-height will live here."
      />
    </Screen>
  );
}
