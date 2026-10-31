// On-screen piano layout (design §3.2). Pure, so Piano.svelte only positions buttons.
import { midiOf, type Pitch } from './pitch';
import type { ClefMode } from './staff-layout';

/** One key: its MIDI number, colour, and the index of the white key it sits on or after. */
export interface PianoKey {
  midi: number;
  black: boolean;
  whiteIndex: number;
}

/** A keyboard span in MIDI numbers, and the key to scroll into view first. */
export interface KeyRange {
  lo: number;
  hi: number;
  center: number;
}

const BLACK = new Set([1, 3, 6, 8, 10]);
const NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const midi = (letter: Pitch['letter'], octave: number) => midiOf({ letter, octave });

/** Keyboard range per clef setting: 3 ledger lines beyond each staff, centred on its middle line (design §3.2). */
export const KEY_RANGES: Record<ClefMode, KeyRange> = {
  treble: { lo: midi('E', 3), hi: midi('F', 6), center: midi('B', 4) },
  bass: { lo: midi('G', 1), hi: midi('A', 4), center: midi('D', 3) },
  both: { lo: midi('G', 1), hi: midi('F', 6), center: midi('C', 4) },
};

/** The keys from `lo` to `hi`, with white keys numbered left to right; a black key shares its left neighbour's index. */
export function pianoKeys({ lo, hi }: KeyRange): PianoKey[] {
  const keys: PianoKey[] = [];
  let whiteIndex = 0;
  for (let m = lo; m <= hi; m++) {
    const black = BLACK.has(m % 12);
    if (!black && m > lo) whiteIndex++;
    keys.push({ midi: m, black, whiteIndex });
  }
  return keys;
}

/** A key's accessible name, e.g. "C4" or "F♯3"; Playwright and screen readers find keys by it. */
export function keyName(m: number): string {
  return `${NAMES[m % 12] ?? ''}${String(Math.floor(m / 12) - 1)}`;
}
