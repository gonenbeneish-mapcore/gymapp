import { useRef, useState } from "react";
import clsx from "clsx";
import { Section } from "../ui/layout";
import { Button } from "../ui/Button";
import { Sheet } from "../ui/Sheet";
import { DownloadIcon } from "../ui/icons";
import { useActiveSession, useCompletedSessions, useLastBackupAt } from "../data/hooks";
import { parseBackup, restoreBackup, summarize, type Backup, type BackupSummary } from "../data/backup";
import { backUpNow, backupAge, backupIsDue } from "../data/backupActions";

type Pending = { backup: Backup; summary: BackupSummary } | { error: string } | null;

function fmtDate(t: number) {
  return new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function BackupSection() {
  const lastAt = useLastBackupAt();
  const completed = useCompletedSessions();
  const active = useActiveSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending>(null);

  const due = lastAt !== undefined && completed !== undefined && backupIsDue(lastAt ?? undefined, completed.length);

  async function onBackup() {
    setBusy(true);
    setMessage(null);
    try {
      const r = await backUpNow();
      if (r === "shared") setMessage("Backup saved.");
      else if (r === "downloaded") setMessage("Backup file downloaded.");
    } catch {
      setMessage("Couldn't create the backup. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    const result = parseBackup(await file.text());
    setPending(result.ok ? { backup: result.backup, summary: summarize(result.backup) } : { error: result.error });
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onRestore(b: Backup) {
    setBusy(true);
    try {
      await restoreBackup(b);
      setPending(null);
      setMessage("Backup restored.");
    } catch {
      setPending({ error: "Restoring failed. Nothing was changed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Backup">
      <div className="flex flex-col gap-3.5 rounded-panel bg-surface p-4">
        <div className="flex items-start gap-3">
          <div
            className={clsx(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              due ? "bg-record-soft text-record" : "bg-accent-soft text-accent-text",
            )}
          >
            <DownloadIcon size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold">
              {lastAt === undefined ? "…" : lastAt === null ? "Never backed up" : `Last backup ${backupAge(lastAt)}`}
            </div>
            <p className="mt-0.5 text-[13px] leading-snug text-ink-3">
              Your data lives only on this phone. Save a backup file to iCloud Drive or Google Drive with “Save to Files”.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={onBackup} disabled={busy}>
            Back up now
          </Button>
          <Button variant="secondary" disabled={busy} onClick={() => fileRef.current?.click()}>
            Restore
          </Button>
        </div>
        {message ? (
          <p role="status" className="text-center text-[13px] font-semibold text-accent-text">
            {message}
          </p>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json,text/plain"
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </div>

      <Sheet open={pending !== null} onClose={() => setPending(null)} title="Restore backup">
        {pending && "error" in pending ? (
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-2xl font-bold">Can't restore</h2>
            <p className="text-sm text-ink-2">{pending.error}</p>
            <Button size="lg" variant="secondary" block onClick={() => setPending(null)}>
              OK
            </Button>
          </div>
        ) : pending ? (
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-2xl font-bold">Restore this backup?</h2>
            <div className="overflow-hidden rounded-panel bg-surface-2 [&>*+*]:border-t [&>*+*]:border-divider">
              <Row label="Made on" value={fmtDate(pending.summary.exportedAt)} />
              <Row label="Workouts logged" value={String(pending.summary.completedSessions)} />
              {pending.summary.firstSessionAt ? (
                <Row
                  label="From – to"
                  value={`${fmtDate(pending.summary.firstSessionAt)} – ${fmtDate(pending.summary.lastSessionAt!)}`}
                />
              ) : null}
              <Row label="Workout plans" value={String(pending.summary.workouts)} />
            </div>
            <p className="text-sm text-ink-2">
              This replaces all workouts, plans and notes on this phone
              {active ? ", including the workout in progress" : ""}. It can't be undone.
            </p>
            <Button size="lg" block disabled={busy} onClick={() => void onRestore(pending.backup)}>
              Replace and restore
            </Button>
            <Button size="lg" variant="secondary" block onClick={() => setPending(null)}>
              Cancel
            </Button>
          </div>
        ) : null}
      </Sheet>
    </Section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 text-[15px]">
      <span className="text-ink-2">{label}</span>
      <span className="font-semibold tabular">{value}</span>
    </div>
  );
}
