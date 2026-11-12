import { useState, type ReactNode } from "react";
import { Button } from "./Button";
import { BackspaceIcon } from "./icons";
import { Sheet } from "./Sheet";
import { pressKey, stepValue, type NumberPadOptions } from "./numberPadLogic";

/**
 * Our own number pad in a bottom sheet, so the iOS keyboard never covers the screen.
 * The first key press replaces the shown value; after that keys append.
 */
export function NumberPadSheet({
  open,
  title,
  unit,
  initial,
  onClose,
  onDone,
  options = {},
  header,
}: {
  open: boolean;
  title: string;
  /** Shown under the title, e.g. a date picker. */
  header?: ReactNode;
  unit?: string;
  initial: string;
  onClose: () => void;
  onDone: (value: string) => void;
  options?: NumberPadOptions;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {open ? (
        <PadBody title={title} unit={unit} initial={initial} onDone={onDone} options={options} header={header} />
      ) : null}
    </Sheet>
  );
}

function PadBody({
  title,
  unit,
  initial,
  onDone,
  options,
  header,
}: {
  title: string;
  unit?: string;
  initial: string;
  onDone: (value: string) => void;
  options: NumberPadOptions;
  header?: ReactNode;
}) {
  const [value, setValue] = useState(initial);
  const [fresh, setFresh] = useState(true);
  const step = options.step ?? 1;
  const decimals = options.decimals ?? 1;
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", decimals ? "." : "", "0", "del"];

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-center text-[17px] font-bold">{title}</h2>
      {header}
      <div className="flex items-center justify-center gap-3.5">
        <button
          type="button"
          aria-label={`Minus ${step}`}
          onClick={() => {
            setValue((v) => stepValue(v, -step, decimals));
            setFresh(true);
          }}
          className="h-[52px] w-[52px] rounded-2xl bg-surface-2 text-2xl font-semibold"
        >
          −
        </button>
        <div role="status" aria-live="polite" className="min-w-[170px] text-center">
          <span className="font-display text-[56px] font-bold leading-none tabular">{value || "0"}</span>
          {unit ? <span className="ml-1 text-xl font-semibold text-ink-3">{unit}</span> : null}
        </div>
        <button
          type="button"
          aria-label={`Plus ${step}`}
          onClick={() => {
            setValue((v) => stepValue(v, step, decimals));
            setFresh(true);
          }}
          className="h-[52px] w-[52px] rounded-2xl bg-surface-2 text-2xl font-semibold"
        >
          +
        </button>
      </div>
      <div role="group" aria-label="Number pad" className="grid grid-cols-3 gap-2">
        {keys.map((k, i) =>
          k === "" ? (
            <span key={i} />
          ) : (
            <button
              key={k}
              type="button"
              aria-label={k === "del" ? "Delete" : k === "." ? "Decimal point" : k}
              onClick={() => {
                setValue((v) => pressKey(v, k, fresh, options));
                setFresh(false);
              }}
              className="flex h-14 items-center justify-center rounded-2xl bg-surface-2 font-display text-2xl font-semibold active:bg-surface-3"
            >
              {k === "del" ? <BackspaceIcon size={24} /> : k}
            </button>
          ),
        )}
      </div>
      <Button size="lg" block onClick={() => onDone(value || "0")}>
        Done
      </Button>
    </div>
  );
}
