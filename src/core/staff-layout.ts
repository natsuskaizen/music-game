// Staff geometry in SVG units (design §3.1). Pure, so the Staff component only draws.
import type { Clef } from './pitch';

/** Clef setting: one stave, or both on a grand staff (design §9). */
export type ClefMode = Clef | 'both';

/** One staff space. SMuFL glyphs are 4 spaces per em, so glyph font size is 4 × SPACE. */
export const SPACE = 16;

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
