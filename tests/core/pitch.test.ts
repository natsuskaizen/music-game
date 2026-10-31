import { describe, expect, test } from 'vitest';
import { ledgerPositions, pitchLabel, staffPos, type Clef, type Pitch } from '../../src/core/pitch';

const note = (letter: Pitch['letter'], octave: number, clef: Clef) => ({ pitch: { letter, octave }, clef });

describe('staffPos', () => {
  test('M1-AC1 the middle line is 0 on both clefs', () => {
    expect(staffPos(note('B', 4, 'treble'))).toBe(0);
    expect(staffPos(note('D', 3, 'bass'))).toBe(0);
  });

  test('M1-AC1 the outer staff lines are ±4 (treble E4–F5, bass G2–A3)', () => {
    expect(staffPos(note('E', 4, 'treble'))).toBe(-4);
    expect(staffPos(note('F', 5, 'treble'))).toBe(4);
    expect(staffPos(note('G', 2, 'bass'))).toBe(-4);
    expect(staffPos(note('A', 3, 'bass'))).toBe(4);
  });

  test('M1-AC1 middle C sits one ledger line below treble and above bass', () => {
    expect(staffPos(note('C', 4, 'treble'))).toBe(-6);
    expect(staffPos(note('C', 4, 'bass'))).toBe(6);
  });
});

describe('ledgerPositions', () => {
  test('M1-AC1 notes on the staff need no ledger lines', () => {
    for (let pos = -5; pos <= 5; pos++) expect(ledgerPositions(pos)).toEqual([]);
  });

  test('M1-AC1 the hard-range extremes need 3 ledger lines (treble F6, bass G1)', () => {
    expect(ledgerPositions(staffPos(note('F', 6, 'treble')))).toEqual([6, 8, 10]);
    expect(ledgerPositions(staffPos(note('G', 1, 'bass')))).toEqual([-6, -8, -10]);
  });

  test('M1-AC1 a note on a ledger line gets that line; one in the space beyond does not get an extra one', () => {
    expect(ledgerPositions(-6)).toEqual([-6]);
    expect(ledgerPositions(-7)).toEqual([-6]);
  });
});

test('M1-AC1 pitchLabel names the letter and octave', () => {
  expect(pitchLabel({ letter: 'C', octave: 6 })).toBe('C6');
});
