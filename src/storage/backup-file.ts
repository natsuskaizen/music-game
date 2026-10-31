// Moving the backup file on and off the device: the share sheet where the browser has one (iOS), else a download.
import { parseBackup, serializeBackup } from '../core/backup';
import { loadAttempts, replaceAttempts } from './db';

const FILE_NAME = 'sight-reading-backup.json';

/** Offers the whole attempt log as a JSON file; false if the person closed the share sheet. */
export async function exportProgress(): Promise<boolean> {
  const file = new File([serializeBackup(await loadAttempts())], FILE_NAME, { type: 'application/json' });
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return false;
      throw error;
    }
  }
  const link = document.createElement('a');
  link.href = URL.createObjectURL(file);
  link.download = FILE_NAME;
  link.click();
  URL.revokeObjectURL(link.href);
  return true;
}

/** Replaces the device's progress with a backup file; returns how many attempts it held, or `null` if it is not a backup. */
export async function importProgress(file: File): Promise<number | null> {
  const attempts = parseBackup(await file.text());
  if (!attempts) return null;
  await replaceAttempts(attempts);
  return attempts.length;
}
