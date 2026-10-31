import { describe, expect, test } from 'vitest';
import { detuneCents, nearestSample, SAMPLE_MIDIS } from '../../src/core/samples';

const LOWEST = 31; // G1
const HIGHEST = 89; // F6

describe('piano sample math', () => {
  test('M3-AC1 samples sit every third semitone and cover G1–F6', () => {
    expect(SAMPLE_MIDIS).toHaveLength(21);
    expect(SAMPLE_MIDIS.at(0)).toBeLessThanOrEqual(LOWEST);
    expect(SAMPLE_MIDIS.at(-1)).toBeGreaterThanOrEqual(HIGHEST);
    SAMPLE_MIDIS.slice(1).forEach((m, i) => {
      expect(m - (SAMPLE_MIDIS[i] ?? 0)).toBe(3);
    });
  });

  test('M3-AC1 a sampled note is played unbent', () => {
    expect(nearestSample(60)).toBe(60);
    expect(detuneCents(60, 60)).toBe(0);
  });

  test('M3-AC1 every note in G1–F6 bends its nearest sample by at most one semitone', () => {
    for (let midi = LOWEST; midi <= HIGHEST; midi++) {
      const sample = nearestSample(midi);
      expect(SAMPLE_MIDIS).toContain(sample);
      expect(Math.abs(detuneCents(midi, sample))).toBeLessThanOrEqual(100);
    }
  });

  test('M3-AC1 detune is signed: down from a higher sample, up from a lower one', () => {
    expect(detuneCents(61, 60)).toBe(100);
    expect(detuneCents(59, 60)).toBe(-100);
  });
});
