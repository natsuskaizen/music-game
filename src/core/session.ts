// The quiz session as a reducer (design §8.3, §8.4): a miss keeps the question open for more tries until it is
// answered right or skipped, and a skip reveals the answer. It ends after `questionsPerSession` questions. Inputs only produce an `Answer` (design §3.4).
import { midiOf, type Accidental, type ClefNote, type Letter } from './pitch';
import type { Picker } from './selector';
import { statKey, type Attempt } from './stats';

/** What an input reports: an exact pitch from keys or the mic, or a letter with its accidental from writing (design §3.4, §14). No `accidental` means natural. */
export type Answer =
  { kind: 'pitch'; midi: number } | { kind: 'letter'; letter: Letter; accidental?: Accidental };

/** Whether `answer` names `note`: a pitch must match the octave (C5 is wrong for C6); a letter ignores the octave but not the accidental (F is wrong for F♯, design §14). */
export function gradeAnswer(note: ClefNote, answer: Answer): boolean {
  return answer.kind === 'letter'
    ? answer.letter === note.pitch.letter && (answer.accidental ?? 0) === (note.pitch.accidental ?? 0)
    : answer.midi === midiOf(note.pitch);
}

/** Where a question stands: waiting, open after a miss, skipped (revealed), answered right, or session over. */
type Phase = 'ask' | 'retry' | 'reveal' | 'right' | 'done';

/** Whether the question is settled (answered right, or skipped), so `next` may move on. */
export function isSettled(phase: Phase): boolean {
  return phase === 'right' || phase === 'reveal';
}

/** Whether the question still takes answers and skips: asked, or missed at least once. */
export function isOpen(phase: Phase): boolean {
  return phase === 'ask' || phase === 'retry';
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

/** The same session drawing from a new pool; review mode shrinks it as notes are learned, and an empty pool ends the session. */
export function withPool(s: Session, pool: ClefNote[]): Session {
  return { ...s, pool };
}

/** What the UI can tell the session: an answer, `skip` to give up on the question, `next` after a right answer's animation or a skip, or `timeUp` when the sprint ends. */
export type SessionEvent =
  { type: 'answer'; answer: Answer } | { type: 'skip' } | { type: 'next' } | { type: 'timeUp' };

/** A fresh session with an empty score and its first note from `pool`. */
export function startSession(
  pool: ClefNote[],
  questionsPerSession: number | undefined,
  pick: Picker,
): Session {
  const note = pick(pool);
  return { pool, questionsPerSession, phase: 'ask', note, misses: [], streak: 0, firstTry: 0, total: 0 };
}

/**
 * Applies one event. Events that don't fit the phase (an answer after a skip, `next` while asking) change nothing.
 * `timeUp` ends the session at once; the unfinished question was never counted, so it is not a miss (design §14).
 */
export function reduce(s: Session, e: SessionEvent, pick: Picker): Session {
  if (e.type === 'timeUp') return { ...s, phase: 'done' };
  if (e.type === 'next') return isSettled(s.phase) ? next(s, pick) : s;
  if (!isOpen(s.phase)) return s;
  return e.type === 'answer' ? answer(s, e.answer) : skip(s);
}

function answer(s: Session, a: Answer): Session {
  if (gradeAnswer(s.note, a)) return scoreRight(s);
  return { ...s, phase: 'retry', misses: [...s.misses, a] };
}

// Giving up counts as a miss and shows the answer.
function skip(s: Session): Session {
  return { ...s, phase: 'reveal', streak: 0, total: s.total + 1 };
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
  const finished = s.questionsPerSession !== undefined && s.total >= s.questionsPerSession;
  if (finished || s.pool.length === 0) return { ...s, phase: 'done' };
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
