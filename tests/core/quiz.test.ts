import { describe, expect, test } from 'vitest';
import { midiOf, staffPos, type ClefNote } from '../../src/core/pitch';
import {
  answerKey,
  firstTryPercent,
  nextQuestion,
  pickNote,
  startQuiz,
  type QuizState,
} from '../../src/core/quiz';

const first = () => 0;
const last = () => 0.999999;
const C4: ClefNote = { pitch: { letter: 'C', octave: 4 }, clef: 'treble' };
const quiz = (over: Partial<QuizState> = {}): QuizState => ({
  note: C4,
  phase: 'ask',
  wrongKeys: [],
  streak: 0,
  firstTry: 0,
  total: 0,
  ...over,
});

describe('pickNote', () => {
  test('M1-AC1 stays within 3 ledger lines of the chosen clef', () => {
    expect(pickNote('treble', first)).toEqual({ pitch: { letter: 'E', octave: 3 }, clef: 'treble' });
    expect(pickNote('bass', last)).toEqual({ pitch: { letter: 'A', octave: 4 }, clef: 'bass' });
  });

  test('M1-AC1 a random value at the very top of the range still picks the last note', () => {
    expect(pickNote('treble', () => 1).pitch).toEqual({ letter: 'F', octave: 6 });
  });

  test('M1-AC1 the grand staff draws from both clefs', () => {
    expect(pickNote('both', first).clef).toBe('treble');
    expect(pickNote('both', last).clef).toBe('bass');
  });

  test('M1-AC1 never repeats the previous note', () => {
    const previous = pickNote('treble', first);
    expect(staffPos(pickNote('treble', first, previous))).not.toBe(staffPos(previous));
  });

  test('M1-AC1 ledger notes are weighted up', () => {
    // The lowest note (3 ledger lines) takes a bigger slice of [0, 1) than a note on the staff.
    const lowest = pickNote('treble', () => 0.05);
    expect(lowest.pitch).toEqual({ letter: 'E', octave: 3 });
  });
});

describe('answerKey: retry, then reveal, then wait (design §8.4)', () => {
  test('M1-AC1 a first-try hit scores and extends the streak', () => {
    const s = answerKey(quiz({ streak: 2 }), midiOf(C4.pitch));
    expect(s).toMatchObject({ phase: 'right', streak: 3, firstTry: 1, total: 1 });
  });

  test('M1-AC1 the first miss gives a second try without scoring', () => {
    const s = answerKey(quiz({ streak: 2 }), 62);
    expect(s).toMatchObject({ phase: 'retry', wrongKeys: [62], streak: 2, total: 0 });
  });

  test('M1-AC1 a second-try hit counts but resets the streak and is not first-try', () => {
    const s = answerKey(quiz({ phase: 'retry', streak: 2 }), 60);
    expect(s).toMatchObject({ phase: 'right', streak: 0, firstTry: 0, total: 1 });
  });

  test('M1-AC1 the second miss reveals the answer and resets the streak', () => {
    const s = answerKey(quiz({ phase: 'retry', wrongKeys: [62], streak: 2 }), 64);
    expect(s).toMatchObject({ phase: 'reveal', wrongKeys: [62, 64], streak: 0, total: 1 });
  });

  test('M1-AC1 a reveal ignores further keys until Continue', () => {
    const revealed = quiz({ phase: 'reveal' });
    expect(answerKey(revealed, 60)).toBe(revealed);
    expect(answerKey(quiz({ phase: 'right' }), 60).phase).toBe('right');
  });

  test('M1-AC1 the octave must match: C5 is not C4', () => {
    expect(answerKey(quiz(), 72).phase).toBe('retry');
  });
});

test('M1-AC1 nextQuestion asks a new note and keeps the score', () => {
  const s = nextQuestion(
    quiz({ phase: 'reveal', wrongKeys: [62, 64], streak: 0, total: 3, firstTry: 2 }),
    'treble',
    first,
  );
  expect(s).toMatchObject({ phase: 'ask', wrongKeys: [], total: 3, firstTry: 2 });
  expect(s.note).not.toEqual(C4);
});

test('M1-AC1 startQuiz begins with an empty score', () => {
  expect(startQuiz('bass', first)).toMatchObject({
    phase: 'ask',
    total: 0,
    streak: 0,
    note: { clef: 'bass' },
  });
});

test('M1-AC1 firstTryPercent rounds and is 0 before any answer', () => {
  expect(firstTryPercent(quiz())).toBe(0);
  expect(firstTryPercent(quiz({ firstTry: 2, total: 3 }))).toBe(67);
});
