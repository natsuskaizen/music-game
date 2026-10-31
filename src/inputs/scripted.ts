// e2e builds only (`vite build --mode e2e`): a headless input that a test drives with a `scripted-answer` event.
// The mic (M3) is the first real headless input; until then this lets e2e switch input mid-quiz (M2-AC8).
import type { Answer } from '../core/session';
import type { HeadlessInput } from './types';

/** The window event a test dispatches, with the answered MIDI number as `detail`. */
const EVENT = 'scripted-answer';

/** Listens for `scripted-answer` events and emits each one's MIDI number; resolves to the stop function. */
function listen(emit: (answer: Answer) => void): Promise<() => void> {
  const onEvent = (e: Event) => {
    if (e instanceof CustomEvent && typeof e.detail === 'number') emit({ kind: 'pitch', midi: e.detail });
  };
  window.addEventListener(EVENT, onEvent);
  return Promise.resolve(() => {
    window.removeEventListener(EVENT, onEvent);
  });
}

/** The scripted input: answers only when a test says so. */
export const scriptedInput: HeadlessInput = {
  id: 'scripted',
  label: 'Scripted (test)',
  isAvailable() {
    return true;
  },
  start: listen,
};
