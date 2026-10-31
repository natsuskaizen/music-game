import { describe, expect, test } from 'vitest';
import { midiOf, type ClefNote } from '../../src/core/pitch';
import { notePool } from '../../src/core/ranges';
import {
  firstTryPercent,
  gradeAnswer,
  reduce,
  startSession,
  toneAfter,
  type Answer,
  type Session,
} from '../../src/core/session';

const first = () => 0;
const C4: ClefNote = { pitch: { letter: 'C', octave: 4 }, clef: 'treble' };
const C6: ClefNote = { pitch: { letter: 'C', octave: 6 }, clef: 'treble' };
const pool = notePool('treble', 'medium');
const key = (midi: number): Answer => ({ kind: 'pitch', midi });
const press = (s: Session, midi: number) => reduce(s, { type: 'answer', answer: key(midi) }, first);
const next = (s: Session) => reduce(s, { type: 'next' }, first);
const session = (over: Partial<Session> = {}): Session => ({
  pool,
  questionsPerSession: undefined,
  phase: 'ask',
  note: C4,
  misses: [],
  streak: 0,
  firstTry: 0,
  total: 0,
  ...over,
});

describe('gradeAnswer: exact pitch (design §14)', () => {
  test('M2-AC9 the right key in the right octave is correct', () => {
    expect(gradeAnswer(C6, key(midiOf(C6.pitch)))).toBe(true);
  });

  test('M2-AC9 C5 is wrong for C6, and so is C7', () => {
    expect(gradeAnswer(C6, key(72))).toBe(false);
    expect(gradeAnswer(C6, key(96))).toBe(false);
  });
});

describe('reduce: retry, then reveal, then wait (design §8.4)', () => {
  test('M2-AC3 a first-try hit scores and extends the streak', () => {
    expect(press(session({ streak: 2 }), 60)).toMatchObject({
      phase: 'right',
      streak: 3,
      firstTry: 1,
      total: 1,
    });
  });

  test('M2-AC3 the first miss gives a second try on the same note without scoring', () => {
    const s = press(session({ streak: 2 }), 62);
    expect(s).toMatchObject({ phase: 'retry', note: C4, misses: [key(62)], streak: 2, total: 0 });
  });

  test('M2-AC3 next does nothing during a retry, so the question never advances on a miss', () => {
    const retry = press(session(), 62);
    expect(next(retry)).toBe(retry);
  });

  test('M2-AC3 a second-try hit counts but resets the streak and is not first-try', () => {
    expect(press(session({ phase: 'retry', streak: 2 }), 60)).toMatchObject({
      phase: 'right',
      streak: 0,
      firstTry: 0,
      total: 1,
    });
  });

  test('M2-AC3 the second miss reveals the answer and resets the streak', () => {
    const s = press(session({ phase: 'retry', misses: [key(62)], streak: 2 }), 64);
    expect(s).toMatchObject({ phase: 'reveal', misses: [key(62), key(64)], streak: 0, total: 1 });
  });

  test('M2-AC3 a reveal ignores further answers until next', () => {
    const revealed = session({ phase: 'reveal' });
    expect(press(revealed, 60)).toBe(revealed);
    expect(press(session({ phase: 'right' }), 62).phase).toBe('right');
  });

  test('M2-AC9 the octave must match: C5 is not C4', () => {
    expect(press(session(), 72).phase).toBe('retry');
  });
});

describe('reduce: next question and session end (design §8.3)', () => {
  test('M2-AC3 next asks a new note and keeps the score', () => {
    const s = next(session({ phase: 'reveal', misses: [key(62), key(64)], total: 3, firstTry: 2 }));
    expect(s).toMatchObject({ phase: 'ask', misses: [], total: 3, firstTry: 2 });
    expect(s.note).not.toEqual(C4);
  });

  test('M2-AC3 the session is done after its length, and an endless one never is', () => {
    expect(next(session({ phase: 'right', questionsPerSession: 3, total: 3 })).phase).toBe('done');
    expect(next(session({ phase: 'right', questionsPerSession: 3, total: 2 })).phase).toBe('ask');
    expect(next(session({ phase: 'right', total: 500 })).phase).toBe('ask');
  });

  test('M2-AC3 a done session ignores every event', () => {
    const done = session({ phase: 'done' });
    expect(press(done, 60)).toBe(done);
    expect(next(done)).toBe(done);
  });
});

test('M2-AC3 startSession begins with an empty score on a note from the pool', () => {
  expect(startSession(notePool('bass', 'medium'), 20, first)).toMatchObject({
    phase: 'ask',
    questionsPerSession: 20,
    total: 0,
    streak: 0,
    misses: [],
    note: { clef: 'bass' },
  });
});

test('M1-AC1 firstTryPercent rounds and is 0 before any answer', () => {
  expect(firstTryPercent(session())).toBe(0);
  expect(firstTryPercent(session({ firstTry: 2, total: 3 }))).toBe(67);
});

describe('toneAfter', () => {
  test('M1-AC5 sounds the correct note when an answer settles the question', () => {
    const ask = session();
    expect(toneAfter(ask, press(ask, 60))).toBe(60);
    const retry = press(ask, 62);
    expect(toneAfter(retry, press(retry, 64))).toBe(60);
  });

  test('M1-AC5 stays quiet on a first miss and on taps after a reveal', () => {
    const ask = session();
    const retry = press(ask, 62);
    expect(toneAfter(ask, retry)).toBeUndefined();
    const reveal = press(retry, 64);
    expect(toneAfter(reveal, press(reveal, 60))).toBeUndefined();
  });
});
