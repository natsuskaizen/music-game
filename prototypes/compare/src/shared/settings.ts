import { writable } from 'svelte/store';
import type { ClefMode } from './quiz';

export const settings = writable<{ clef: ClefMode; sound: boolean }>({ clef: 'treble', sound: true });
