// Note pools by difficulty (design §14). Bounds are written as pitches so they read like the design table.
import { KEY_SIGNATURES, spellNotes, type Spelling } from './key-signature';
import { KEY_RANGES } from './keyboard';
import { midiOf, noteAt, staffPos, type Clef, type ClefNote, type Pitch } from './pitch';
import type { ClefMode } from './staff-layout';
import { statKey, weakNotes, type NoteStat } from './stats';

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

/** Naturals in C major: the pool before M9, and the default (accidentals are off by default). */
export const PLAIN: Spelling = { key: 0, accidentals: false };

// An altered note at the edge of Hard (E♭3, F♯6) can sound beyond the keyboard, so it is left out.
function playable({ pitch, clef }: ClefNote): boolean {
  const { lo, hi } = KEY_RANGES[clef];
  const midi = midiOf(pitch);
  return midi >= lo && midi <= hi;
}

/** Every note a question can ask for a clef setting, difficulty and spelling, low to high; `both` lists treble then bass. */
export function notePool(mode: ClefMode, difficulty: Difficulty, spelling = PLAIN): ClefNote[] {
  const clefs: Clef[] = mode === 'both' ? ['treble', 'bass'] : [mode];
  return clefs.flatMap((clef) =>
    spellNotes(clefPool(clef, RANGES[difficulty][clef]), spelling).filter(playable),
  );
}

// Every note any key and accidentals setting can ask, once each.
function everySpelling(mode: ClefMode, difficulty: Difficulty): ClefNote[] {
  const all = KEY_SIGNATURES.flatMap((key) => notePool(mode, difficulty, { key, accidentals: true }));
  return [...new Map(all.map((note) => [statKey(note), note])).values()];
}

/**
 * The weak notes review mode asks (design §7.4): from every spelling, so a note missed in any key comes back.
 * With only natural stats it is the same as before M9 (M9-AC3).
 */
export function reviewPool(
  mode: ClefMode,
  difficulty: Difficulty,
  stats: ReadonlyMap<string, NoteStat>,
): ClefNote[] {
  return weakNotes(everySpelling(mode, difficulty), stats);
}
