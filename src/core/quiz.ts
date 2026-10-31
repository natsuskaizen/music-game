// The demo quiz loop as a reducer (design §8.3, §8.4): a miss gets one retry, then the answer is
// revealed and the quiz waits for Continue. Spike version for M1; M2 replaces it with the full session.
import { ledgerPositions, midiOf, noteAt, staffPos, type Clef, type ClefNote } from './pitch';
import type { ClefMode } from './staff-layout';

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

/** A source of numbers in [0, 1), so tests can pick notes deterministically. */
export type Random = () => number;

// Up to 3 ledger lines beyond either side of the staff (design §6.1).
const REACH = 11;
const LEDGER_WEIGHT = 0.6;

function candidates(mode: ClefMode): { note: ClefNote; weight: number }[] {
  const clefs: Clef[] = mode === 'both' ? ['treble', 'bass'] : [mode];
  return clefs.flatMap((clef) =>
    Array.from({ length: 2 * REACH + 1 }, (_, i) => {
      const note = noteAt(clef, i - REACH);
      return { note, weight: 1 + LEDGER_WEIGHT * ledgerPositions(staffPos(note)).length };
    }),
  );
}

const sameNote = (a: ClefNote, b: ClefNote) => a.clef === b.clef && staffPos(a) === staffPos(b);

/** A random note for the clef setting, weighted toward ledger notes, never `previous` again. */
export function pickNote(mode: ClefMode, random: Random, previous?: ClefNote): ClefNote {
  const pool = candidates(mode).filter((c) => !previous || !sameNote(c.note, previous));
  let r = random() * pool.reduce((sum, c) => sum + c.weight, 0);
  // The last candidate catches floating-point rounding when `random()` is just under 1.
  const hit = pool.find((c) => (r -= c.weight) < 0) ?? pool.at(-1);
  if (!hit) throw new Error(`No notes for clef setting ${mode}`);
  return hit.note;
}

/** A fresh quiz with its first note. */
export function startQuiz(mode: ClefMode, random: Random): QuizState {
  return { note: pickNote(mode, random), phase: 'ask', wrongKeys: [], streak: 0, firstTry: 0, total: 0 };
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
export function nextQuestion(s: QuizState, mode: ClefMode, random: Random): QuizState {
  return { ...s, note: pickNote(mode, random, s.note), phase: 'ask', wrongKeys: [] };
}

/** First-try accuracy as a whole percentage, 0 before any answer. */
export function firstTryPercent(s: QuizState): number {
  return s.total ? Math.round((100 * s.firstTry) / s.total) : 0;
}
