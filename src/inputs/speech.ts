// The speech input (design §3.4, M9-5): say the note's letter ("see", "bee") and it answers as a letter.
// Uses the browser's recognizer (`webkitSpeechRecognition` in Safari), which runs on the device where iOS allows it.
import { lettersIn } from '../core/speech';
import type { Answer } from '../core/session';
import type { HeadlessInput } from './types';

/** The part of the Web Speech API this input uses; TypeScript's DOM types leave the recognizer out. */
interface Recognizer {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: { resultIndex: number; results: SpeechRecognitionResultList }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
}

/** Errors that won't clear by listening again: no permission, or no recognizer service. */
const FATAL_ERRORS = new Set(['not-allowed', 'service-not-allowed', 'language-not-supported']);

/** The recognizer class, prefixed in Safari, or `undefined` where the browser has none. */
function recognizerClass(): (new () => Recognizer) | undefined {
  const scope = globalThis as {
    SpeechRecognition?: new () => Recognizer;
    webkitSpeechRecognition?: new () => Recognizer;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
}

/**
 * Listens until stopped and emits each new letter as soon as it's heard, from interim results too, for speed.
 * Recognizers revise and grow a result as speech goes on, so each result only emits letters past those it already did.
 * iOS ends a session after a pause, so it starts again until stopped. Resolves once listening has started,
 * and rejects if permission is refused, so the quiz can say so.
 */
function listen(emit: (answer: Answer) => void): Promise<() => void> {
  const Recognition = recognizerClass();
  if (!Recognition) return Promise.reject(new Error('Speech recognition is unavailable'));
  const recognizer = new Recognition();
  recognizer.continuous = true;
  recognizer.interimResults = true;
  recognizer.lang = 'en-US';

  let active = true;
  let emitted: number[] = []; // letters already emitted, per result index of this session
  const stop = () => {
    active = false;
    recognizer.abort();
  };

  recognizer.onresult = ({ resultIndex, results }) => {
    for (let i = resultIndex; i < results.length; i++) {
      const letters = lettersIn(results[i]?.[0]?.transcript ?? '');
      letters.slice(emitted[i] ?? 0).forEach((letter) => {
        emit({ kind: 'letter', letter });
      });
      emitted[i] = Math.max(emitted[i] ?? 0, letters.length);
    }
  };
  recognizer.onend = () => {
    emitted = [];
    if (active) recognizer.start();
  };

  return new Promise((resolve, reject) => {
    recognizer.onstart = () => {
      resolve(stop);
    };
    recognizer.onerror = ({ error }) => {
      if (!FATAL_ERRORS.has(error)) return;
      stop();
      reject(new Error(`Speech recognition failed: ${error}`));
    };
    recognizer.start();
  });
}

/** Answer by saying the letter. Hidden where the browser has no speech recognizer. */
export const speechInput: HeadlessInput = {
  id: 'speech',
  label: 'Say the letter',
  ask: "Say this note's letter.",
  isAvailable() {
    return recognizerClass() !== undefined;
  },
  start: listen,
};
