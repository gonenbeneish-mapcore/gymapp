import clsx from "clsx";

export type Variant = "primary" | "secondary" | "inverse" | "ghost" | "dark";
export type Size = "lg" | "md" | "sm";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink",
  secondary: "bg-surface-3 text-ink",
  inverse: "bg-ink text-bg",
  ghost: "bg-transparent text-accent-text",
  /** Dark button that sits on top of an accent-coloured card. */
  dark: "bg-[#0b0c0e] text-[#c8f04a]",
};

const sizes: Record<Size, string> = {
  lg: "h-14 rounded-[18px] px-5 text-[17px]",
  md: "h-12 rounded-[14px] px-4 text-[15px]",
  sm: "h-11 rounded-full px-4 text-[15px]",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  block = false,
}: { variant?: Variant; size?: Size; block?: boolean } = {}) {
  return clsx(
    "inline-flex select-none items-center justify-center gap-2 font-bold transition active:scale-[.98] disabled:opacity-40",
    variants[variant],
    sizes[size],
    block && "w-full",
  );
}
