import { describe, expect, test } from 'vitest';
import { midiOf, type ClefNote } from '../../src/core/pitch';
import { notePool } from '../../src/core/ranges';
import {
  answerContinues,
  firstTryPercent,
  gradeAnswer,
  settledAttempt,
  reduce,
  startSession,
  withPool,
  type Answer,
  type Session,
} from '../../src/core/session';

import { stepwisePicker } from '../../src/core/selector';

const first = stepwisePicker(() => 0);
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

describe('settledAttempt', () => {
  const meta = { ts: 5, input: 'piano', ms: 900 };
  const target = midiOf(C4.pitch);
  const hit = key(target);
  const miss = key(target + 1);
  const attempt = (before: Session, a: Answer) =>
    settledAttempt(before, reduceTo(before, a), { ...meta, answer: a });
  const reduceTo = (s: Session, a: Answer) => reduce(s, { type: 'answer', answer: a }, first);

  test('M4-4 a first-try hit is one try and correct', () => {
    expect(attempt(session(), hit)).toEqual({
      ...meta,
      key: 'treble:C4',
      answer: hit,
      tries: 1,
      correct: true,
    });
  });

  test('M4-4 a second-try hit is two tries and correct', () => {
    expect(attempt(session({ phase: 'retry', misses: [miss] }), hit)).toMatchObject({
      tries: 2,
      correct: true,
    });
  });

  test('M4-4 a second miss is two tries and not correct', () => {
    expect(attempt(session({ phase: 'retry', misses: [miss] }), miss)).toMatchObject({
      tries: 2,
      correct: false,
    });
  });

  test('M4-4 a first miss, or any answer after the question settled, records nothing', () => {
    expect(attempt(session(), miss)).toBeUndefined();
    expect(
      settledAttempt(session({ phase: 'right' }), session({ phase: 'right' }), { ...meta, answer: hit }),
    ).toBeUndefined();
  });
});

test('M4-AC5 a review session ends on the next event once its pool is empty', () => {
  const solved = withPool(press(session({ pool: [C4] }), midiOf(C4.pitch)), []);
  expect(next(solved).phase).toBe('done');
});

test('M4-AC5 a review session with one weak note keeps asking it', () => {
  const solved = press(session({ pool: [C4] }), midiOf(C4.pitch));
  const again = next(solved);
  expect(again.phase).toBe('ask');
  expect(again.note).toEqual(C4);
});

describe('answerContinues (design §8.4)', () => {
  test('M3-AC11 playing the revealed note stands in for Continue', () => {
    expect(answerContinues(session({ phase: 'reveal' }), key(60))).toBe(true);
  });

  test('M3-AC11 a miss, or any answer before the reveal, never continues', () => {
    expect(answerContinues(session({ phase: 'reveal' }), key(62))).toBe(false);
    expect(answerContinues(session({ phase: 'retry' }), key(60))).toBe(false);
    expect(answerContinues(session({ phase: 'right' }), key(60))).toBe(false);
  });
});

describe('timeUp (design §14)', () => {
  test('M6-AC2 ends an unanswered question without counting it as a miss', () => {
    const done = reduce(session({ total: 3, firstTry: 2 }), { type: 'timeUp' }, first);
    expect(done).toMatchObject({ phase: 'done', total: 3, firstTry: 2 });
  });

  test('M6-AC2 ends a question mid-retry with no attempt recorded', () => {
    const retry = press(session(), midiOf(C6.pitch));
    const done = reduce(retry, { type: 'timeUp' }, first);
    expect(done.phase).toBe('done');
    expect(done.total).toBe(0);
    expect(settledAttempt(retry, done, { ts: 0, input: 'x', ms: 0, answer: key(1) })).toBeUndefined();
  });

  test('M6-AC2 a finished session stays finished', () => {
    const done = reduce(session(), { type: 'timeUp' }, first);
    expect(next(done).phase).toBe('done');
    expect(press(done, midiOf(C4.pitch)).phase).toBe('done');
  });
});
