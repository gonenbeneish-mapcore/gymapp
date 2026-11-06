import clsx from "clsx";
import type { ReactNode } from "react";

/** Page body for a tab screen: safe-area top padding, room for the tab bar. */
export function Screen({
  children,
  className,
  withTabBar = true,
}: {
  children: ReactNode;
  className?: string;
  withTabBar?: boolean;
}) {
  return (
    <main
      className={clsx(
        "mx-auto flex w-full max-w-md flex-col gap-6 px-5 pt-safe",
        withTabBar ? "pb-[calc(110px+env(safe-area-inset-bottom))]" : "pb-[calc(40px+env(safe-area-inset-bottom))]",
        className,
      )}
    >
      {children}
    </main>
  );
}

export function ScreenHeader({
  kicker,
  title,
  action,
}: {
  kicker?: ReactNode;
  title: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-3 pt-4 animate-rise">
      <div className="min-w-0">
        {kicker ? <div className="text-sm font-semibold text-ink-2">{kicker}</div> : null}
        <h1 className="mt-0.5 font-display text-[36px] font-bold leading-[1.05] tracking-[-0.03em]">
          {title}
        </h1>
      </div>
      {action}
    </header>
  );
}

export function Section({
  title,
  action,
  children,
  className,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("flex flex-col gap-3", className)}>
      {title || action ? (
        <div className="flex items-baseline justify-between gap-3">
          {title ? <h2 className="font-display text-xl font-bold">{title}</h2> : <span />}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
