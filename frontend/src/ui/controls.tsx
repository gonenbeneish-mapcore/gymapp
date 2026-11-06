import clsx from "clsx";
import type { ReactNode } from "react";

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={clsx("inline-flex rounded-full bg-surface p-1", className)}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={clsx(
              "h-9 flex-1 rounded-full px-3.5 text-[13px] transition-colors",
              on ? "bg-ink font-bold text-bg" : "font-semibold text-ink-2",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Chip({
  selected,
  onClick,
  children,
  tone = "neutral",
}: {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
  tone?: "neutral" | "accent";
}) {
  return (
    <button
      type="button"
      aria-pressed={!!selected}
      onClick={onClick}
      className={clsx(
        "h-10 shrink-0 rounded-full px-4 text-sm transition-colors",
        selected
          ? tone === "accent"
            ? "bg-accent-soft font-bold text-accent-text"
            : "bg-ink font-bold text-bg"
          : tone === "accent"
            ? "bg-transparent font-semibold text-ink-2"
            : "bg-surface font-semibold text-ink",
      )}
    >
      {children}
    </button>
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx(
        "flex h-8 w-[52px] shrink-0 rounded-full p-[3px] transition-colors",
        checked ? "justify-end bg-accent" : "justify-start bg-surface-3",
      )}
    >
      <span className={clsx("h-[26px] w-[26px] rounded-full", checked ? "bg-[#0b0c0e]" : "bg-ink-2")} />
    </button>
  );
}
