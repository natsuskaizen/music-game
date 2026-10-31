// The quiz session as a reducer (design §8.3, §8.4): a miss gets one retry, then the answer is revealed and the
// session waits for the next event. It ends after `questionsPerSession` questions. Inputs only produce an `Answer` (design §3.4).
import { midiOf, type ClefNote } from './pitch';
import type { Picker } from './selector';
import { statKey, type Attempt } from './stats';

/** What an input reports. Every M2 input knows the octave, so an answer is an exact pitch (design §3.4, §14). */
export interface Answer {
  kind: 'pitch';
  midi: number;
}

/** Whether `answer` names `note` exactly: same pitch and octave, so C5 is wrong for C6 (design §14). */
export function gradeAnswer(note: ClefNote, answer: Answer): boolean {
  return answer.midi === midiOf(note.pitch);
}

/** Where a question stands: waiting, second try after one miss, revealed after two, answered right, or session over. */
type Phase = 'ask' | 'retry' | 'reveal' | 'right' | 'done';

/** Whether the question is settled (answered right, or revealed), so the answer shows and `next` may move on. */
export function isSettled(phase: Phase): boolean {
  return phase === 'right' || phase === 'reveal';
}

/** One session: its note pool and question count, the current question, and the running score. */
export interface Session {
  pool: ClefNote[];
  /** Questions per session; `undefined` is endless (design §14). */
  questionsPerSession: number | undefined;
  phase: Phase;
  note: ClefNote;
  misses: Answer[];
  streak: number;
  firstTry: number;
  total: number;
}

/** What the UI can tell the session: an answer, or `next` after a right answer's animation or the Continue tap. */
export type SessionEvent = { type: 'answer'; answer: Answer } | { type: 'next' };

/** A fresh session with an empty score and its first note from `pool`. */
export function startSession(
  pool: ClefNote[],
  questionsPerSession: number | undefined,
  pick: Picker,
): Session {
  const note = pick(pool);
  return { pool, questionsPerSession, phase: 'ask', note, misses: [], streak: 0, firstTry: 0, total: 0 };
}

/** Applies one event. Events that don't fit the phase (an answer during a reveal, `next` while asking) change nothing. */
export function reduce(s: Session, e: SessionEvent, pick: Picker): Session {
  if (e.type === 'answer') return s.phase === 'ask' || s.phase === 'retry' ? answer(s, e.answer) : s;
  return isSettled(s.phase) ? next(s, pick) : s;
}

function answer(s: Session, a: Answer): Session {
  if (gradeAnswer(s.note, a)) return scoreRight(s);
  const misses = [...s.misses, a];
  if (s.phase === 'ask') return { ...s, phase: 'retry', misses };
  return { ...s, phase: 'reveal', misses, streak: 0, total: s.total + 1 };
}

function scoreRight(s: Session): Session {
  const first = s.phase === 'ask';
  return {
    ...s,
    phase: 'right',
    total: s.total + 1,
    firstTry: s.firstTry + (first ? 1 : 0),
    streak: first ? s.streak + 1 : 0,
  };
}

function next(s: Session, pick: Picker): Session {
  if (s.questionsPerSession !== undefined && s.total >= s.questionsPerSession) return { ...s, phase: 'done' };
  return { ...s, note: pick(s.pool, s.note), phase: 'ask', misses: [] };
}

/** The attempt a question just settled into, or `undefined` if `after` is not a newly settled question. */
export function settledAttempt(
  before: Session,
  after: Session,
  meta: Pick<Attempt, 'ts' | 'input' | 'ms' | 'answer'>,
): Attempt | undefined {
  if (isSettled(before.phase) || !isSettled(after.phase)) return undefined;
  const tries = before.phase === 'ask' ? 1 : 2;
  return { ...meta, key: statKey(after.note), tries, correct: after.phase === 'right' };
}

/** First-try accuracy as a whole percentage, 0 before any answer. */
export function firstTryPercent(s: Session): number {
  return s.total ? Math.round((100 * s.firstTry) / s.total) : 0;
}
