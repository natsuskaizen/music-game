// Builds public/audio/piano/<midi>.m4a from the Salamander Grand Piano (CC-BY 3.0, Alexander Holm) as hosted in
// the Tone.js audio repo: each sample trimmed to 1.5 s with a short fade-out, encoded as AAC. Needs curl and
// ffmpeg. Rerun with `npm run piano-samples`; the output is committed so the app never fetches it from there.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SAMPLE_MIDIS } from '../../src/core/samples.ts';

const SOURCE = 'https://raw.githubusercontent.com/tonejs/audio/master/salamander';
const OUT = 'public/audio/piano';
const CLIP_S = 1.5;
const FADE_S = 0.3;
const NAMES: Record<number, string> = { 0: 'C', 3: 'Ds', 6: 'Fs', 9: 'A' };

function sourceName(midi: number): string {
  return `${NAMES[midi % 12] ?? ''}${String(Math.floor(midi / 12) - 1)}`;
}

const work = mkdtempSync(join(tmpdir(), 'salamander-'));
mkdirSync(OUT, { recursive: true });
for (const midi of SAMPLE_MIDIS) {
  const src = join(work, `${sourceName(midi)}.mp3`);
  execFileSync('curl', ['-fsS', '-o', src, `${SOURCE}/${sourceName(midi)}.mp3`]);
  execFileSync('ffmpeg', [
    ...['-y', '-loglevel', 'error', '-i', src, '-t', String(CLIP_S)],
    ...['-af', `afade=t=out:st=${String(CLIP_S - FADE_S)}:d=${String(FADE_S)}`],
    ...['-ac', '1', '-c:a', 'aac', '-b:a', '64k', join(OUT, `${String(midi)}.m4a`)],
  ]);
}
rmSync(work, { recursive: true });
