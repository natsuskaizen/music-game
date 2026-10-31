// Piano playback (design §4.1): recorded samples every third semitone, detuned to the notes in between.
import { detuneCents, nearestSample, SAMPLE_MIDIS } from '../core/samples';
import { audioContext } from './context';
import { playTone } from './tone';

const VOLUME = 0.8;
const buffers = new Map<number, AudioBuffer>();
let loading: Promise<void> | undefined;

async function loadSample(ctx: AudioContext, midi: number): Promise<void> {
  const res = await fetch(`${import.meta.env.BASE_URL}audio/piano/${String(midi)}.m4a`);
  buffers.set(midi, await ctx.decodeAudioData(await res.arrayBuffer()));
}

/** Fetches and decodes every sample once (from the service worker's precache when offline); a failure retries on the next call. */
export function loadPiano(): Promise<void> {
  const ctx = audioContext();
  loading ??= Promise.all(SAMPLE_MIDIS.map((midi) => loadSample(ctx, midi))).then(
    () => undefined,
    () => {
      loading = undefined;
    },
  );
  return loading;
}

/** Plays a MIDI note on the piano; falls back to the synth tone while samples load. Call it from a tap handler so iOS lets audio start. */
export function playPitch(midi: number, volume = VOLUME): void {
  const ctx = audioContext();
  const sample = nearestSample(midi);
  const buffer = buffers.get(sample);
  if (!buffer) {
    void loadPiano();
    playTone(ctx, midi);
    return;
  }
  const source = new AudioBufferSourceNode(ctx, { buffer, detune: detuneCents(midi, sample) });
  source.connect(new GainNode(ctx, { gain: volume })).connect(ctx.destination);
  source.start();
}
