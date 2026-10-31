import { describe, expect, test } from 'vitest';
import { ledgerPositions, noteAt, pitchLabel, staffPos, type Clef } from '../../src/core/pitch';
import { notePool, type Difficulty } from '../../src/core/ranges';

const labels = (clef: Clef | 'both', difficulty: Difficulty) =>
  notePool(clef, difficulty).map((note) => pitchLabel(note.pitch));

// Each clef's full (Hard) range written out by hand, low to high, so the tests don't reuse the code's arithmetic.
const FULL_RANGE: Record<Clef, string> = {
  treble: 'E3 F3 G3 A3 B3 C4 D4 E4 F4 G4 A4 B4 C5 D5 E5 F5 G5 A5 B5 C6 D6 E6 F6',
  bass: 'G1 A1 B1 C2 D2 E2 F2 G2 A2 B2 C3 D3 E3 F3 G3 A3 B3 C4 D4 E4 F4 G4 A4',
};
// Ledger lines for staff positions -11..11: three at the extremes, none from -5 to 5.
const LEDGER_COUNTS = [3, 3, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 3];

describe.each(['treble', 'bass'] as const)('%s full range', (clef) => {
  const names = FULL_RANGE[clef].split(' ');

  test('M2-AC1 staffPos runs -11..11 across the range, one step per note', () => {
    expect(labels(clef, 'hard')).toEqual(names);
    notePool(clef, 'hard').forEach((note, i) => {
      expect(staffPos(note)).toBe(i - 11);
    });
  });

  test('M2-AC1 every note gets the right number of ledger lines', () => {
    const counts = notePool(clef, 'hard').map((note) => ledgerPositions(staffPos(note)).length);
    expect(counts).toEqual(LEDGER_COUNTS);
  });

  test('M2-AC1 noteAt inverts staffPos for every note', () => {
    for (const note of notePool(clef, 'hard')) expect(noteAt(clef, staffPos(note))).toEqual(note);
  });
});

describe('notePool follows the difficulty table (design §14)', () => {
  const span = (clef: Clef, difficulty: Difficulty) => {
    const names = labels(clef, difficulty);
    return [names[0], names.at(-1), names.length];
  };

  test('M2-AC2 easy: treble C4–C5, bass C3–C4', () => {
    expect(span('treble', 'easy')).toEqual(['C4', 'C5', 8]);
    expect(span('bass', 'easy')).toEqual(['C3', 'C4', 8]);
  });

  test('M2-AC2 medium: up to 1 ledger line, treble B3–B5, bass D2–D4', () => {
    expect(span('treble', 'medium')).toEqual(['B3', 'B5', 15]);
    expect(span('bass', 'medium')).toEqual(['D2', 'D4', 15]);
  });

  test('M2-AC2 hard: up to 3 ledger lines, treble E3–F6, bass G1–A4', () => {
    expect(span('treble', 'hard')).toEqual(['E3', 'F6', 23]);
    expect(span('bass', 'hard')).toEqual(['G1', 'A4', 23]);
  });

  test('M2-AC2 both uses each stave’s own column', () => {
    const both = notePool('both', 'easy');
    expect(both).toEqual([...notePool('treble', 'easy'), ...notePool('bass', 'easy')]);
  });
});
