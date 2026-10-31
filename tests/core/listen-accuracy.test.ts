import { readFileSync } from 'node:fs';
import { PitchDetector } from 'pitchy';
import { describe, expect, test } from 'vitest';
import { initialListen, listenStep, type ListenState } from '../../src/core/listen';

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
function firstHeard(audio: Float32Array): number | undefined {
  const detector = PitchDetector.forFloat32Array(FFT_SIZE);
  let state: ListenState = initialListen;
  for (let at = 0; at + FFT_SIZE <= audio.length; at += HOP) {
    const [hz, clarity] = detector.findPitch(audio.subarray(at, at + FFT_SIZE), RATE);
    const out = listenStep(state, { hz, clarity });
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
