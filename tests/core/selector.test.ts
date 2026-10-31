import { expect, test } from 'vitest';
import { pitchLabel } from '../../src/core/pitch';
import { notePool } from '../../src/core/ranges';
import { pickNote } from '../../src/core/selector';

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
