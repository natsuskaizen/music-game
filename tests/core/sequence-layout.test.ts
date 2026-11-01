import { describe, expect, test } from 'vitest';
import { notePool } from '../../src/core/ranges';
import { stepwisePicker, type Random } from '../../src/core/selector';
import { makeSequence, type Measure } from '../../src/core/sequence';
import { layoutSequence } from '../../src/core/sequence-layout';
import { SPACE, stavesFor } from '../../src/core/staff-layout';

const SPAN = { from: 128, to: 616 };
// A quarter notehead is 1.18 spaces wide.
const HEAD_WIDTH = 1.18 * SPACE;

function seeded(seed: number): Random {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32;
}

const hardSequences = () => {
  const pool = notePool('both', 'hard');
  return Array.from({ length: 200 }, (_, seed) => {
    const random = seeded((seed + 1) * 2654435761);
    return makeSequence(pool, 'hard', { picker: stepwisePicker(random), random });
  });
};

type Letter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
const treble = (letter: Letter, octave: number) => ({ pitch: { letter, octave }, clef: 'treble' as const });
const bass = (letter: Letter, octave: number) => ({ pitch: { letter, octave }, clef: 'bass' as const });
const quarters = (...notes: ReturnType<typeof treble>[]): Measure =>
  notes.map((note) => ({ note, duration: 'quarter' }));

describe('layoutSequence', () => {
  test('M5-AC4 notes keep clear of each other and inside the span, whatever the Hard sequence', () => {
    const staves = stavesFor('both');
    for (const sequence of hardSequences()) {
      const { notes, barlines } = layoutSequence(sequence, staves, SPAN);
      expect(notes).toHaveLength(sequence.flat().length);
      expect(barlines).toHaveLength(sequence.length);
      expect(barlines.at(-1)).toBeCloseTo(SPAN.to);
      notes.forEach((note, i) => {
        const next = notes[i + 1];
        expect(note.x).toBeGreaterThan(SPAN.from);
        if (next) expect(next.x - note.x).toBeGreaterThanOrEqual(HEAD_WIDTH);
      });
    }
  });

  test('M5-AC4 barlines close each measure, after its last note and before the next measure’s first', () => {
    const sequence = hardSequences()[0] ?? [];
    const { notes, barlines } = layoutSequence(sequence, stavesFor('both'), SPAN);
    let index = 0;
    sequence.forEach((measure, m) => {
      const first = notes[index];
      const last = notes[index + measure.length - 1];
      index += measure.length;
      expect(last?.x).toBeLessThan(barlines[m] ?? 0);
      if (m > 0) expect(first?.x).toBeGreaterThan(barlines[m - 1] ?? Infinity);
    });
  });

  test('M5-AC4 an even four-quarter measure is spread over the whole span', () => {
    const measure: Measure = quarters(treble('C', 5), treble('D', 5), treble('E', 5), treble('F', 5));
    const { notes, barlines } = layoutSequence([measure], stavesFor('treble'), SPAN);
    expect(barlines).toEqual([SPAN.to]);
    expect(notes.map((n) => n.x - (notes[0]?.x ?? 0))).toEqual([0, 1, 2, 3].map((k) => k * 118.5));
  });

  test('M5-AC4 stems point up below the middle line and down from it', () => {
    const measure: Measure = quarters(treble('C', 5), treble('A', 4), treble('B', 4), treble('G', 4));
    const { notes } = layoutSequence([measure], stavesFor('treble'), SPAN);
    // C5 (above the middle line) and B4 (on it) hang down; A4 and G4 rise.
    expect(notes.map((n) => Math.sign(n.stem.y2 - n.stem.y1))).toEqual([1, -1, 1, -1]);
  });

  test('M5-AC4 a pair of eighths on one stave shares a beam joining the two stem tips', () => {
    const pair: Measure = [
      { note: treble('E', 4), duration: 'eighth' },
      { note: treble('G', 4), duration: 'eighth' },
      { note: treble('A', 4), duration: 'quarter' },
      { note: treble('B', 4), duration: 'quarter' },
      { note: treble('C', 5), duration: 'quarter' },
    ];
    const { notes, beams } = layoutSequence([pair], stavesFor('treble'), SPAN);
    expect(beams).toHaveLength(1);
    const [a, b] = notes;
    expect(beams[0]).toEqual({ x1: a?.stem.x2, y1: a?.stem.y2, x2: b?.stem.x2, y2: b?.stem.y2 });
    expect(notes.some((n) => n.flag)).toBe(false);
  });

  test('M5-AC4 a beam never slopes more than one space, even over an octave leap', () => {
    const leap: Measure = [
      { note: treble('C', 4), duration: 'eighth' },
      { note: treble('C', 5), duration: 'eighth' },
      { note: treble('D', 5), duration: 'quarter' },
      { note: treble('E', 5), duration: 'quarter' },
      { note: treble('F', 5), duration: 'quarter' },
    ];
    const [beam] = layoutSequence([leap], stavesFor('treble'), SPAN).beams;
    expect(Math.abs((beam?.y2 ?? 0) - (beam?.y1 ?? 0))).toBeLessThanOrEqual(SPACE);
  });

  test('M5-AC4 a pair of eighths split across the staves is flagged instead of beamed', () => {
    const split: Measure = [
      { note: treble('C', 5), duration: 'eighth' },
      { note: bass('E', 3), duration: 'eighth' },
      { note: treble('D', 5), duration: 'quarter' },
      { note: treble('E', 5), duration: 'quarter' },
      { note: treble('F', 5), duration: 'quarter' },
    ];
    const { notes, beams } = layoutSequence([split], stavesFor('both'), SPAN);
    expect(beams).toHaveLength(0);
    expect(notes.map((n) => Boolean(n.flag))).toEqual([true, true, false, false, false]);
    expect(notes[1]?.stave.clef).toBe('bass');
  });
});

describe('layoutSequence with accidentals', () => {
  const sharp = (letter: Letter, octave: number) => ({
    pitch: { letter, octave, accidental: 1 as const },
    clef: 'treble' as const,
  });
  const eighths = (...notes: ReturnType<typeof treble>[]): Measure =>
    notes.map((note) => ({ note, duration: 'eighth' }));

  test('M9-AC2 an accidental sits just left of its notehead and clear of the note before it', () => {
    const measure = eighths(treble('E', 5), sharp('F', 5), sharp('F', 5), treble('G', 5));
    const { notes } = layoutSequence([measure], stavesFor('treble'), SPAN);
    expect(notes.map((n) => n.accidental?.accidental)).toEqual([undefined, 1, undefined, undefined]);
    const [before, marked] = notes;
    const sign = marked?.accidental;
    if (!before || !marked || !sign) throw new Error('expected a sharp after a note');
    expect(sign.x).toBeLessThan(marked.x - HEAD_WIDTH / 2);
    // A sharp is one space wide; it starts right of the previous notehead's edge.
    expect(sign.x - SPACE).toBeGreaterThan(before.x + HEAD_WIDTH / 2);
  });

  test('M9-AC2 the key signature decides which notes show an accidental', () => {
    const measure = quarters(sharp('F', 5), treble('F', 5));
    const { notes } = layoutSequence([measure], stavesFor('treble'), { ...SPAN, key: 1 });
    expect(notes.map((n) => n.accidental?.accidental)).toEqual([undefined, 0]);
  });

  test('M9-AC2 a Hard sequence of all sharps after a seven-flat key runs past the span instead of crowding', () => {
    const span = { from: 240, to: 616, key: -7 };
    const sharpen = (sequence: Measure[]): Measure[] =>
      sequence.map((m) =>
        m.map(({ note, duration }) => ({
          note: { ...note, pitch: { ...note.pitch, accidental: 1 } },
          duration,
        })),
      );
    // Left edge of what a note draws: its accidental (one space wide) or its notehead.
    const leftOf = (n: { x: number; accidental?: { x: number } }) =>
      n.accidental ? n.accidental.x - SPACE : n.x - HEAD_WIDTH / 2;
    for (const sequence of hardSequences().slice(0, 50)) {
      const { notes, barlines } = layoutSequence(sharpen(sequence), stavesFor('both'), span);
      notes.slice(1).forEach((next, i) => {
        expect(leftOf(next)).toBeGreaterThanOrEqual((notes[i]?.x ?? 0) + HEAD_WIDTH / 2);
      });
      expect(barlines.at(-1)).toBeGreaterThanOrEqual(span.to - 0.001);
    }
  });
});
