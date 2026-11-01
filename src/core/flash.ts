// Keyboard highlights that fade (design §8.4): a hit lights its key briefly, then the key goes back to normal.
import type { KeyMark } from '../inputs/types';

/** How long a right or wrong highlight stays on a key before it is gone; the CSS fade runs over the same time. */
export const FLASH_MS = 900;

/** One lit key. The id lets a timer remove exactly this flash, not a newer one on the same key. */
export interface Flash {
  id: number;
  midi: number;
  mark: 'right' | 'wrong';
}

/** The flashes with `flash` added; a key has at most one, so a new hit replaces the old one. */
export function addFlash(flashes: Flash[], flash: Flash): Flash[] {
  return [...flashes.filter((f) => f.midi !== flash.midi), flash];
}

/** The flashes without the one with this id (no change if a newer flash already replaced it). */
export function dropFlash(flashes: Flash[], id: number): Flash[] {
  return flashes.filter((f) => f.id !== id);
}

/** The keyboard's marks: the note being heard, with live flashes winning over it. */
export function keyMarks(flashes: Flash[], heard: number | undefined): Map<number, KeyMark> {
  const marks = new Map<number, KeyMark>(heard === undefined ? [] : [[heard, 'heard']]);
  for (const f of flashes) marks.set(f.midi, f.mark);
  return marks;
}
