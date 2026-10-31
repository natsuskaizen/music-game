// The on-screen piano input (design §3.2): every key is a pitch, so the octave always matches (design §14).
import Piano from '../components/Piano.svelte';
import type { InputMethod } from './types';

/** Tap a key on the on-screen piano. Always available: it's plain buttons. */
export const pianoInput: InputMethod = {
  id: 'piano',
  label: 'On-screen piano',
  isAvailable() {
    return true;
  },
  component: Piano,
};
