// The mic input (design §3.4, §4.4): listens to a real piano and emits each played note as a pitch answer.
import { PitchDetector } from 'pitchy';
import { audioContext } from '../audio/context';
import { initialListen, listenStep, type ListenState } from '../core/listen';
import type { Answer } from '../core/session';
import type { HeadlessInput } from './types';

const FFT_SIZE = 4096; // ~85 ms at 48 kHz, enough for the lowest bass notes
const MIN_VOLUME_DB = -45; // quieter frames count as silence
const MIDI_RANGE = { lo: 21, hi: 108 }; // A0 to C8, the 88 keys

/** Raw audio, because echo cancellation, noise suppression and auto-gain all distort a piano's pitch. */
const RAW_AUDIO = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };

/**
 * Opens the mic on the shared context and feeds each animation frame through the note filter.
 * The permission prompt appears here, so it only shows once the player picks this input.
 */
async function listen(emit: (answer: Answer) => void): Promise<() => void> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: RAW_AUDIO });
  const ctx = audioContext();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  const source = ctx.createMediaStreamSource(stream);
  source.connect(analyser);

  const detector = PitchDetector.forFloat32Array(FFT_SIZE);
  detector.minVolumeDecibels = MIN_VOLUME_DB;
  const samples = new Float32Array(FFT_SIZE);
  let state: ListenState = initialListen;
  let frame = 0;

  const onFrame = () => {
    analyser.getFloatTimeDomainData(samples);
    const [hz, clarity] = detector.findPitch(samples, ctx.sampleRate);
    const step = listenStep(state, { hz, clarity });
    state = step.state;
    if (step.note !== undefined && step.note >= MIDI_RANGE.lo && step.note <= MIDI_RANGE.hi)
      emit({ kind: 'pitch', midi: step.note });
    frame = requestAnimationFrame(onFrame);
  };
  frame = requestAnimationFrame(onFrame);

  return () => {
    cancelAnimationFrame(frame);
    source.disconnect();
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  };
}

/** Answer by playing the note on a real piano. Needs a mic API, so it's hidden where there isn't one. */
export const micInput: HeadlessInput = {
  id: 'mic',
  label: 'Real piano (mic)',
  isAvailable() {
    // `mediaDevices` is missing on insecure pages, though the DOM types say it never is.
    const devices = navigator.mediaDevices as MediaDevices | undefined;
    return typeof devices?.getUserMedia === 'function';
  },
  start: listen,
};
