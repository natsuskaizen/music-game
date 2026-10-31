// The demo quiz loop as a reducer (design §8.3, §8.4): a miss gets one retry, then the answer is
// revealed and the quiz waits for Continue. Spike version for M1; M2 replaces it with the full session.
import { midiOf, type ClefNote } from './pitch';
import { pickNote, type Random } from './selector';

/** Where a question stands: waiting, second try after one miss, revealed after two, or answered right. */
type Phase = 'ask' | 'retry' | 'reveal' | 'right';

/** One question plus the running score shown above the staff. */
export interface QuizState {
  note: ClefNote;
  phase: Phase;
  wrongKeys: number[];
  streak: number;
  firstTry: number;
  total: number;
}

/** A fresh quiz with its first note from `pool`. */
export function startQuiz(pool: ClefNote[], random: Random): QuizState {
  return { note: pickNote(pool, random), phase: 'ask', wrongKeys: [], streak: 0, firstTry: 0, total: 0 };
}

/** Grades a pressed key by exact pitch. Only 'ask' and 'retry' accept answers; a reveal waits for `nextQuestion`. */
export function answerKey(s: QuizState, midi: number): QuizState {
  if (s.phase !== 'ask' && s.phase !== 'retry') return s;
  if (midi === midiOf(s.note.pitch)) return scoreRight(s);
  const wrongKeys = [...s.wrongKeys, midi];
  if (s.phase === 'ask') return { ...s, phase: 'retry', wrongKeys };
  return { ...s, phase: 'reveal', wrongKeys, streak: 0, total: s.total + 1 };
}

/** The note to sound when an answer settles the question (right, or revealed after two misses); design §14. */
export function toneAfter(before: QuizState, after: QuizState): number | undefined {
  const settled = after.phase === 'right' || after.phase === 'reveal';
  return settled && after.phase !== before.phase ? midiOf(after.note.pitch) : undefined;
}

function scoreRight(s: QuizState): QuizState {
  const first = s.phase === 'ask';
  return {
    ...s,
    phase: 'right',
    total: s.total + 1,
    firstTry: s.firstTry + (first ? 1 : 0),
    streak: first ? s.streak + 1 : 0,
  };
}

/** Moves on to a new note, keeping the score. The UI calls it after a right answer or the Continue tap. */
export function nextQuestion(s: QuizState, pool: ClefNote[], random: Random): QuizState {
  return { ...s, note: pickNote(pool, random, s.note), phase: 'ask', wrongKeys: [] };
}

/** First-try accuracy as a whole percentage, 0 before any answer. */
export function firstTryPercent(s: QuizState): number {
  return s.total ? Math.round((100 * s.firstTry) / s.total) : 0;
}
