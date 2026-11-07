import { useState } from "react";
import { useCompletedSessions, useLastBackupAt } from "../data/hooks";
import { backUpNow, backupAge, backupIsDue } from "../data/backupActions";
import { DownloadIcon } from "../ui/icons";

/** Shown on Train when there are logged workouts and no backup in the last week. */
export function BackupReminder() {
  const lastAt = useLastBackupAt();
  const completed = useCompletedSessions();
  const [busy, setBusy] = useState(false);

  if (lastAt === undefined || completed === undefined) return null;
  if (!backupIsDue(lastAt ?? undefined, completed.length)) return null;

  return (
    <section
      aria-label="Backup reminder"
      className="flex animate-rise items-center gap-3 rounded-panel bg-record-soft px-4 py-3"
    >
      <DownloadIcon size={20} className="shrink-0 text-record-text" />
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold">Back up your workouts</div>
        <div className="text-[13px] text-ink-2">
          {lastAt === null ? "They're only on this phone so far." : `Last backup ${backupAge(lastAt)}.`}
        </div>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await backUpNow();
          } finally {
            setBusy(false);
          }
        }}
        className="h-11 shrink-0 rounded-full bg-record px-4 text-[15px] font-bold text-[#0b0c0e] disabled:opacity-50"
      >
        Back up
      </button>
    </section>
  );
}
