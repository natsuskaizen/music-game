// Backup file (design §10): the attempt log as JSON. Stats are rebuilt from it, so the file holds nothing else.
import { isLetter } from './pitch';
import { applyAttempt, newStat, type Attempt, type NoteStat } from './stats';

const BACKUP_VERSION = 1;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

function isAnswer(value: unknown): boolean {
  if (value === null) return true;
  if (!isRecord(value)) return false;
  return value.kind === 'letter'
    ? isLetter(value.letter)
    : value.kind === 'pitch' && Number.isFinite(value.midi);
}

const isTries = (value: unknown) => value === 1 || value === 2;

function isAttempt(value: unknown): value is Attempt {
  return (
    isRecord(value) &&
    Number.isFinite(value.ts) &&
    Number.isFinite(value.ms) &&
    typeof value.key === 'string' &&
    typeof value.input === 'string' &&
    typeof value.correct === 'boolean' &&
    isTries(value.tries) &&
    isAnswer(value.answer)
  );
}

/** The backup file's text for these attempts. */
export function serializeBackup(attempts: readonly Attempt[]): string {
  return JSON.stringify({ v: BACKUP_VERSION, attempts });
}

/** The attempts in a backup file, or `null` if the text is not a valid backup (nothing is half-read). */
export function parseBackup(text: string): Attempt[] | null {
  try {
    const data: unknown = JSON.parse(text);
    if (!isRecord(data) || data.v !== BACKUP_VERSION || !Array.isArray(data.attempts)) return null;
    return data.attempts.every(isAttempt) ? data.attempts : null;
  } catch {
    return null;
  }
}

/** Per-note stats rebuilt by replaying the attempts oldest first, as if they had just been answered. */
export function rebuildStats(attempts: readonly Attempt[]): NoteStat[] {
  const stats = new Map<string, NoteStat>();
  for (const attempt of [...attempts].sort((a, b) => a.ts - b.ts)) {
    stats.set(attempt.key, applyAttempt(stats.get(attempt.key) ?? newStat(attempt.key), attempt));
  }
  return [...stats.values()];
}
