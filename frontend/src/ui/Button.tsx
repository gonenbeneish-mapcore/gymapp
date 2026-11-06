import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { buttonClass, type Size, type Variant } from "./buttonClass";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  icon?: ReactNode;
};

export function Button({
  variant,
  size,
  block,
  icon,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={clsx(buttonClass({ variant, size, block }), className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}

/** Round icon-only button. Always pass an aria-label. */
export function IconButton({
  className,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { "aria-label": string }) {
  return (
    <button
      type={type}
      className={clsx(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-ink transition active:scale-95",
        className,
      )}
      {...rest}
    />
  );
}
