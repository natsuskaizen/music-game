// Renders tests/fixtures/piano/<midi>.wav for every note G1–F6 (M3-4): the nearest Salamander sample, pitch-shifted
// by up to a semitone, as the first 0.4 s of mono 16-bit 44.1 kHz audio (attack included, the hardest part to
// detect). Needs curl and ffmpeg. Rerun with `npm run piano-fixtures`; the output is committed.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { nearestSample } from '../../src/core/samples.ts';
import { fetchSalamander } from '../piano-samples/salamander.ts';

const OUT = 'tests/fixtures/piano';
const RATE = 44100;
const CLIP_S = 0.4;
const LOWEST = 31; // G1
const HIGHEST = 89; // F6

const work = mkdtempSync(join(tmpdir(), 'salamander-'));
mkdirSync(OUT, { recursive: true });
const sources = new Map<number, string>();
for (let midi = LOWEST; midi <= HIGHEST; midi++) {
  const base = nearestSample(midi);
  if (!sources.has(base)) sources.set(base, fetchSalamander(base, work));
  const speed = 2 ** ((midi - base) / 12);
  execFileSync('ffmpeg', [
    ...['-y', '-loglevel', 'error', '-i', sources.get(base) ?? '', '-ac', '1'],
    ...['-af', `aresample=${String(RATE)},asetrate=${String(RATE * speed)},aresample=${String(RATE)}`],
    ...['-t', String(CLIP_S), '-c:a', 'pcm_s16le', join(OUT, `${String(midi)}.wav`)],
  ]);
}
rmSync(work, { recursive: true });
