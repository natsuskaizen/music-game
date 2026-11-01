// The mic input (design §3.4, §4.4): listens to a real piano and emits each played note as a pitch answer.
import { PitchDetector } from 'pitchy';
import { audioContext, setRecording } from '../audio/context';
import {
  DETECTOR_FLOOR_DB,
  frameLevel,
  heardNote,
  initialListen,
  listenStep,
  loudEnough,
  type ListenState,
} from '../core/listen';
import type { Answer } from '../core/session';
import type { HeadlessInput, ListenHooks } from './types';

const FFT_SIZE = 4096; // ~85 ms at 48 kHz, enough for the lowest bass notes
const MIDI_RANGE = { lo: 21, hi: 108 }; // A0 to C8, the 88 keys

/** Raw audio, because echo cancellation, noise suppression and auto-gain all distort a piano's pitch. */
const RAW_AUDIO = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };

/** Asks for the mic under a recording audio session (iOS refuses capture otherwise), undoing it if refused. */
async function openMic(): Promise<MediaStream> {
  setRecording(true);
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: RAW_AUDIO });
  } catch (error) {
    setRecording(false);
    throw error;
  }
}

/** Reads the analyser's latest samples: their loudness, and the pitch frame when it is at least `minLevel` loud. */
function frameReader(analyser: AnalyserNode, sampleRate: number, minLevel: number) {
  const detector = PitchDetector.forFloat32Array(FFT_SIZE);
  detector.minVolumeDecibels = DETECTOR_FLOOR_DB;
  const samples = new Float32Array(FFT_SIZE);
  return () => {
    analyser.getFloatTimeDomainData(samples);
    const loudness = frameLevel(samples);
    const [hz, clarity] = detector.findPitch(samples, sampleRate);
    return { loudness, pitch: loudEnough({ hz, clarity }, loudness, minLevel) };
  };
}

/**
 * Opens the mic on the shared context and feeds each animation frame through the note filter.
 * The permission prompt appears here, so it only shows once the player picks this input.
 * Frames quieter than `minLevel` count as silence, so only a firmly played note answers.
 */
async function listen(
  emit: (answer: Answer) => void,
  { heard = () => undefined, level = () => undefined, minLevel = 0 }: ListenHooks = {},
): Promise<() => void> {
  const stream = await openMic();
  const ctx = audioContext();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  const source = ctx.createMediaStreamSource(stream);
  source.connect(analyser);

  const read = frameReader(analyser, ctx.sampleRate, minLevel);
  let state: ListenState = initialListen;
  let frame = 0;

  const onFrame = () => {
    const { loudness, pitch } = read();
    level(loudness);
    heard(heardNote(pitch));
    const step = listenStep(state, pitch);
    state = step.state;
    if (step.note !== undefined && step.note >= MIDI_RANGE.lo && step.note <= MIDI_RANGE.hi)
      emit({ kind: 'pitch', midi: step.note });
    frame = requestAnimationFrame(onFrame);
  };
  frame = requestAnimationFrame(onFrame);

  return () => {
    cancelAnimationFrame(frame);
    heard(undefined);
    level(0);
    setRecording(false);
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
  listens: true,
  isAvailable() {
    // `mediaDevices` is missing on insecure pages, though the DOM types say it never is.
    const devices = navigator.mediaDevices as MediaDevices | undefined;
    return typeof devices?.getUserMedia === 'function';
  },
  start: listen,
};
