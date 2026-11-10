import { useState } from "react";
import type { Exercise } from "../data/types";
import { Tile } from "./list";
import { EquipmentIcon } from "./EquipmentIcon";

/** List tile: the machine's photo when there is one (and it loads), otherwise the equipment icon. */
export function ExerciseThumb({ exercise: e }: { exercise: Exercise }) {
  const [broken, setBroken] = useState(false);
  if (e.image && !broken) {
    return (
      <Tile className="overflow-hidden !bg-[#f4f5f6] p-0.5">
        <img src={e.image} alt="" loading="lazy" onError={() => setBroken(true)} className="h-full w-full object-contain" />
      </Tile>
    );
  }
  return (
    <Tile>
      <EquipmentIcon equipment={e.equipment} />
    </Tile>
  );
}
