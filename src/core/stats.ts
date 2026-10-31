// Per-note learning stats (design §7.2, §8.4): every answer is scored 1 / 0.5 / 0 and folded into a running summary.
import { pitchLabel, type ClefNote } from './pitch';
import type { Answer } from './session';

/** Leitner box: 0 is struggling, 4 is mastered. */
type Box = 0 | 1 | 2 | 3 | 4;

/** What we know about one note on one clef. `ewmaAcc` and `ewmaMs` weight recent answers more. */
export interface NoteStat {
  key: string;
  attempts: number;
  correct: number;
  ewmaAcc: number;
  ewmaMs: number;
  /** Consecutive first-try hits. */
  streak: number;
  box: Box;
  lastSeen: number;
}

/** One settled question, as stored in the append-only log that stats can be rebuilt from. */
export interface Attempt {
  ts: number;
  key: string;
  /** The `InputMethod` id used. */
  input: string;
  /** The last answer given; `null` if none. */
  answer: Answer | null;
  tries: 1 | 2;
  correct: boolean;
  ms: number;
}

/** Weight of the newest answer in the moving averages. */
const ALPHA = 0.3;

/** The stat key for a note on a clef, like `treble:C6`: the same pitch on two clefs is two things to learn. */
export function statKey(note: ClefNote): string {
  return `${note.clef}:${pitchLabel(note.pitch)}`;
}

/** An unseen note: 50% accuracy, so it neither looks mastered nor hopeless. */
export function newStat(key: string): NoteStat {
  return { key, attempts: 0, correct: 0, ewmaAcc: 0.5, ewmaMs: 0, streak: 0, box: 0, lastSeen: 0 };
}

/** Score of an attempt: 1 for a first-try hit, 0.5 for a second-try hit, 0 for a miss (design §8.4). */
export function credit(a: Pick<Attempt, 'tries' | 'correct'>): 0 | 0.5 | 1 {
  if (!a.correct) return 0;
  return a.tries === 1 ? 1 : 0.5;
}

/** Folds one attempt into a stat. The first attempt replaces the starting guess; the box rises only on a first-try hit and drops to 0 on a miss. */
export function applyAttempt(s: NoteStat, a: Attempt): NoteStat {
  const score = credit(a);
  const first = s.attempts === 0;
  return {
    ...s,
    attempts: s.attempts + 1,
    correct: s.correct + (a.correct ? 1 : 0),
    ewmaAcc: first ? score : ALPHA * score + (1 - ALPHA) * s.ewmaAcc,
    ewmaMs: first ? a.ms : ALPHA * a.ms + (1 - ALPHA) * s.ewmaMs,
    streak: score === 1 ? s.streak + 1 : 0,
    box: nextBox(s.box, score),
    lastSeen: a.ts,
  };
}

function nextBox(box: Box, score: number): Box {
  if (score === 0) return 0;
  return score === 1 ? (Math.min(4, box + 1) as Box) : box;
}
