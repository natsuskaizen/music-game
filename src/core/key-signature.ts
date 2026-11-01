// Key signatures and the accidentals a note shows (M9-2, design §3.1). Pure, so the Staff component only draws.
import { staffPos, type Accidental, type ClefNote, type Pitch } from './pitch';
import { SPACE } from './staff-layout';

/** A key signature as a count: that many sharps when positive, flats when negative; 0 is C major. */
export type KeySignature = number;

/** One accidental of a key signature: its x offset from where the signature starts, and its staff position. */
interface KeyMark {
  dx: number;
  pos: number;
  accidental: Accidental;
}

const SHARP_ORDER: Pitch['letter'][] = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLAT_ORDER = [...SHARP_ORDER].reverse();
// Treble staff positions of the sharps and flats in order (F5 C5 G5 D5 A4 E5 B4; B4 E5 A4 D5 G4 C5 F4).
const SHARP_POS = [4, 1, 5, 2, -1, 3, 0];
const FLAT_POS = [0, 3, -1, 2, -2, 1, -3];
// The bass signature has the same shape, a third lower.
const BASS_SHIFT = -2;
const KEY_STEP = 1.1 * SPACE;

/** The accidentals of a key signature on a clef, left to right. */
export function keySignatureMarks(clef: ClefNote['clef'], key: KeySignature): KeyMark[] {
  const positions = (key > 0 ? SHARP_POS : FLAT_POS).slice(0, Math.abs(key));
  const shift = clef === 'bass' ? BASS_SHIFT : 0;
  return positions.map((pos, i) => ({ dx: i * KEY_STEP, pos: pos + shift, accidental: key > 0 ? 1 : -1 }));
}

/** Horizontal room a key signature takes after the clef. */
export function keySignatureWidth(key: KeySignature): number {
  return Math.abs(key) * KEY_STEP;
}

/** A key signature as read aloud, e.g. "3 sharps" or "1 flat", for the staff's accessible label; '' for none. */
export function keySignatureName(key: KeySignature): string {
  const count = Math.abs(key);
  const kind = key > 0 ? 'sharp' : 'flat';
  return count === 0 ? '' : `${String(count)} ${kind}${count > 1 ? 's' : ''}`;
}

function keyAccidental(key: KeySignature, letter: Pitch['letter']): Accidental {
  const altered = (key > 0 ? SHARP_ORDER : FLAT_ORDER).slice(0, Math.abs(key));
  return altered.includes(letter) ? (Math.sign(key) as Accidental) : 0;
}

/**
 * The accidental each note of one measure shows, or `undefined` for none. A note shows one only where it differs from
 * the key signature or from an earlier accidental on the same line or space of the measure (a natural cancels them).
 */
export function measureAccidentals(notes: ClefNote[], key: KeySignature): (Accidental | undefined)[] {
  const inForce = new Map<string, Accidental>();
  return notes.map((note) => {
    const where = `${note.clef}:${String(staffPos(note))}`;
    const current = inForce.get(where) ?? keyAccidental(key, note.pitch.letter);
    const written = note.pitch.accidental ?? 0;
    inForce.set(where, written);
    return written === current ? undefined : written;
  });
}
