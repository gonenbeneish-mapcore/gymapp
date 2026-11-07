import type { Equipment } from "../data/types";
import { BodyweightIcon, CableIcon, ExercisesIcon, MachineIcon } from "./icons";

export function EquipmentIcon({ equipment, size = 22 }: { equipment: Equipment; size?: number }) {
  if (equipment === "machine") return <MachineIcon size={size} />;
  if (equipment === "cable") return <CableIcon size={size} />;
  if (equipment === "bodyweight") return <BodyweightIcon size={size} />;
  return <ExercisesIcon size={size} />;
}
