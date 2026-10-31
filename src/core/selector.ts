// Note selection. M2 picks uniformly; M4 replaces this with weighted, mostly stepwise ordering (design §7.3, §14).
import { staffPos, type ClefNote } from './pitch';

/** A source of numbers in [0, 1), so tests can pick notes deterministically. */
export type Random = () => number;

const sameNote = (a: ClefNote, b: ClefNote) => a.clef === b.clef && staffPos(a) === staffPos(b);

/** A uniformly random note from `pool`, never `previous` again, so the staff always visibly changes. */
export function pickNote(pool: ClefNote[], random: Random, previous?: ClefNote): ClefNote {
  const options = previous ? pool.filter((note) => !sameNote(note, previous)) : pool;
  const note = options[Math.floor(random() * options.length)];
  if (!note) throw new Error('No notes to pick from');
  return note;
}
