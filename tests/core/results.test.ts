import { describe, expect, test } from 'vitest';
import { summarize } from '../../src/core/results';
import type { Attempt } from '../../src/core/stats';

const attempt = (
  key: string,
  ms: number,
  miss: Partial<Pick<Attempt, 'tries' | 'correct'>> = {},
): Attempt => ({
  ts: 0,
  key,
  input: 'piano',
  answer: null,
  tries: 1,
  correct: true,
  ms,
  ...miss,
});

describe('results', () => {
  test('M6-AC5 first-try accuracy counts only right-first-time answers', () => {
    const r = summarize([
      attempt('treble:C4', 1000),
      attempt('treble:D4', 1000, { tries: 2 }),
      attempt('treble:E4', 1000, { tries: 2, correct: false }),
    ]);
    expect(r).toMatchObject({ total: 3, firstTry: 1, accuracyPercent: 33 });
  });

  test('M6-AC5 average time is the mean of all answers', () => {
    expect(summarize([attempt('treble:C4', 1000), attempt('treble:D4', 2500)]).averageMs).toBe(1750);
  });

  test('M6-AC5 lists the three slowest notes, slowest first, one entry per note', () => {
    const r = summarize([
      attempt('treble:C4', 900),
      attempt('treble:D4', 4000),
      attempt('bass:E2', 3000),
      attempt('treble:D4', 1000),
      attempt('treble:G4', 2000),
    ]);
    expect(r.slowest).toEqual([
      { key: 'treble:D4', ms: 4000 },
      { key: 'bass:E2', ms: 3000 },
      { key: 'treble:G4', ms: 2000 },
    ]);
  });

  test('M6-AC5 an empty session is all zeros', () => {
    expect(summarize([])).toEqual({ total: 0, firstTry: 0, accuracyPercent: 0, averageMs: 0, slowest: [] });
  });
});
