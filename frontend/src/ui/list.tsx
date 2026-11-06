import clsx from "clsx";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRightIcon } from "./icons";

/** Borderless surface panel. */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("rounded-panel bg-surface p-4", className)}>{children}</div>;
}

/** iOS-style grouped list: one surface, rows split by thin dividers. */
export function GroupedList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("overflow-hidden rounded-panel bg-surface [&>*+*]:border-t [&>*+*]:border-divider", className)}>
      {children}
    </div>
  );
}

type RowProps = {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  to?: string;
  onClick?: () => void;
};

export function ListRow({ leading, title, subtitle, trailing, chevron, to, onClick }: RowProps) {
  const body = (
    <>
      {leading}
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-semibold">{title}</div>
        {subtitle ? <div className="mt-0.5 truncate text-[13px] text-ink-3">{subtitle}</div> : null}
      </div>
      {trailing}
      {chevron ? <ChevronRightIcon size={16} className="shrink-0 text-ink-3" /> : null}
    </>
  );
  const cls = "flex min-h-[60px] w-full items-center gap-3.5 px-4 py-3 text-left text-ink";
  if (to) {
    return (
      <Link to={to} className={cls}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls}>
        {body}
      </button>
    );
  }
  return <div className={cls}>{body}</div>;
}

/** Square tile used as a list leading element (initials or an icon). */
export function Tile({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-surface-2 font-display text-[15px] font-bold text-accent-text",
        className,
      )}
    >
      {children}
    </div>
  );
}
