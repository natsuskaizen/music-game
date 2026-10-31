// Note selection: uniform `pickNote` (M2) and the stats-weighted `pickWeighted` (M4), both choosing among stepwise candidates (M4-3; design §7.3, §14).
import { ledgerPositions, staffPos, type ClefNote } from './pitch';
import type { Difficulty } from './ranges';
import { statKey, type NoteStat } from './stats';

/** A source of numbers in [0, 1), so tests can pick notes deterministically. */
export type Random = () => number;

const sameNote = (a: ClefNote, b: ClefNote) => a.clef === b.clef && staffPos(a) === staffPos(b);

const withoutPrevious = (pool: ClefNote[], previous?: ClefNote) =>
  previous ? pool.filter((note) => !sameNote(note, previous)) : pool;

/** A uniformly random note from `pool`, never `previous` again, so the staff always visibly changes. */
export function pickNote(pool: ClefNote[], random: Random, previous?: ClefNote): ClefNote {
  const options = withoutPrevious(pool, previous);
  const note = options[Math.floor(random() * options.length)];
  if (!note) throw new Error('No notes to pick from');
  return note;
}

/** Share of picks that jump instead of stepping (design §14). */
const JUMP_RATE = 0.1;
const MAX_STEP = 3;
const OCTAVE = 7;

type Move = (distance: number, sameClef: boolean) => boolean;

/** The three jump kinds: the other clef, an octave away, or an octave ± 1–2 steps (design §14). */
const JUMPS: Move[] = [
  (_distance, sameClef) => !sameClef,
  (distance, sameClef) => sameClef && distance === OCTAVE,
  (distance, sameClef) => sameClef && distance !== OCTAVE && Math.abs(distance - OCTAVE) <= 2,
];

const isStep: Move = (distance, sameClef) => sameClef && distance >= 1 && distance <= MAX_STEP;

/**
 * The notes that may follow `previous`: usually 1–3 steps away on the same clef, and about 10% of the time one
 * jump kind chosen at random. Falls back to the whole pool when nothing fits (design §14).
 */
function candidates(pool: ClefNote[], random: Random, previous?: ClefNote): ClefNote[] {
  if (!previous) return pool;
  const from = staffPos(previous);
  const near = (fits: Move) =>
    pool.filter((note) => fits(Math.abs(staffPos(note) - from), note.clef === previous.clef));
  if (random() < JUMP_RATE) {
    const jumps = JUMPS.map((jump) => near(jump)).filter((c) => c.length > 0);
    const chosen = jumps[Math.floor(random() * jumps.length)];
    if (chosen) return chosen;
  }
  const steps = near(isStep);
  return steps.length > 0 ? steps : pool;
}

/** Chooses the next note from a pool, given the one before it; the session takes one so it never knows how notes are chosen. */
export type Picker = (pool: ClefNote[], previous?: ClefNote) => ClefNote;

/** A picker for stepwise order only: uniform among `candidates`, never `previous` (design §14). */
export const stepwisePicker =
  (random: Random): Picker =>
  (pool, previous) =>
    pickNote(candidates(pool, random, previous), random, previous);

/** Tunables of the weight function (design §7.3). */
export interface WeightConfig {
  /** Extra weight per ledger line: 0.6 makes a 3-line note about 2.8× an on-staff one. 0 outside Hard. */
  ledgerBoost: number;
  /** How much a miss adds: 6 makes a note at 40% accuracy at least 3× one at 95%. */
  weaknessGain: number;
  /** "Fast enough" answer time in ms; slower notes weigh more. */
  targetMs: number;
  /** Share of picks that ignore stats, so strong notes never vanish. */
  exploration: number;
}

const DEFAULT_WEIGHTS: WeightConfig = {
  ledgerBoost: 0.6,
  weaknessGain: 6,
  targetMs: 2500,
  exploration: 0.15,
};

const DAY_MS = 86_400_000;
/** Staleness adds up to this share of weight once a note has gone unseen for `STALE_DAYS`. */
const STALE_BOOST = 0.5;
const STALE_DAYS = 7;

/** The weights for a difficulty: the ledger boost applies on Hard only (design §14). */
export function weightsFor(difficulty: Difficulty): WeightConfig {
  return difficulty === 'hard' ? DEFAULT_WEIGHTS : { ...DEFAULT_WEIGHTS, ledgerBoost: 0 };
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Everything a weighted pick depends on besides the pool; `now` and `random` are injected for tests. */
export interface PickContext {
  stats: ReadonlyMap<string, NoteStat>;
  cfg: WeightConfig;
  now: number;
  random: Random;
}

/** How much a note deserves to come up: ledger lines × weakness × slowness × staleness; unseen notes count double. */
export function weight(
  note: ClefNote,
  stat: NoteStat | undefined,
  { cfg, now }: Pick<PickContext, 'cfg' | 'now'>,
): number {
  const ledger = 1 + cfg.ledgerBoost * ledgerPositions(staffPos(note)).length;
  if (!stat || stat.attempts === 0) return ledger * 2;
  const weakness = 1 + cfg.weaknessGain * (1 - stat.ewmaAcc);
  const slowness = clamp(stat.ewmaMs / cfg.targetMs, 0.75, 2);
  const staleness = 1 + STALE_BOOST * Math.min((now - stat.lastSeen) / DAY_MS / STALE_DAYS, 1);
  return ledger * weakness * slowness * staleness;
}

/** A note picked by weight, never `previous`; with probability `exploration` it ignores stats and picks uniformly. */
export function pickWeighted(pool: ClefNote[], ctx: PickContext, previous?: ClefNote): ClefNote {
  const { stats, cfg, random } = ctx;
  if (random() < cfg.exploration) return pickNote(pool, random, previous);
  const options = withoutPrevious(pool, previous);
  const weights = options.map((note) => weight(note, stats.get(statKey(note)), ctx));
  let target = random() * weights.reduce((sum, w) => sum + w, 0);
  const index = weights.findIndex((w) => (target -= w) < 0);
  const note = options[index === -1 ? options.length - 1 : index];
  if (!note) throw new Error('No notes to pick from');
  return note;
}

/** The quiz's picker: weighted by `context()` among the stepwise `candidates`. `context` is read per pick so stats and time stay current. */
export const learnedPicker =
  (context: () => PickContext): Picker =>
  (pool, previous) => {
    const ctx = context();
    return pickWeighted(candidates(pool, ctx.random, previous), ctx, previous);
  };
