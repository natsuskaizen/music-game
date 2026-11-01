import { describe, expect, test } from 'vitest';
import { sequenceNotes, startRun, stepRun, type SequenceRun } from '../../src/core/cursor';
import { midiOf, type ClefNote } from '../../src/core/pitch';
import { settledAttempt, type SessionEvent } from '../../src/core/session';

const note = (letter: 'C' | 'D' | 'E'): ClefNote => ({ pitch: { letter, octave: 4 }, clef: 'treble' });
const [C, D, E] = [note('C'), note('D'), note('E')];
const answer = (n: ClefNote): SessionEvent => ({
  type: 'answer',
  answer: { kind: 'pitch', midi: midiOf(n.pitch) },
});
const NEXT: SessionEvent = { type: 'next' };
const SKIP: SessionEvent = { type: 'skip' };
const run = (...events: SessionEvent[]) => events.reduce(stepRun, startRun([C, D, E]));

describe('sequence cursor (design §8.3, §8.4)', () => {
  test('M5-AC2 a miss and the retry keep the cursor on the same note', () => {
    expect(run(answer(D)).index).toBe(0);
    expect(run(answer(D), answer(E)).index).toBe(0);
  });

  test('M5-AC2 a right answer waits for next before the cursor moves', () => {
    const r = run(answer(C));
    expect(r.index).toBe(0);
    expect(stepRun(r, NEXT)).toMatchObject({ index: 1, session: { phase: 'ask' } });
  });

  test('M10-AC6 misses never reveal the note; skip does, and only next moves on', () => {
    const missed = run(answer(D), answer(D));
    expect(missed).toMatchObject({ index: 0, session: { phase: 'retry' } });
    const r = stepRun(missed, SKIP);
    expect(r).toMatchObject({ index: 0, session: { phase: 'reveal' } });
    expect(stepRun(r, NEXT).index).toBe(1);
  });

  test('M10-AC8 only the right note advances: repeated misses stay, the right note moves on, skip moves past', () => {
    expect(run(answer(D), answer(E), answer(D)).index).toBe(0);
    expect(run(answer(D), NEXT).index).toBe(0);
    const right = run(answer(D), answer(C));
    expect(right).toMatchObject({ index: 0, session: { phase: 'right' } });
    expect(stepRun(right, NEXT)).toMatchObject({ index: 1, session: { phase: 'ask' } });
    expect(stepRun(run(answer(C), NEXT), SKIP).session.phase).toBe('reveal');
    expect(run(answer(C), NEXT, SKIP, NEXT).index).toBe(2);
  });

  test('M5-AC2 walking the whole sequence ends in done on the last index', () => {
    const r = run(answer(C), NEXT, answer(D), NEXT, answer(E), NEXT);
    expect(r).toMatchObject({ index: 2, session: { phase: 'done', total: 3, firstTry: 3 } });
  });

  test('M5-AC2 a single note is a sequence of one', () => {
    const r = [answer(C), NEXT].reduce(stepRun, startRun([C]));
    expect(r).toMatchObject({ index: 0, session: { phase: 'done', total: 1 } });
  });

  test('M5-AC3 each note settles into its own attempt', () => {
    const meta = { ts: 0, input: 'piano', ms: 100, answer: { kind: 'pitch', midi: 0 } } as const;
    const attempts: ReturnType<typeof settledAttempt>[] = [];
    let r: SequenceRun = startRun([C, D]);
    for (const e of [answer(C), NEXT, answer(E), SKIP, NEXT]) {
      const after = stepRun(r, e);
      attempts.push(settledAttempt(r.session, after.session, meta));
      r = after;
    }
    const settled = attempts.filter((a) => a !== undefined);
    expect(settled.map((a) => [a.key, a.tries, a.correct])).toEqual([
      ['treble:C4', 1, true],
      ['treble:D4', 2, false],
    ]);
  });

  test('M5-AC1 sequenceNotes flattens measures in reading order', () => {
    const q = (n: ClefNote) => ({ note: n, duration: 'quarter' as const });
    expect(sequenceNotes([[q(C), q(D)], [q(E)]])).toEqual([C, D, E]);
  });
});

test('M5-AC2 an empty sequence is refused', () => {
  expect(() => startRun([])).toThrow();
});
