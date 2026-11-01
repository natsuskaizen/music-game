// Pure music model (design §6): a pitch is spelled (letter, accidental, octave). The letter and octave place it on the
// staff; the accidental only changes how it sounds, so staff positions stay plain arithmetic.
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;

/** The clef of one stave. */
export type Clef = 'treble' | 'bass';

/** Semitones a written accidental moves the letter: flat, natural, sharp. */
export type Accidental = -1 | 0 | 1;

/** A spelled pitch in scientific notation; C4 is middle C. No `accidental` means natural, so pre-M9 pitches and stat keys are unchanged. */
export interface Pitch {
  letter: (typeof LETTERS)[number];
  accidental?: Accidental;
  octave: number;
}

/** Whether `value` is one of the seven letter names, so a backup file is checked before it is trusted. */
export function isLetter(value: unknown): value is Pitch['letter'] {
  return LETTERS.some((letter) => letter === value);
}

/** A pitch as written on one clef. Middle C on the treble and on the bass staff are different things to read (design §6.1). */
export interface ClefNote {
  pitch: Pitch;
  clef: Clef;
}

const MIDDLE_LINE: Record<Clef, Pitch> = {
  treble: { letter: 'B', octave: 4 },
  bass: { letter: 'D', octave: 3 },
};

const FIRST_LEDGER = 6;

const SEMITONE: Record<Pitch['letter'], number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function diatonic(pitch: Pitch): number {
  return pitch.octave * LETTERS.length + LETTERS.indexOf(pitch.letter);
}

/** Staff position of a note: 0 is the middle line, +1 per line or space upward; the five lines are at -4, -2, 0, 2, 4. */
export function staffPos({ pitch, clef }: ClefNote): number {
  return diatonic(pitch) - diatonic(MIDDLE_LINE[clef]);
}

/** The note written at staff position `pos` on a clef: the inverse of `staffPos`. */
export function noteAt(clef: Clef, pos: number): ClefNote {
  const index = diatonic(MIDDLE_LINE[clef]) + pos;
  const letter = LETTERS[((index % LETTERS.length) + LETTERS.length) % LETTERS.length] ?? 'C';
  return { pitch: { letter, octave: Math.floor(index / LETTERS.length) }, clef };
}

/** MIDI number of a pitch (C4 = 60), the common currency of key presses and the mic (design §3.3). F♯4 and G♭4 share one. */
export function midiOf(pitch: Pitch): number {
  return (pitch.octave + 1) * 12 + SEMITONE[pitch.letter] + (pitch.accidental ?? 0);
}

/** A pitch's place within the octave, 0–11 (C is 0): letter answers are graded by it, so F♯ and G♭ are both right. */
export function pitchClass(pitch: Omit<Pitch, 'octave'>): number {
  return midiOf({ ...pitch, octave: 0 }) % 12;
}

/** The natural a MIDI note is written on, and whether it needs a sharp: a black key sits on the natural below it. */
export function writtenPitch(midi: number): { pitch: Pitch; sharp: boolean } {
  const octave = Math.floor(midi / 12) - 1;
  const semitone = midi - (octave + 1) * 12;
  const letter = LETTERS.findLast((l) => SEMITONE[l] <= semitone) ?? 'C';
  return { pitch: { letter, octave }, sharp: SEMITONE[letter] < semitone };
}

/** Frequency in Hz of a MIDI note in equal temperament (A4 = 440 Hz), for the synthesized answer tone. */
export function hzOf(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** Positions of the ledger lines a note at `pos` needs, from the staff outward (±6, ±8, ±10). */
export function ledgerPositions(pos: number): number[] {
  const out: number[] = [];
  for (let p = FIRST_LEDGER; p <= Math.abs(pos); p += 2) out.push(Math.sign(pos) * p);
  return out;
}

const ACCIDENTAL_MARK: Record<Accidental, string> = { [-1]: 'b', 0: '', 1: '#' };

/** The spelled name with its octave, e.g. "C4" or "F#5", as shown in feedback and used in stat keys (a natural has no mark). */
export function pitchLabel(pitch: Pitch): string {
  return `${pitch.letter}${ACCIDENTAL_MARK[pitch.accidental ?? 0]}${String(pitch.octave)}`;
}
