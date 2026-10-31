// The zero-asset fallback (design §4.1): a synthesized note, used until the piano samples have loaded.
import { hzOf } from '../core/pitch';

const PEAK = 0.4;
const ATTACK_S = 0.01;
const DECAY_S = 1.2;

/** Plays a MIDI note as a short decaying tone. */
export function playTone(out: AudioContext, midi: number): void {
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
