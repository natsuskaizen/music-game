import type { Answer } from '../../src/core/session';
import type { HeadlessInput } from '../../src/inputs/types';

/** A headless test input: `play(midi)` answers like a real piano would, once the quiz has started it. */
export function fakeInput(): HeadlessInput & { play: (midi: number) => void } {
  let emit: ((answer: Answer) => void) | undefined;
  return {
    id: 'fake',
    label: 'Fake',
    isAvailable: () => true,
    start: (e) => {
      emit = e;
      return Promise.resolve(() => {
        emit = undefined;
      });
    },
    play: (midi) => emit?.({ kind: 'pitch', midi }),
  };
}
