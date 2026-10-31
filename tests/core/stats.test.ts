import { expect, test } from 'vitest';
import { notePool } from '../../src/core/ranges';
import {
  applyAttempt,
  credit,
  isWeak,
  newStat,
  statKey,
  weakNotes,
  type Attempt,
  type NoteStat,
} from '../../src/core/stats';

const attempt = (tries: 1 | 2, correct: boolean, over: Partial<Attempt> = {}): Attempt => ({
  ts: 5,
  key: 'treble:C6',
  input: 'piano',
  answer: null,
  tries,
  correct,
  ms: 1000,
  ...over,
});
const fresh = () => newStat('treble:C6');

test('M4-AC1 credit is 1 first try, 0.5 second try, 0 for a miss', () => {
  expect(credit(attempt(1, true))).toBe(1);
  expect(credit(attempt(2, true))).toBe(0.5);
  expect(credit(attempt(2, false))).toBe(0);
});

test('M4-AC1 statKey separates the same pitch on two clefs', () => {
  const pitch = { letter: 'C', octave: 4 } as const;
  expect(statKey({ pitch, clef: 'treble' })).toBe('treble:C4');
  expect(statKey({ pitch, clef: 'bass' })).toBe('bass:C4');
});

test('M4-AC1 the first attempt replaces the starting guess', () => {
  const s = applyAttempt(fresh(), attempt(1, true, { ms: 1800, ts: 42 }));
  expect(s).toMatchObject({
    attempts: 1,
    correct: 1,
    ewmaAcc: 1,
    ewmaMs: 1800,
    streak: 1,
    box: 1,
    lastSeen: 42,
  });
});

test('M4-AC1 later attempts move the averages by 0.3', () => {
  const s = applyAttempt(applyAttempt(fresh(), attempt(1, true)), attempt(2, true, { ms: 2000 }));
  expect(s.ewmaAcc).toBeCloseTo(0.3 * 0.5 + 0.7 * 1);
  expect(s.ewmaMs).toBeCloseTo(0.3 * 2000 + 0.7 * 1000);
});

test('M4-AC1 a second-try hit counts as correct but keeps the box and resets the streak', () => {
  const up = applyAttempt(applyAttempt(fresh(), attempt(1, true)), attempt(1, true));
  const s = applyAttempt(up, attempt(2, true));
  expect(s).toMatchObject({ correct: 3, box: 2, streak: 0 });
});

test('M4-AC1 a miss drops the box and streak to 0', () => {
  const up = applyAttempt(applyAttempt(fresh(), attempt(1, true)), attempt(1, true));
  const s = applyAttempt(up, attempt(2, false));
  expect(s).toMatchObject({ attempts: 3, correct: 2, box: 0, streak: 0 });
});

test('M4-AC1 the box tops out at 4', () => {
  const s = Array.from({ length: 6 }).reduce<ReturnType<typeof fresh>>(
    (acc) => applyAttempt(acc, attempt(1, true)),
    fresh(),
  );
  expect(s.box).toBe(4);
});

test('M4-AC5 weak means seen and (box <= 1 or accuracy < 0.7); unseen notes are not weak', () => {
  const stat = (over: Partial<NoteStat>): NoteStat => ({
    ...fresh(),
    attempts: 3,
    box: 2,
    ewmaAcc: 0.9,
    ...over,
  });
  expect(isWeak(undefined)).toBe(false);
  expect(isWeak(fresh())).toBe(false);
  expect(isWeak(stat({}))).toBe(false);
  expect(isWeak(stat({ box: 1 }))).toBe(true);
  expect(isWeak(stat({ ewmaAcc: 0.6 }))).toBe(true);
});

test('M4-AC5 weakNotes keeps only the weak notes of the pool', () => {
  const pool = notePool('treble', 'easy');
  const [weak, strong] = [pool[0], pool[1]] as [(typeof pool)[0], (typeof pool)[0]];
  const stats = new Map<string, NoteStat>([
    [statKey(weak), { ...fresh(), key: statKey(weak), attempts: 2, box: 0, ewmaAcc: 0.2 }],
    [statKey(strong), { ...fresh(), key: statKey(strong), attempts: 9, box: 4, ewmaAcc: 0.95 }],
  ]);
  expect(weakNotes(pool, stats)).toEqual([weak]);
  expect(weakNotes(pool, new Map())).toEqual([]);
});
