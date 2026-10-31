// The sequence cursor (M5-2, design §8.3, §8.4): walks a sequence note by note with the single-note session rules.
// A single note is a sequence of one, so Quiz can run both through this one path.
import type { ClefNote } from './pitch';
import type { Measure } from './sequence';
import { reduce, startSession, type Session, type SessionEvent } from './session';

/** A sequence being read: its notes in order, the one in play, and the session scoring each note (one attempt per note). */
export interface SequenceRun {
  notes: ClefNote[];
  index: number;
  session: Session;
}

/** The notes of `measures` in reading order. */
export function sequenceNotes(measures: Measure[]): ClefNote[] {
  return measures.flatMap((measure) => measure.map((n) => n.note));
}

/** A run at the first note. The session ends once every note is settled, so the cursor never passes the last one. */
export function startRun(notes: ClefNote[]): SequenceRun {
  const [first] = notes;
  if (!first) throw new Error('A sequence needs at least one note');
  return { notes, index: 0, session: startSession(notes, notes.length, () => first) };
}

/** Applies one event. The cursor moves only on `next` after a right answer or a reveal, never on a miss or retry. */
export function stepRun(run: SequenceRun, event: SessionEvent): SequenceRun {
  const moved = run.index + 1;
  const session = reduce(run.session, event, () => run.notes[moved] ?? run.session.note);
  const advanced = event.type === 'next' && session.phase === 'ask';
  return { ...run, session, index: advanced ? moved : run.index };
}
