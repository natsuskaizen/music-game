// The handwriting input (design §3.4, M9-6): write the note's letter on a pad, answered as a letter (no octave).
import HandwritingPad from '../components/HandwritingPad.svelte';
import type { OnScreenInput } from './types';

/** Write the letter with a finger. Always available: it's an SVG with pointer events. */
export const handwritingInput: OnScreenInput = {
  id: 'handwriting',
  label: 'Write the letter',
  ask: "Write this note's letter.",
  isAvailable() {
    return true;
  },
  component: HandwritingPad,
};
