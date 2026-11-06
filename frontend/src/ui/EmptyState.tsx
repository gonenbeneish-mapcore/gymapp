import type { ReactNode } from "react";

export function EmptyState({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex animate-rise flex-col items-center gap-3 rounded-panel bg-surface px-6 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-text">
        {icon}
      </div>
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <p className="max-w-[260px] text-sm leading-relaxed text-ink-2">{body}</p>
    </div>
  );
}
