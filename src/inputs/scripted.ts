// e2e builds only (`vite build --mode e2e`): a headless input that a test drives with a `scripted-answer` event.
// The mic (M3) is the first real headless input; until then this lets e2e switch input mid-quiz (M2-AC8).
import type { Answer } from '../core/session';
import type { HeadlessInput } from './types';

/** The window event a test dispatches, with the answered MIDI number as `detail`. */
const EVENT = 'scripted-answer';

/** Like `scripted-answer`, but reports a note as heard (MIDI number, or null for silence) without answering. */
const HEARD_EVENT = 'scripted-heard';

/** Listens for the two events: answers are emitted, heard notes are reported; resolves to the stop function. */
function listen(
  emit: (answer: Answer) => void,
  heard: (midi: number | undefined) => void = () => undefined,
): Promise<() => void> {
  const onAnswer = (e: Event) => {
    if (e instanceof CustomEvent && typeof e.detail === 'number') emit({ kind: 'pitch', midi: e.detail });
  };
  const onHeard = (e: Event) => {
    if (e instanceof CustomEvent) heard(typeof e.detail === 'number' ? e.detail : undefined);
  };
  window.addEventListener(EVENT, onAnswer);
  window.addEventListener(HEARD_EVENT, onHeard);
  return Promise.resolve(() => {
    window.removeEventListener(EVENT, onAnswer);
    window.removeEventListener(HEARD_EVENT, onHeard);
  });
}

/** The scripted input: answers only when a test says so. */
export const scriptedInput: HeadlessInput = {
  id: 'scripted',
  label: 'Scripted (test)',
  listens: true, // stands in for the mic
  isAvailable() {
    return true;
  },
  start: listen,
};
