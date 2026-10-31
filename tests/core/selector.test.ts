import { describe, expect, test } from 'vitest';
import { pitchLabel, staffPos, type ClefNote } from '../../src/core/pitch';
import { notePool } from '../../src/core/ranges';
import {
  pickNote,
  pickStepwise,
  pickWeighted,
  weight,
  weightsFor,
  type PickContext,
  type Random,
  type WeightConfig,
} from '../../src/core/selector';
import { newStat, statKey, type NoteStat } from '../../src/core/stats';

/** Seeded generator so simulations are repeatable. */
function seeded(seed: number): Random {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32;
}

const pool = notePool('treble', 'easy'); // C4 D4 E4 F4 G4 A4 B4 C5
const label = (random: number, previous = pool[0]) =>
  pitchLabel(pickNote(pool, () => random, previous).pitch);

test('M2-AC2 picks uniformly across the pool, ends included', () => {
  expect(pitchLabel(pickNote(pool, () => 0).pitch)).toBe('C4');
  expect(pitchLabel(pickNote(pool, () => 0.5).pitch)).toBe('G4');
  expect(pitchLabel(pickNote(pool, () => 0.999999).pitch)).toBe('C5');
});

test('M2-AC2 never repeats the previous note', () => {
  expect(label(0)).toBe('D4');
  expect(label(0.999999, pool.at(-1))).toBe('B4');
});

test('M2-AC2 an empty pool is an error, not a silent undefined', () => {
  expect(() => pickNote([], () => 0)).toThrow('No notes');
});

describe('weighted pick', () => {
  const NOW = 1_000_000_000_000;
  const hardPool = notePool('treble', 'hard');
  const named = (label: string): ClefNote => {
    const found = hardPool.find((n) => pitchLabel(n.pitch) === label);
    if (!found) throw new Error(`${label} not in pool`);
    return found;
  };
  const onStaff = named('G4');
  const ledger3 = named('F6');
  const stat = (note: ClefNote, ewmaAcc: number): NoteStat => ({
    ...newStat(statKey(note)),
    attempts: 10,
    ewmaAcc,
    ewmaMs: 2500,
    lastSeen: NOW,
  });

  const context = (
    stats: Map<string, NoteStat>,
    cfg: WeightConfig,
    random: Random = seeded(7),
  ): PickContext => ({
    stats,
    cfg,
    now: NOW,
    random,
  });

  function counts(ctx: PickContext, picks = 1000) {
    const seen = new Map<string, number>();
    for (let i = 0; i < picks; i++) {
      const key = statKey(pickWeighted(hardPool, ctx));
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    return (note: ClefNote) => seen.get(statKey(note)) ?? 0;
  }

  test('M4-AC2 a note at 40% accuracy appears at least 3x as often as one at 95%', () => {
    const [weak, strong] = [onStaff, named('D5')];
    const stats = new Map(hardPool.map((n) => [statKey(n), stat(n, 0.95)]));
    stats.set(statKey(weak), stat(weak, 0.4));
    stats.set(statKey(strong), stat(strong, 0.95));
    const seen = counts(context(stats, weightsFor('medium')));
    expect(seen(weak)).toBeGreaterThanOrEqual(3 * seen(strong));
  });

  test('M4-AC3 on Hard a 3-ledger-line note appears at least 2x as often as an on-staff note', () => {
    const stats = new Map(hardPool.map((n) => [statKey(n), stat(n, 0.8)]));
    const seen = counts(context(stats, weightsFor('hard')));
    expect(seen(ledger3)).toBeGreaterThanOrEqual(2 * seen(onStaff));
  });

  test('M4-AC3 off Hard the ledger boost is zero', () => {
    expect(weightsFor('medium').ledgerBoost).toBe(0);
    expect(weightsFor('hard').ledgerBoost).toBeGreaterThan(0);
  });

  test('M4-AC2 an unseen note weighs double, and a mastered, on-time note weighs 1', () => {
    const cfg = weightsFor('easy');
    expect(weight(onStaff, undefined, context(new Map(), cfg))).toBe(2);
    expect(weight(onStaff, stat(onStaff, 1), context(new Map(), cfg))).toBe(1);
  });

  test('M4-AC2 staleness raises the weight by up to 50% after a week', () => {
    const cfg = weightsFor('easy');
    const s = stat(onStaff, 1);
    const ctx = context(new Map(), cfg);
    const fresh = weight(onStaff, s, ctx);
    expect(weight(onStaff, { ...s, lastSeen: NOW - 30 * 86_400_000 }, ctx)).toBeCloseTo(fresh * 1.5);
  });

  test('M4-AC2 never repeats the previous note, exploring or not', () => {
    const random = seeded(3);
    for (const exploration of [0, 1]) {
      const cfg = { ...weightsFor('easy'), exploration };
      for (let i = 0; i < 200; i++) {
        const next = pickWeighted(pool, context(new Map(), cfg, random), onStaff);
        expect(statKey(next)).not.toBe(statKey(onStaff));
      }
    }
  });

  test('M4-AC2 an empty pool is an error', () => {
    expect(() =>
      pickWeighted(
        [],
        context(new Map(), weightsFor('easy'), () => 0.9),
      ),
    ).toThrow('No notes');
  });
});

describe('stepwise ordering', () => {
  const mixed = notePool('both', 'medium');
  const random = seeded(11);
  const walk = (steps: number) => {
    let note = pickNote(mixed, () => 0);
    const moves: { from: ClefNote; to: ClefNote }[] = [];
    for (let i = 0; i < steps; i++) {
      const to = pickStepwise(mixed, random, note);
      moves.push({ from: note, to });
      note = to;
    }
    return moves;
  };
  const isStep = ({ from, to }: { from: ClefNote; to: ClefNote }) =>
    from.clef === to.clef && Math.abs(staffPos(to) - staffPos(from)) <= 3;

  test('M4-AC4 85–95% of moves are within a third', () => {
    const moves = walk(2000);
    const share = moves.filter(isStep).length / moves.length;
    expect(share).toBeGreaterThan(0.85);
    expect(share).toBeLessThan(0.95);
  });

  test('M4-AC4 jumps cover the other clef, the octave, and octave ± 1–2 steps', () => {
    const kinds = new Set<string>();
    for (const move of walk(3000).filter((m) => !isStep(m))) {
      const distance = Math.abs(staffPos(move.to) - staffPos(move.from));
      kinds.add(move.from.clef !== move.to.clef ? 'clef' : distance === 7 ? 'octave' : 'octave±');
    }
    expect([...kinds].sort()).toEqual(['clef', 'octave', 'octave±']);
  });

  test('M4-AC4 never repeats, and a single-note pool still answers', () => {
    expect(walk(500).every(({ from, to }) => statKey(from) !== statKey(to))).toBe(true);
    const two = pool.slice(0, 2);
    expect(pickStepwise(two, () => 0.5, two[0])).toBe(two[1]);
  });
});
