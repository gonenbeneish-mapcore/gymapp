import { CalendarIcon, ChevronDownIcon } from "./icons";
import { dateLabel } from "../domain/dates";


/**
 * A date that looks like a button. Tapping it opens the browser's own date picker
 * (a native date input sits invisibly on top): a wheel on iPhone, a calendar on desktop.
 */
export function DateField({
  value,
  max,
  onChange,
  label = "Date",
}: {
  value: string;
  max: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <div className="relative mx-auto flex h-11 items-center gap-2 rounded-full bg-surface-2 px-4 text-[15px] font-semibold text-ink">
      <CalendarIcon size={16} className="text-ink-2" />
      <span>{dateLabel(value, max)}</span>
      <ChevronDownIcon size={14} className="text-ink-3" />
      <input
        type="date"
        aria-label={label}
        value={value}
        max={max}
        required
        onChange={(e) => {
          if (e.target.value) onChange(e.target.value > max ? max : e.target.value);
        }}
        // A tap on the field opens the picker on iPhone by itself, but desktop browsers
        // (Chrome, Brave, Edge) only open it from their own small calendar icon, so ask for it.
        onClick={(e) => {
          try {
            e.currentTarget.showPicker();
          } catch {
            // Already open, or not supported: the browser's own behaviour applies.
          }
        }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}
