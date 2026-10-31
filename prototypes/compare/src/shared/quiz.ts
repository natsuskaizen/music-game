// Pure quiz logic shared by both prototypes (no DOM, no framework).
export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export type Letter = (typeof LETTERS)[number];
export type Clef = 'treble' | 'bass';
export type ClefMode = Clef | 'both';
export interface Note { letter: Letter; octave: number; clef: Clef }
export type Phase = 'ask' | 'retry' | 'reveal' | 'right';

const SEMITONE: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const MIDDLE = { treble: 4 * 7 + 6, bass: 3 * 7 + 1 }; // B4, D3 as diatonic indexes

export const diatonic = (n: { letter: Letter; octave: number }) => n.octave * 7 + LETTERS.indexOf(n.letter);
export const staffPos = (n: Note) => diatonic(n) - MIDDLE[n.clef];
export const hz = (n: Note) => 440 * 2 ** (((n.octave + 1) * 12 + SEMITONE[n.letter] - 69) / 12);
export const label = (n: Note) => `${n.letter}${n.octave}`;

/** Staff positions of the ledger lines a note needs (±6, ±8, ±10). */
export function ledgerPositions(pos: number): number[] {
  const out: number[] = [];
  for (let p = 6; p <= Math.abs(pos); p += 2) out.push(Math.sign(pos) * p);
  return out;
}

/** Random note up to 3 ledger lines out, weighted toward ledger notes, never the same note twice in a row. */
export function randomNote(mode: ClefMode, prev?: Note): Note {
  const clefs: Clef[] = mode === 'both' ? ['treble', 'bass'] : [mode];
  const pool: { n: Note; w: number }[] = [];
  for (const clef of clefs) {
    for (let d = MIDDLE[clef] - 11; d <= MIDDLE[clef] + 11; d++) {
      const n: Note = { letter: LETTERS[d % 7], octave: Math.floor(d / 7), clef };
      if (prev && prev.clef === clef && diatonic(prev) === d) continue;
      pool.push({ n, w: 1 + 0.6 * ledgerPositions(staffPos(n)).length });
    }
  }
  let r = Math.random() * pool.reduce((a, b) => a + b.w, 0);
  for (const c of pool) if ((r -= c.w) <= 0) return c.n;
  return pool[pool.length - 1].n;
}

export interface QuizState {
  note: Note; phase: Phase; wrong: Letter[];
  streak: number; firstTry: number; total: number;
}

export const start = (mode: ClefMode): QuizState =>
  ({ note: randomNote(mode), phase: 'ask', wrong: [], streak: 0, firstTry: 0, total: 0 });

/** Retry once, then reveal. A reveal waits for next(); nothing advances on its own after a miss. */
export function answer(s: QuizState, l: Letter): QuizState {
  if (s.phase !== 'ask' && s.phase !== 'retry') return s;
  if (l === s.note.letter) {
    const first = s.phase === 'ask';
    return { ...s, phase: 'right', total: s.total + 1,
      firstTry: s.firstTry + (first ? 1 : 0), streak: first ? s.streak + 1 : 0 };
  }
  if (s.phase === 'ask') return { ...s, phase: 'retry', wrong: [l] };
  return { ...s, phase: 'reveal', wrong: [...s.wrong, l], streak: 0, total: s.total + 1 };
}

export const next = (s: QuizState, mode: ClefMode): QuizState =>
  ({ ...s, note: randomNote(mode, s.note), phase: 'ask', wrong: [] });
