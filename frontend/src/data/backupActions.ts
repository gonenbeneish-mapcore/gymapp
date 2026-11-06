import { backupFileName, createBackup, setLastBackupAt } from "./backup";
import { saveTextFile, type SaveResult } from "../lib/saveFile";

/** Create a backup file and hand it to the user. Records the time unless they cancelled. */
export async function backUpNow(): Promise<SaveResult> {
  const backup = await createBackup();
  const result = await saveTextFile(backupFileName(backup.exportedAt), JSON.stringify(backup));
  if (result !== "cancelled") await setLastBackupAt(backup.exportedAt);
  return result;
}

/** "today", "yesterday", "5 days ago", or a date for older backups. */
export function backupAge(at: number | undefined, now = Date.now()): string {
  if (at == null) return "never";
  const startOf = (t: number) => new Date(new Date(t).toDateString()).getTime();
  const days = Math.round((startOf(now) - startOf(at)) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export const BACKUP_REMINDER_DAYS = 7;

export function backupIsDue(lastAt: number | undefined, completedSessions: number, now = Date.now()): boolean {
  if (completedSessions === 0) return false;
  return lastAt == null || now - lastAt > BACKUP_REMINDER_DAYS * 86_400_000;
}
