import { describe, expect, test } from 'vitest';
import { recognizeLetter } from '../../src/core/handwriting';
import { HANDWRITTEN } from '../fixtures/handwriting';

describe('M9-AC7 handwritten letters', () => {
  test('M9-AC7 recognizes at least 90% of the fixtures, and every letter at least 80%', () => {
    const right = HANDWRITTEN.filter(({ letter, strokes }) => recognizeLetter(strokes) === letter);
    expect(right.length / HANDWRITTEN.length).toBeGreaterThanOrEqual(0.9);
    for (const letter of new Set(HANDWRITTEN.map((f) => f.letter))) {
      const ofLetter = HANDWRITTEN.filter((f) => f.letter === letter);
      const rightOfLetter = right.filter((f) => f.letter === letter);
      expect(rightOfLetter.length / ofLetter.length, letter).toBeGreaterThanOrEqual(0.8);
    }
  });

  test('M10-AC1 reads a written G as G (at least 90%), including short bars, low bars and hooks', () => {
    const gs = HANDWRITTEN.filter((f) => f.letter === 'G');
    const read = gs.map(({ strokes }) => recognizeLetter(strokes));
    expect(read.filter((l) => l === 'G').length / gs.length).toBeGreaterThanOrEqual(0.9);
    expect(read.filter((l) => l === 'C').length / gs.length).toBeLessThanOrEqual(0.05);
  });

  test('M9-AC7 reads the same letter at any size and place on the pad', () => {
    const [{ letter, strokes }] = HANDWRITTEN as [(typeof HANDWRITTEN)[number]];
    const moved = strokes.map((s) => s.map((p) => ({ x: p.x * 3 + 200, y: p.y * 3 - 50 })));
    expect(recognizeLetter(moved)).toBe(letter);
  });

  test('M9-AC7 reads nothing from an empty pad, a tap or a slip of the finger', () => {
    expect(recognizeLetter([])).toBeUndefined();
    expect(
      recognizeLetter([
        [
          { x: 5, y: 5 },
          { x: 12, y: 9 },
        ],
      ]),
    ).toBeUndefined();
    expect(recognizeLetter([[{ x: 5, y: 5 }]])).toBeUndefined();
    expect(recognizeLetter([[{ x: 5, y: 5 }], [{ x: 5, y: 5 }]])).toBeUndefined();
  });
});
