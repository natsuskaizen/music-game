// Key signatures, the accidentals a note shows, and how a key spells the note pool (M9-2, M9-3, design §3.1). Pure, so the Staff component only draws.
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

const MAJORS = ['C♭', 'G♭', 'D♭', 'A♭', 'E♭', 'B♭', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯'];
const MINORS = ['A♭', 'E♭', 'B♭', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯', 'G♯', 'D♯', 'A♯'];

/** A key by name for the picker, e.g. "G major / E minor (1♯)"; the signature count alone confused (M10-3). */
export function keyLabel(key: KeySignature): string {
  const count = Math.abs(key);
  const signs = count === 0 ? 'no ♯ or ♭' : `${String(count)}${key > 0 ? '♯' : '♭'}`;
  return `${MAJORS[key + 7] ?? ''} major / ${MINORS[key + 7] ?? ''} minor (${signs})`;
}

/** Every key signature from 7 flats to 7 sharps; the settings offer these (design §14). */
export const KEY_SIGNATURES: KeySignature[] = Array.from({ length: 15 }, (_, i) => i - 7);

/** The key setting: a fixed key signature, or a new random one each session. */
export type KeyChoice = KeySignature | 'random';

/** The key signature a session reads in: the chosen one, or one drawn from `KEY_SIGNATURES` for `random`. */
export function sessionKey(choice: KeyChoice, random: () => number): KeySignature {
  return choice === 'random' ? (KEY_SIGNATURES[Math.floor(random() * KEY_SIGNATURES.length)] ?? 0) : choice;
}

/** How a key signature alters a letter: F in G major sounds F♯, so this is +1. */
export function keyAccidental(key: KeySignature, letter: Pitch['letter']): Accidental {
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

/** How a pool is spelled: the key signature, and whether written accidentals (♯, ♭, ♮ against the key) are asked too. */
export interface Spelling {
  key: KeySignature;
  accidentals: boolean;
}

const ALTERATIONS: Accidental[] = [-1, 0, 1];
// Rare spellings of a white key; only a key signature that has them (C♭, F♭ in flat keys, E♯, B♯ in sharp keys) asks for them.
const RARE = new Set(['E1', 'B1', 'C-1', 'F-1']);

const spelled = (natural: ClefNote, accidental: Accidental): ClefNote =>
  accidental === 0 ? natural : { ...natural, pitch: { ...natural.pitch, accidental } };

/**
 * Spells natural notes for a key: each note sounds as the key signature says (F in G major is F♯), and with
 * `accidentals` it also comes flat, natural and sharp, minus rare spellings like E♯. A natural stays without an `accidental`
 * field, so C major without accidentals returns the pool unchanged (M9-AC3).
 */
export function spellNotes(pool: ClefNote[], { key, accidentals }: Spelling): ClefNote[] {
  return pool.flatMap((note) => {
    const inKey = keyAccidental(key, note.pitch.letter);
    const options = accidentals
      ? ALTERATIONS.filter((a) => a === inKey || !RARE.has(`${note.pitch.letter}${String(a)}`))
      : [inKey];
    return options.map((accidental) => spelled(note, accidental));
  });
}
