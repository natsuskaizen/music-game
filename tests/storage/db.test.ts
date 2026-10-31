import 'fake-indexeddb/auto';
import { expect, test } from 'vitest';
import { loadAttempts, loadStats, recordAttempt, replaceAttempts } from '../../src/storage/db';
import type { Attempt } from '../../src/core/stats';

const attempt = (over: Partial<Attempt> = {}): Attempt => ({
  ts: 1000,
  key: 'treble:C4',
  input: 'piano',
  answer: { kind: 'pitch', midi: 60 },
  tries: 1,
  correct: true,
  ms: 1200,
  ...over,
});

test('M4-4 a recorded attempt shows up in the stats a later load returns', async () => {
  await recordAttempt(attempt());
  await recordAttempt(attempt({ ts: 2000, tries: 2, ms: 2000 }));
  const stat = (await loadStats()).get('treble:C4');
  expect(stat).toMatchObject({ attempts: 2, correct: 2, lastSeen: 2000, streak: 0 });
});

test('M4-4 notes are stored apart by clef', async () => {
  await recordAttempt(attempt({ key: 'bass:C4', correct: false, tries: 2 }));
  const stats = await loadStats();
  expect(stats.get('bass:C4')).toMatchObject({ attempts: 1, correct: 0, box: 0 });
  expect(stats.get('treble:C4')?.attempts).toBe(2);
});

test('M4-AC6 replacing attempts swaps the log and rebuilds the stats from it', async () => {
  const before = await loadAttempts();
  expect(before.length).toBeGreaterThan(0);
  await replaceAttempts([attempt({ key: 'treble:G4', ts: 5000 })]);
  expect((await loadAttempts()).map((a) => a.key)).toEqual(['treble:G4']);
  const stats = await loadStats();
  expect([...stats.keys()]).toEqual(['treble:G4']);
  await replaceAttempts(before);
  expect(await loadAttempts()).toHaveLength(before.length);
  expect(stats.size).toBe(1);
});
