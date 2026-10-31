// Pure music model (design §6): letters only, no accidentals in v1, so staff positions are plain arithmetic.
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;

/** The clef of one stave. */
export type Clef = 'treble' | 'bass';

/** A natural pitch in scientific notation; C4 is middle C. */
export interface Pitch {
  letter: (typeof LETTERS)[number];
  octave: number;
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

function diatonic(pitch: Pitch): number {
  return pitch.octave * LETTERS.length + LETTERS.indexOf(pitch.letter);
}

/** Staff position of a note: 0 is the middle line, +1 per line or space upward; the five lines are at -4, -2, 0, 2, 4. */
export function staffPos({ pitch, clef }: ClefNote): number {
  return diatonic(pitch) - diatonic(MIDDLE_LINE[clef]);
}

/** Positions of the ledger lines a note at `pos` needs, from the staff outward (±6, ±8, ±10). */
export function ledgerPositions(pos: number): number[] {
  const out: number[] = [];
  for (let p = FIRST_LEDGER; p <= Math.abs(pos); p += 2) out.push(Math.sign(pos) * p);
  return out;
}

/** The note's name with its octave, e.g. "C4", as shown in feedback and labels. */
export function pitchLabel(pitch: Pitch): string {
  return `${pitch.letter}${String(pitch.octave)}`;
}
