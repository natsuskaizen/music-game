import { readFileSync } from 'node:fs';
import { PitchDetector } from 'pitchy';
import { describe, expect, test } from 'vitest';
import {
  DETECTOR_FLOOR_DB,
  frameLevel,
  initialListen,
  listenStep,
  loudEnough,
  MIC_LEVELS,
  type ListenState,
} from '../../src/core/listen';

const LOWEST = 31; // G1
const HIGHEST = 89; // F6
const C2 = 36;
const RATE = 44100;
const FFT_SIZE = 4096; // the analyser size in design §4.4
const HOP = 735; // one animation frame at 60 fps

/** The samples of a mono 16-bit WAV, scaled to −1…1 (finds the `data` chunk, so extra header chunks are fine). */
function readWav(path: string): Float32Array {
  const bytes = readFileSync(path);
  const start = bytes.indexOf('data') + 8;
  const pcm = new Int16Array(bytes.buffer.slice(bytes.byteOffset + start, bytes.byteOffset + bytes.length));
  return Float32Array.from(pcm, (v) => v / 32768);
}

/** The first note the mic filter reports while the detector slides over the recording. */
function firstHeard(audio: Float32Array, minLevel = 0): number | undefined {
  const detector = PitchDetector.forFloat32Array(FFT_SIZE);
  detector.minVolumeDecibels = DETECTOR_FLOOR_DB;
  let state: ListenState = initialListen;
  for (let at = 0; at + FFT_SIZE <= audio.length; at += HOP) {
    const window = audio.subarray(at, at + FFT_SIZE);
    const [hz, clarity] = detector.findPitch(window, RATE);
    const out = listenStep(state, loudEnough({ hz, clarity }, frameLevel(window), minLevel));
    state = out.state;
    if (out.note !== undefined) return out.note;
  }
  return undefined;
}

describe('detection on recorded piano', () => {
  const results = Array.from({ length: HIGHEST - LOWEST + 1 }, (_, i) => {
    const midi = LOWEST + i;
    return { midi, heard: firstHeard(readWav(`tests/fixtures/piano/${String(midi)}.wav`)) };
  });
  const share = (hits: (r: (typeof results)[number]) => boolean, from = LOWEST): number => {
    const pool = results.filter((r) => r.midi >= from);
    return pool.filter(hits).length / pool.length;
  };

  test('M3-AC5 at least 95% of notes G1–F6 are heard with the right letter', () => {
    const rate = share((r) => r.heard !== undefined && r.heard % 12 === r.midi % 12);
    expect(rate).toBeGreaterThanOrEqual(0.95);
  });

  test('M3-AC5 at least 90% of notes from C2 up are heard in the right octave', () => {
    const rate = share((r) => r.heard === r.midi, C2);
    expect(rate).toBeGreaterThanOrEqual(0.9);
  });
});

describe('detection of quiet piano', () => {
  /** A fixture turned down to `level` on the meter scale (0..1), like a softly played note. */
  function quiet(midi: number, level: number): Float32Array {
    const audio = readWav(`tests/fixtures/piano/${String(midi)}.wav`);
    const peak = Math.max(
      ...Array.from({ length: Math.floor((audio.length - FFT_SIZE) / HOP) + 1 }, (_, i) =>
        frameLevel(audio.subarray(i * HOP, i * HOP + FFT_SIZE)),
      ),
    );
    const gain = 10 ** (((level - peak) * 50) / 20);
    return audio.map((v) => v * gain);
  }
  const NOTES = [48, 55, 60, 64, 67, 72, 76, 79];

  test('M10-AC5 a quiet piano (level 0.2) is heard on Soft and not on the old Soft', () => {
    const soft = MIC_LEVELS[0] ?? 0;
    for (const midi of NOTES) {
      expect(firstHeard(quiet(midi, 0.2), soft)).toBe(midi);
      expect(firstHeard(quiet(midi, 0.2), 0.35)).toBeUndefined();
    }
  });
});
