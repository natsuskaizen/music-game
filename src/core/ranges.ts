// Note pools by difficulty (design §14). Bounds are written as pitches so they read like the design table.
import { noteAt, staffPos, type Clef, type ClefNote, type Pitch } from './pitch';
import type { ClefMode } from './staff-layout';

/** Difficulty setting: sets the note range per clef (design §14). Never changes automatically. */
export type Difficulty = 'easy' | 'medium' | 'hard';

type Bounds = [low: Pitch, high: Pitch];

const p = (letter: Pitch['letter'], octave: number): Pitch => ({ letter, octave });

// Medium allows 1 ledger line beyond the staff, Hard 3 (design §6.1).
const RANGES: Record<Difficulty, Record<Clef, Bounds>> = {
  easy: { treble: [p('C', 4), p('C', 5)], bass: [p('C', 3), p('C', 4)] },
  medium: { treble: [p('B', 3), p('B', 5)], bass: [p('D', 2), p('D', 4)] },
  hard: { treble: [p('E', 3), p('F', 6)], bass: [p('G', 1), p('A', 4)] },
};

function clefPool(clef: Clef, [low, high]: Bounds): ClefNote[] {
  const from = staffPos({ pitch: low, clef });
  const to = staffPos({ pitch: high, clef });
  return Array.from({ length: to - from + 1 }, (_, i) => noteAt(clef, from + i));
}

/** Every note a question can ask for a clef setting and difficulty, low to high; `both` lists treble then bass. */
export function notePool(mode: ClefMode, difficulty: Difficulty): ClefNote[] {
  const clefs: Clef[] = mode === 'both' ? ['treble', 'bass'] : [mode];
  return clefs.flatMap((clef) => clefPool(clef, RANGES[difficulty][clef]));
}
