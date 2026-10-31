import { get } from 'svelte/store';
import { settings } from './settings';
import { hz, type Note } from './quiz';

let ctx: AudioContext | null = null;

/** One AudioContext for both playback and mic listening. */
export function audioCtx() {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Simple plucked tone. The real app would use piano samples (design §4). */
export function playNote(n: Note) {
  if (!get(settings).sound) return;
  const ctx = audioCtx();
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = hz(n);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.35, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 1.5);
}
