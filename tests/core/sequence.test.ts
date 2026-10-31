import { describe, expect, test } from 'vitest';
import type { ClefNote } from '../../src/core/pitch';
import { notePool, type Difficulty } from '../../src/core/ranges';
import { makeSequence, type Measure } from '../../src/core/sequence';
import { stepwisePicker, type Random } from '../../src/core/selector';

function seeded(seed: number): Random {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32;
}

const beats = (measure: Measure) =>
  measure.reduce((sum, { duration }) => sum + (duration === 'quarter' ? 1 : 0.5), 0);

const id = (n: ClefNote) => n.clef + n.pitch.letter + String(n.pitch.octave);

const sequences = (difficulty: Difficulty, clef: 'treble' | 'bass' | 'both' = 'both') => {
  const pool = notePool(clef, difficulty);
  return Array.from({ length: 200 }, (_, seed) => {
    const random = seeded((seed + 1) * 2654435761);
    return makeSequence(pool, difficulty, { picker: stepwisePicker(random), random });
  });
};

describe('M5-AC1 sequence size follows the difficulty table', () => {
  test('M5-AC1 Easy is 1 measure of 4 quarter notes', () => {
    for (const seq of sequences('easy')) {
      expect(seq).toHaveLength(1);
      expect(seq.flat().map((n) => n.duration)).toEqual(['quarter', 'quarter', 'quarter', 'quarter']);
    }
  });

  test('M5-AC1 Medium is 1–2 measures and at most 10 notes, and both measure counts occur', () => {
    const all = sequences('medium');
    for (const seq of all) {
      expect([1, 2]).toContain(seq.length);
      expect(seq.flat().length).toBeLessThanOrEqual(10);
    }
    expect(new Set(all.map((seq) => seq.length))).toEqual(new Set([1, 2]));
  });

  test('M5-AC1 Hard is 3 measures and 10–16 notes', () => {
    for (const seq of sequences('hard')) {
      expect(seq).toHaveLength(3);
      expect(seq.flat().length).toBeGreaterThanOrEqual(10);
      expect(seq.flat().length).toBeLessThanOrEqual(16);
    }
  });

  test('M5-AC1 every measure fills exactly 4 beats, eighths come in pairs', () => {
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      for (const seq of sequences(difficulty)) {
        for (const measure of seq) {
          expect(beats(measure)).toBe(4);
          expect(measure.filter((n) => n.duration === 'eighth').length % 2).toBe(0);
        }
      }
    }
  });

  test('M5-AC1 notes stay in the clef setting and the difficulty range', () => {
    for (const clef of ['treble', 'bass'] as const) {
      const allowed = notePool(clef, 'hard').map(id);
      for (const seq of sequences('hard', clef)) {
        for (const { note } of seq.flat()) expect(allowed).toContain(id(note));
      }
    }
  });

  test('M5-AC1 the picker chains: each note is chosen given the one before', () => {
    const pool = notePool('treble', 'easy');
    const seen: (ClefNote | undefined)[] = [];
    const picker = (_pool: ClefNote[], previous?: ClefNote): ClefNote => {
      seen.push(previous);
      return { clef: 'treble', pitch: { letter: 'C', octave: seen.length } };
    };
    const notes = makeSequence(pool, 'easy', { picker, random: seeded(1) }).flat();
    expect(seen[0]).toBeUndefined();
    expect(seen.slice(1)).toEqual(notes.slice(0, -1).map((n) => n.note));
  });
});
