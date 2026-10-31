import { describe, expect, test } from 'vitest';
import { celebrates, isCelebrated } from '../../src/core/streak';
import { reduce, startSession } from '../../src/core/session';
import { stepwisePicker } from '../../src/core/selector';
import { notePool } from '../../src/core/ranges';
import { midiOf } from '../../src/core/pitch';

describe('streak celebration', () => {
  test('M7-AC8 celebrates 5, 10, 20, then every 10', () => {
    const hits = Array.from({ length: 61 }, (_, n) => n).filter(isCelebrated);
    expect(hits).toEqual([5, 10, 20, 30, 40, 50, 60]);
  });

  test('M7-AC8 never celebrates a miss or an unchanged streak', () => {
    expect(celebrates(9, 0)).toBe(false);
    expect(celebrates(5, 5)).toBe(false);
    expect(celebrates(4, 5)).toBe(true);
  });

  test('M7-AC8 a real session fires only on the fifth first-try hit, not on a retry', () => {
    const pick = stepwisePicker(() => 0);
    let s = startSession(notePool('treble', 'easy'), 20, pick);
    const fired: number[] = [];
    const play = (midi: number) => {
      const before = s;
      s = reduce(s, { type: 'answer', answer: { kind: 'pitch', midi } }, pick);
      if (celebrates(before.streak, s.streak)) fired.push(s.streak);
    };
    for (let i = 0; i < 5; i++) {
      play(midiOf(s.note.pitch));
      s = reduce(s, { type: 'next' }, pick);
    }
    expect(fired).toEqual([5]);
    play(midiOf(s.note.pitch) + 1); // miss, then retry hit
    play(midiOf(s.note.pitch));
    expect(fired).toEqual([5]);
  });
});
