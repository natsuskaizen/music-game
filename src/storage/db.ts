// On-device storage (design §10): per-note stats plus the append-only attempt log they can be rebuilt from.
import Dexie, { type Table } from 'dexie';
import { applyAttempt, newStat, type Attempt, type NoteStat } from '../core/stats';

class QuizDB extends Dexie {
  stats!: Table<NoteStat, string>;
  attempts!: Table<Attempt, number>;

  constructor() {
    super('sight-reading');
    this.version(1).stores({ stats: 'key, box, lastSeen', attempts: '++id, ts, key' });
  }
}

const db = new QuizDB();

/** Appends the attempt and folds it into its note's stat, in one transaction so the two never disagree. */
export async function recordAttempt(attempt: Attempt): Promise<void> {
  await db.transaction('rw', db.stats, db.attempts, async () => {
    const before = (await db.stats.get(attempt.key)) ?? newStat(attempt.key);
    await db.stats.put(applyAttempt(before, attempt));
    await db.attempts.add(attempt);
  });
}

/** Every stored note stat by key, for the weighted pick. */
export async function loadStats(): Promise<Map<string, NoteStat>> {
  return new Map((await db.stats.toArray()).map((stat) => [stat.key, stat]));
}

/** Asks the browser not to evict the database under storage pressure (iOS may clear idle sites' data otherwise). */
export async function requestPersistence(): Promise<void> {
  await navigator.storage.persist();
}
