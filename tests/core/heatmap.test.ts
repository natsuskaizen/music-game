import { describe, expect, test } from 'vitest';
import { heatOf, heatRows, seenNotes } from '../../src/core/heatmap';
import { notePool } from '../../src/core/ranges';
import { applyAttempt, newStat, statKey, type Attempt, type NoteStat } from '../../src/core/stats';

const stat = (ewmaAcc: number, attempts = 3): NoteStat => ({ ...newStat('treble:C4'), ewmaAcc, attempts });
const hit = (key: string, correct: boolean): Attempt => ({
  ts: 1,
  key,
  input: 'piano',
  answer: null,
  tries: 1,
  correct,
  ms: 900,
});

describe('heatmap', () => {
  test('M6-AC4 heat follows stored accuracy: unseen, weak, fair, strong', () => {
    expect(heatOf(undefined)).toBe('unseen');
    expect(heatOf(newStat('treble:C4'))).toBe('unseen');
    expect(heatOf(stat(0.3))).toBe('weak');
    expect(heatOf(stat(0.6))).toBe('fair');
    expect(heatOf(stat(0.9))).toBe('strong');
  });

  test('M6-AC4 a first-try hit makes a note strong and a miss makes it weak', () => {
    const key = 'treble:C4';
    expect(heatOf(applyAttempt(newStat(key), hit(key, true)))).toBe('strong');
    expect(heatOf(applyAttempt(newStat(key), hit(key, false)))).toBe('weak');
  });

  test('M6-AC4 rows hold every pool note once, treble before bass, with one heat per note', () => {
    const pool = notePool('both', 'hard');
    const rows = heatRows(pool, new Map());
    expect(rows.flatMap((r) => r.measures.flat()).map((n) => statKey(n.note))).toEqual(pool.map(statKey));
    expect(rows.map((r) => r.clef)).toEqual([...rows.map((r) => r.clef)].sort().reverse());
    for (const row of rows) expect(row.heats).toHaveLength(row.measures.flat().length);
    expect(rows.every((r) => r.heats.every((h) => h === 'unseen'))).toBe(true);
  });

  test('M6-AC4 seen notes are listed weakest first and unseen ones are left out', () => {
    const pool = notePool('treble', 'easy');
    const stats = new Map([
      ['treble:D4', { ...stat(0.9), key: 'treble:D4' }],
      ['treble:C4', { ...stat(0.2), key: 'treble:C4' }],
      ['treble:E4', { ...stat(0.5, 0), key: 'treble:E4' }],
    ]);
    expect(seenNotes(pool, stats).map((s) => s.key)).toEqual(['treble:C4', 'treble:D4']);
  });
});
