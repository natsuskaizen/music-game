// The answer tone: a synthesized note (design §4.1 zero-asset fallback) through one shared AudioContext.
// M3 swaps in piano samples; the silent-switch handling stays the same (design §4.2).
import { hzOf } from '../core/pitch';

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

const session = (navigator as AudioSessionNavigator).audioSession;
const PEAK = 0.4;
const ATTACK_S = 0.01;
const DECAY_S = 1.2;

let ctx: AudioContext | undefined;

/** True on a touch device that can't opt out of the silent switch, where iOS may mute the tone. */
export function needsRingerHint(): boolean {
  return !session && navigator.maxTouchPoints > 0;
}

// Made on the first tap, since iOS keeps audio locked until a user gesture. A 'playback' session plays
// with the silent switch on; resuming covers a context iOS suspended or interrupted in the background.
function audio(): AudioContext {
  if (!ctx) {
    if (session) session.type = 'playback';
    ctx = new AudioContext();
  }
  if (ctx.state !== 'running') ctx.resume().catch(() => undefined);
  return ctx;
}

/** Plays a MIDI note as a short decaying tone. Call it from a tap handler so iOS lets audio start. */
export function playTone(midi: number): void {
  const out = audio();
  const now = out.currentTime;
  const osc = out.createOscillator();
  const gain = out.createGain();
  osc.type = 'triangle';
  osc.frequency.value = hzOf(midi);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(PEAK, now + ATTACK_S);
  gain.gain.exponentialRampToValueAtTime(0.001, now + DECAY_S);
  osc.connect(gain).connect(out.destination);
  osc.start(now);
  osc.stop(now + DECAY_S);
}
