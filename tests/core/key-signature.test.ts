import { describe, expect, test } from 'vitest';
import {
  KEY_SIGNATURES,
  keyAccidental,
  keySignatureMarks,
  keyLabel,
  keySignatureName,
  keySignatureWidth,
  measureAccidentals,
  sessionKey,
  spellNotes,
} from '../../src/core/key-signature';
import { noteAt, pitchLabel, type Accidental, type ClefNote, type Pitch } from '../../src/core/pitch';
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

describe('spellNotes', () => {
  const naturals = (...names: string[]) =>
    names.map((name) => treble(name[0] as Pitch['letter'], Number(name.slice(1))));
  const labels = (notes: ClefNote[]) => notes.map((note) => pitchLabel(note.pitch));

  test('M9-AC3 C major without accidentals returns the naturals unchanged, with no accidental field', () => {
    const pool = naturals('E4', 'F4', 'B4');
    expect(spellNotes(pool, { key: 0, accidentals: false })).toEqual(pool);
  });

  test('M9-AC4 a key signature spells each note as it sounds: F is F# in G major, B is Bb in F major', () => {
    const pool = naturals('E4', 'F4', 'B4');
    expect(labels(spellNotes(pool, { key: 1, accidentals: false }))).toEqual(['E4', 'F#4', 'B4']);
    expect(labels(spellNotes(pool, { key: -1, accidentals: false }))).toEqual(['E4', 'F4', 'Bb4']);
    expect(labels(spellNotes(pool, { key: 7, accidentals: false }))).toEqual(['E#4', 'F#4', 'B#4']);
  });

  test('M9-AC4 accidentals add flat, natural and sharp of each letter, without rare spellings outside the key', () => {
    const pool = naturals('E4', 'F4', 'G4');
    expect(labels(spellNotes(pool, { key: 0, accidentals: true }))).toEqual([
      'Eb4',
      'E4',
      'F4',
      'F#4',
      'Gb4',
      'G4',
      'G#4',
    ]);
    expect(labels(spellNotes(pool, { key: -7, accidentals: true }))).toContain('Fb4');
  });
});

describe('sessionKey', () => {
  test('M9-AC4 a fixed key is kept and random draws one of the 15 key signatures', () => {
    expect(sessionKey(-3, () => 0.99)).toBe(-3);
    expect(sessionKey('random', () => 0)).toBe(-7);
    expect(sessionKey('random', () => 0.999)).toBe(7);
    expect(KEY_SIGNATURES).toHaveLength(15);
  });

  test('M9-AC4 keyAccidental gives the sounding alteration of a letter in a key', () => {
    expect(keyAccidental(2, 'C')).toBe(1);
    expect(keyAccidental(2, 'G')).toBe(0);
    expect(keyAccidental(-2, 'E')).toBe(-1);
  });
});

test('M10-AC3 keyLabel names the major, its relative minor and the signature', () => {
  expect([0, 1, -3, 7, -7].map(keyLabel)).toEqual([
    'C major / A minor (no ♯ or ♭)',
    'G major / E minor (1♯)',
    'E♭ major / C minor (3♭)',
    'C♯ major / A♯ minor (7♯)',
    'C♭ major / A♭ minor (7♭)',
  ]);
});

test('M10-AC10 with accidentals on the note every sharp or flat is written, even a repeat in the measure', () => {
  const notes = [treble('F', 5, 1), treble('F', 5, 1), treble('B', 4, -1), treble('G', 4)];
  expect(measureAccidentals(notes, 0, true)).toEqual([1, 1, -1, undefined]);
  expect(measureAccidentals(notes, 0)).toEqual([1, undefined, -1, undefined]);
});
