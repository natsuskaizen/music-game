// Sequence generation (M5-1): a run of notes chosen by the M4 picker, grouped into 4/4 measures (design §8.2, §14).
import type { ClefNote } from './pitch';
import type { Difficulty } from './ranges';
import type { Picker, Random } from './selector';

/** Rhythm is visual only (design §14): a quarter is one beat, an eighth half a beat. */
type Duration = 'quarter' | 'eighth';

/** One note of a sequence with how long it is drawn. */
interface SequenceNote {
  note: ClefNote;
  duration: Duration;
}

/** Notes that fill exactly four beats. */
export type Measure = SequenceNote[];

const BEATS = 4;

/** Measures and total notes allowed per difficulty (design §14). Hard's 10 is below its 3-measure minimum of 12. */
const SIZES: Record<Difficulty, { measures: [number, number]; notes: [number, number] }> = {
  easy: { measures: [1, 1], notes: [4, 4] },
  medium: { measures: [1, 2], notes: [4, 10] },
  hard: { measures: [3, 3], notes: [10, 16] },
};

const between = ([low, high]: [number, number], random: Random) =>
  low + Math.floor(random() * (high - low + 1));

/** How many notes each measure holds: an even split, which stays within 4–8 (4 quarters up to 8 eighths). */
const splitNotes = (total: number, measures: number): number[] =>
  Array.from({ length: measures }, (_, i) => Math.floor(total / measures) + (i < total % measures ? 1 : 0));

/** A new array in random order. */
const shuffled = <T>(items: T[], random: Random): T[] =>
  items
    .map((item) => ({ item, key: random() }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item);

/** The durations of a measure with `count` notes: `count - 4` beats are split into two eighths, the rest are quarters. */
function durationsFor(count: number, random: Random): Duration[] {
  const beats: Duration[][] = [
    ...Array<Duration[]>(count - BEATS).fill(['eighth', 'eighth']),
    ...Array<Duration[]>(2 * BEATS - count).fill(['quarter']),
  ];
  return shuffled(beats, random).flat();
}

/**
 * A sequence sized by difficulty (`random` sizes it): each note is chosen by `picker` from the one before, and every measure fills 4/4
 * with quarters and beamable pairs of eighths.
 */
export function makeSequence(
  pool: ClefNote[],
  difficulty: Difficulty,
  { picker, random }: { picker: Picker; random: Random },
): Measure[] {
  const { measures, notes } = SIZES[difficulty];
  const count = measures[0] === measures[1] ? measures[0] : between(measures, random);
  const fit: [number, number] = [Math.max(notes[0], BEATS * count), Math.min(notes[1], 2 * BEATS * count)];
  let previous: ClefNote | undefined;
  return splitNotes(between(fit, random), count).map((size) =>
    durationsFor(size, random).map((duration) => {
      previous = picker(pool, previous);
      return { note: previous, duration };
    }),
  );
}
