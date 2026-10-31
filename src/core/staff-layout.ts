// Staff geometry in SVG units (design §3.1). Pure, so the Staff component only draws.
import { staffPos, writtenPitch, type Clef, type ClefNote } from './pitch';

/** Clef setting: one stave, or both on a grand staff (design §9). */
export type ClefMode = Clef | 'both';

/** One staff space. SMuFL glyphs are 4 spaces per em, so glyph font size is 4 × SPACE. */
export const SPACE = 16;

/** Staff positions of a stave's five lines, bottom to top (0 is the middle line). */
export const STAFF_LINES = [-4, -2, 0, 2, 4];

/** One stave of a system: its clef and the y of its middle line. */
export interface Stave {
  clef: Clef;
  midY: number;
}

// Room for 3 ledger lines plus a notehead above the top stave and below the bottom one.
const MARGIN = 7 * SPACE;
// Middle line to middle line on a grand staff: 3 ledger notes on either stave stay clear of the other.
const GRAND_GAP = 10 * SPACE;

/** The staves drawn for a clef setting, top to bottom. */
export function stavesFor(mode: ClefMode): Stave[] {
  if (mode !== 'both') return [{ clef: mode, midY: MARGIN }];
  return [
    { clef: 'treble', midY: MARGIN },
    { clef: 'bass', midY: MARGIN + GRAND_GAP },
  ];
}

/** Vertical extent of a system: its top and bottom staff lines (for the barline and brace) and the full height with ledger room. */
export function systemBounds(staves: Stave[]): { top: number; bottom: number; height: number } {
  const midYs = staves.map((stave) => stave.midY);
  const lowestMid = Math.max(...midYs);
  return { top: Math.min(...midYs) - 2 * SPACE, bottom: lowestMid + 2 * SPACE, height: lowestMid + MARGIN };
}

/** SVG y of a staff position on a stave (0 = middle line, +1 per line or space upward). */
export function yOf(stave: Stave, pos: number): number {
  return stave.midY - (pos * SPACE) / 2;
}

/** Staff position of the line a clef glyph sits on: the G clef curls around G4, the F clef's dots surround F3. */
export function clefLinePos(clef: Clef): number {
  return clef === 'treble' ? -2 : 2;
}

// Farthest staff position a heard note is drawn at: past it, the note would leave the system's ledger room.
const HEARD_REACH = 12;
const MIDDLE_C = 60;

/**
 * Where a heard MIDI note lands on the staff, so the player sees where their playing hits (on a grand staff, middle C
 * and up goes on the treble). `undefined` when it is too far off the staff to draw.
 */
export function heardMark(midi: number, mode: ClefMode): { note: ClefNote; sharp: boolean } | undefined {
  const { pitch, sharp } = writtenPitch(midi);
  const clef = mode !== 'both' ? mode : midi >= MIDDLE_C ? 'treble' : 'bass';
  const note = { pitch, clef };
  return Math.abs(staffPos(note)) <= HEARD_REACH ? { note, sharp } : undefined;
}
