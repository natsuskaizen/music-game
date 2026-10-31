// The contract every answer input implements (design §3.4). The quiz only sees the `Answer`s an input emits,
// so adding an input never changes `src/core/`.
import type { Component } from 'svelte';
import type { Answer } from '../core/session';
import type { ClefMode } from '../core/staff-layout';

/** How a key is marked after an answer: a miss, or the correct note once it's settled. */
export type KeyMark = 'right' | 'wrong';

/** What the quiz hands an on-screen input: the clef setting (for its range), marks to show, and where answers go. */
export interface InputProps {
  mode: ClefMode;
  marks: Map<number, KeyMark>;
  emit: (answer: Answer) => void;
}

/** One answer input. It answers through its `component` (on screen) or through `start` (headless, e.g. the mic). */
export interface InputMethod {
  /** Stored in settings, e.g. 'piano'. */
  id: string;
  /** Shown in Settings and the quiz switcher. */
  label: string;
  /** Feature check, e.g. the mic needs getUserMedia. Unavailable inputs are hidden. */
  isAvailable: () => boolean;
  component: Component<InputProps> | null;
  /** Headless inputs start listening here and resolve to a stop function. */
  start?: (emit: (answer: Answer) => void) => Promise<() => void>;
}
