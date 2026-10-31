import { describe, expect, test } from 'vitest';
import { SPACE, clefLinePos, heardMark, stavesFor, systemBounds, yOf } from '../../src/core/staff-layout';

describe('stavesFor', () => {
  test('M1-AC1 a single clef draws one stave', () => {
    expect(stavesFor('bass').map((stave) => stave.clef)).toEqual(['bass']);
  });

  test('M1-AC1 the grand staff draws treble above bass', () => {
    const [treble, bass] = stavesFor('both');
    expect(treble?.clef).toBe('treble');
    expect(bass?.clef).toBe('bass');
    expect(bass && treble && bass.midY > treble.midY).toBe(true);
  });

  test('M1-AC1 on the grand staff, 3 ledger notes on one stave stay clear of the other stave', () => {
    const [treble, bass] = stavesFor('both');
    if (!treble || !bass) throw new Error('expected two staves');
    const lowestTrebleHead = yOf(treble, -11) + SPACE / 2; // E3
    const highestBassHead = yOf(bass, 11) - SPACE / 2; // A4
    expect(lowestTrebleHead).toBeLessThan(yOf(bass, 4));
    expect(highestBassHead).toBeGreaterThan(yOf(treble, -4));
  });
});

describe('systemBounds', () => {
  test('M1-AC1 spans from the top line of the first stave to the bottom line of the last, with ledger room', () => {
    const staves = stavesFor('both');
    const [treble, bass] = staves;
    if (!treble || !bass) throw new Error('expected two staves');
    const { top, bottom, height } = systemBounds(staves);
    expect(top).toBe(yOf(treble, 4));
    expect(bottom).toBe(yOf(bass, -4));
    expect(yOf(bass, -11) + SPACE / 2).toBeLessThan(height);
    expect(yOf(treble, 11) - SPACE / 2).toBeGreaterThan(0);
  });
});

test('M1-AC1 yOf moves half a space per staff position, upward for positive positions', () => {
  const stave = { clef: 'treble' as const, midY: 100 };
  expect(yOf(stave, 0)).toBe(100);
  expect(yOf(stave, 2)).toBe(100 - SPACE);
});

test('M1-AC1 clefs sit on their line: G clef on G4 (-2 treble), F clef on F3 (+2 bass)', () => {
  expect(clefLinePos('treble')).toBe(-2);
  expect(clefLinePos('bass')).toBe(2);
});

describe('heardMark', () => {
  test('M3-AC12 a heard note lands on the shown clef, or on a grand staff by middle C', () => {
    expect(heardMark(64, 'bass')?.note).toEqual({ pitch: { letter: 'E', octave: 4 }, clef: 'bass' });
    expect(heardMark(60, 'both')?.note.clef).toBe('treble');
    expect(heardMark(59, 'both')?.note.clef).toBe('bass');
    expect(heardMark(66, 'treble')?.sharp).toBe(true);
  });

  test('M3-AC12 a note too far off the staff is not drawn', () => {
    expect(heardMark(108, 'treble')).toBeUndefined();
    expect(heardMark(21, 'treble')).toBeUndefined();
    expect(heardMark(40, 'bass')).toBeDefined();
  });
});
