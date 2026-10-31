// Geometry shared by both renderers, in logical px.
import type { Clef } from './quiz';

export const S = 16;          // one staff space
export const MID_Y = 124;     // y of the middle staff line
export const LEFT = 36, RIGHT = 604, NOTE_X = 340;
export const GLYPH = { gClef: '', fClef: '', noteWhole: '' };
export const INK = '#1d2433', PAPER = '#fdfdfb', ACCENT = '#0e6e74', RIGHT_C = '#1f7a3a', WRONG_C = '#b8432a';

export const yOf = (pos: number) => MID_Y - pos * (S / 2);
/** Clef glyph baselines: G clef sits on the G4 line, F clef on the F3 line. */
export const clefY = (clef: Clef) => (clef === 'treble' ? yOf(-2) : yOf(2));
export const clefGlyph = (clef: Clef) => (clef === 'treble' ? GLYPH.gClef : GLYPH.fClef);
