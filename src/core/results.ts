// What a finished session shows (design §8.3): first-try accuracy, average answer time and the slowest notes.
import type { Attempt } from './stats';

/** How many slow notes the results list. */
const SLOWEST_SHOWN = 3;

/** A note and how long its slowest answer took. */
interface SlowNote {
  key: string;
  ms: number;
}

/** The numbers behind the results screen; zeros when nothing was answered. */
export interface Results {
  total: number;
  firstTry: number;
  /** Whole percentage of questions right on the first try. */
  accuracyPercent: number;
  /** Mean answer time in ms, 0 when nothing was answered. */
  averageMs: number;
  /** Slowest first, one entry per note. */
  slowest: SlowNote[];
}

/** Summarises the attempts of one session; a timed-out question has no attempt, so it never counts. */
export function summarize(attempts: readonly Attempt[]): Results {
  const total = attempts.length;
  const firstTry = attempts.filter((a) => a.correct && a.tries === 1).length;
  const totalMs = attempts.reduce((sum, a) => sum + a.ms, 0);
  const slowestByKey = new Map<string, number>();
  for (const { key, ms } of attempts) slowestByKey.set(key, Math.max(ms, slowestByKey.get(key) ?? 0));
  return {
    total,
    firstTry,
    accuracyPercent: total ? Math.round((100 * firstTry) / total) : 0,
    averageMs: total ? Math.round(totalMs / total) : 0,
    slowest: [...slowestByKey]
      .map(([key, ms]) => ({ key, ms }))
      .sort((a, b) => b.ms - a.ms)
      .slice(0, SLOWEST_SHOWN),
  };
}
