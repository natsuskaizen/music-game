// Where the Salamander Grand Piano (CC-BY 3.0, Alexander Holm) samples live, shared by the sample and fixture builders.
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const SOURCE = 'https://raw.githubusercontent.com/tonejs/audio/master/salamander';
const NAMES: Record<number, string> = { 0: 'C', 3: 'Ds', 6: 'Fs', 9: 'A' };

/** Downloads the Salamander mp3 for a sample note (every third semitone) into `dir` and returns its path. */
export function fetchSalamander(midi: number, dir: string): string {
  const name = `${NAMES[midi % 12] ?? ''}${String(Math.floor(midi / 12) - 1)}`;
  const file = join(dir, `${name}.mp3`);
  execFileSync('curl', ['-fsS', '-o', file, `${SOURCE}/${name}.mp3`]);
  return file;
}
