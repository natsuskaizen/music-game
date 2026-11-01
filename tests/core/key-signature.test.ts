import { describe, expect, test } from 'vitest';
import {
  keySignatureMarks,
  keySignatureName,
  keySignatureWidth,
  measureAccidentals,
} from '../../src/core/key-signature';
import { noteAt, type Accidental, type ClefNote, type Pitch } from '../../src/core/pitch';
import { SPACE } from '../../src/core/staff-layout';

const treble = (letter: Pitch['letter'], octave: number, accidental?: Accidental): ClefNote => ({
  pitch: { letter, octave, ...(accidental !== undefined && { accidental }) },
  clef: 'treble',
});
const names = (marks: { pos: number }[], clef: 'treble' | 'bass') =>
  marks.map(({ pos }) => {
    const { letter, octave } = noteAt(clef, pos).pitch;
    return `${letter}${String(octave)}`;
  });

describe('keySignatureMarks', () => {
  test('M9-AC2 sharps sit at F5 C5 G5 D5 A4 E5 B4 on the treble and a third lower on the bass', () => {
    expect(names(keySignatureMarks('treble', 7), 'treble')).toEqual([
      'F5',
      'C5',
      'G5',
      'D5',
      'A4',
      'E5',
      'B4',
    ]);
    expect(names(keySignatureMarks('bass', 7), 'bass')).toEqual(['F3', 'C3', 'G3', 'D3', 'A2', 'E3', 'B2']);
    expect(keySignatureMarks('treble', 3).map((m) => m.accidental)).toEqual([1, 1, 1]);
  });

  test('M9-AC2 flats sit at B4 E5 A4 D5 G4 C5 F4 on the treble and a third lower on the bass', () => {
    expect(names(keySignatureMarks('treble', -7), 'treble')).toEqual([
      'B4',
      'E5',
      'A4',
      'D5',
      'G4',
      'C5',
      'F4',
    ]);
    expect(names(keySignatureMarks('bass', -7), 'bass')).toEqual(['B2', 'E3', 'A2', 'D3', 'G2', 'C3', 'F2']);
    expect(keySignatureMarks('bass', -2).map((m) => m.accidental)).toEqual([-1, -1]);
  });

  test('M9-AC2 marks run left to right, and C major has none and takes no room', () => {
    const dxs = keySignatureMarks('treble', 4).map((m) => m.dx);
    expect(dxs).toEqual([...dxs].sort((a, b) => a - b));
    expect(new Set(dxs).size).toBe(4);
    expect(keySignatureWidth(4)).toBeGreaterThanOrEqual(4 * SPACE);
    expect(keySignatureMarks('treble', 0)).toEqual([]);
    expect(keySignatureWidth(0)).toBe(0);
  });
});

test('M9-AC2 a key signature is named for the staff label', () => {
  expect([3, 1, -1, -4, 0].map(keySignatureName)).toEqual(['3 sharps', '1 sharp', '1 flat', '4 flats', '']);
});

describe('measureAccidentals', () => {
  test('M9-AC2 a note shows an accidental only where it differs from the key', () => {
    expect(measureAccidentals([treble('F', 5, 1), treble('C', 5, -1), treble('G', 4)], 0)).toEqual([
      1,
      -1,
      undefined,
    ]);
    // In G major F♯ is in the key, and F needs a natural.
    expect(measureAccidentals([treble('F', 5, 1), treble('E', 5)], 1)).toEqual([undefined, undefined]);
    expect(measureAccidentals([treble('F', 5)], 1)).toEqual([0]);
  });

  test('M9-AC2 an accidental holds on its line or space to the end of the measure, and a natural cancels it', () => {
    const run = [treble('F', 5, 1), treble('F', 5, 1), treble('F', 4), treble('F', 5), treble('F', 5, 1)];
    expect(measureAccidentals(run, 0)).toEqual([1, undefined, undefined, 0, 1]);
  });

  test('M9-AC2 the same line on the other stave is not affected', () => {
    const grand: ClefNote[] = [treble('B', 4, -1), { pitch: { letter: 'D', octave: 3 }, clef: 'bass' }];
    expect(measureAccidentals(grand, 0)).toEqual([-1, undefined]);
  });
});
