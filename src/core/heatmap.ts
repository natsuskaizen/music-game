// The stats screen's heat-map (design §8.3, §7.4): every pool note, grouped into staff rows and colored by how well it is known.
import type { Clef, ClefNote } from './pitch';
import type { Measure } from './sequence';
import { statKey, type NoteStat } from './stats';

/** How well a note is known: `unseen` until it has been answered once. */
export type Heat = 'unseen' | 'weak' | 'fair' | 'strong';

/** One staff row of the heat-map: a single clef's notes as quarter notes, with a heat per note in play order. */
export interface HeatRow {
  clef: Clef;
  measures: Measure[];
  heats: Heat[];
}

/** Notes per measure and measures per row: eight quarters is what a phone-width staff fits without crowding. */
const PER_MEASURE = 4;
const PER_ROW = 2 * PER_MEASURE;
const WEAK_BELOW = 0.5;
const FAIR_BELOW = 0.8;

/** Buckets a note's recent accuracy (`ewmaAcc`): under 50% weak, under 80% fair, otherwise strong. */
export function heatOf(stat: NoteStat | undefined): Heat {
  if (!stat || stat.attempts === 0) return 'unseen';
  if (stat.ewmaAcc < WEAK_BELOW) return 'weak';
  return stat.ewmaAcc < FAIR_BELOW ? 'fair' : 'strong';
}

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, (i + 1) * size),
  );
}

/** Lays `pool` out as staff rows, treble before bass, each note's heat taken from `stats`. */
export function heatRows(pool: ClefNote[], stats: ReadonlyMap<string, NoteStat>): HeatRow[] {
  return (['treble', 'bass'] as const).flatMap((clef) =>
    chunk(
      pool.filter((note) => note.clef === clef),
      PER_ROW,
    ).map((notes) => ({
      clef,
      measures: chunk(notes, PER_MEASURE).map((group) =>
        group.map((note) => ({ note, duration: 'quarter' as const })),
      ),
      heats: notes.map((note) => heatOf(stats.get(statKey(note)))),
    })),
  );
}

/** The seen notes of `pool`, weakest first, so the screen can list accuracy and average time. */
export function seenNotes(pool: ClefNote[], stats: ReadonlyMap<string, NoteStat>): NoteStat[] {
  return pool
    .flatMap((note) => stats.get(statKey(note)) ?? [])
    .filter((stat) => stat.attempts > 0)
    .sort((a, b) => a.ewmaAcc - b.ewmaAcc);
}
