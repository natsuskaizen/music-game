// Note selection: uniform `pickNote` (M2) and the stats-weighted `pickWeighted` (M4; stepwise ordering joins in M4-3; design §7.3, §14).
import { ledgerPositions, staffPos, type ClefNote } from './pitch';
import type { Difficulty } from './ranges';
import { statKey, type NoteStat } from './stats';

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

/** Tunables of the weight function (design §7.3). */
export interface WeightConfig {
  /** Extra weight per ledger line: 0.6 makes a 3-line note about 2.8× an on-staff one. 0 outside Hard. */
  ledgerBoost: number;
  /** How much a miss adds: 3 makes a note at 40% accuracy about 4× one at 95%. */
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
  const staleness = 1 + 0.5 * Math.min((now - stat.lastSeen) / DAY_MS / 7, 1);
  return ledger * weakness * slowness * staleness;
}

/** A note picked by weight, never `previous`; with probability `exploration` it ignores stats and picks uniformly. */
export function pickWeighted(pool: ClefNote[], ctx: PickContext, previous?: ClefNote): ClefNote {
  const { stats, cfg, random } = ctx;
  if (random() < cfg.exploration) return pickNote(pool, random, previous);
  const options = previous ? pool.filter((note) => !sameNote(note, previous)) : pool;
  const weights = options.map((note) => weight(note, stats.get(statKey(note)), ctx));
  let target = random() * weights.reduce((sum, w) => sum + w, 0);
  const index = weights.findIndex((w) => (target -= w) < 0);
  const note = options[index === -1 ? options.length - 1 : index];
  if (!note) throw new Error('No notes to pick from');
  return note;
}
