// The contract every answer input implements (design §3.4). The quiz only sees the `Answer`s an input emits,
// so adding an input never changes `src/core/`.
import type { Component } from 'svelte';
import type { Answer } from '../core/session';
import type { ClefMode } from '../core/staff-layout';

/** How a key is marked after an answer: a miss, or the correct note once it's settled. */
export type KeyMark = 'right' | 'wrong' | 'heard';

/** What the quiz hands an on-screen input: the clef setting (for its range), marks to show, and where answers go. */
export interface InputProps {
  mode: ClefMode;
  marks: Map<number, KeyMark>;
  emit: (answer: Answer) => void;
}

/** What every input has: its settings id, the label people see, and a feature check. */
interface InputBase {
  /** Stored in settings, e.g. 'piano'. */
  id: string;
  /** Shown in Settings and the quiz switcher. */
  label: string;
  /** Feature check, e.g. the mic needs getUserMedia. Unavailable inputs are hidden. */
  isAvailable: () => boolean;
  /** The quiz's question when the input doesn't use the keyboard, e.g. "Write this note's letter." */
  ask?: string;
}

/** An input drawn on screen, e.g. the piano: the quiz renders its component. */
export interface OnScreenInput extends InputBase {
  component: Component<InputProps>;
}

/**
 * What a headless input reports besides answers, and how loud a sound must be to count.
 * `heard` is the note sounding right now (`undefined` for none), so the keyboard and staff can show it;
 * `level` is the loudness 0..1 each frame, so the screen can show the mic is working;
 * sounds quieter than `minLevel` (same scale, a setting) are ignored.
 */
export interface ListenHooks {
  heard?: (midi: number | undefined) => void;
  level?: (level: number) => void;
  minLevel?: number;
}

/** An input with no UI, e.g. the mic: it starts listening and resolves to a stop function. */
export interface HeadlessInput extends InputBase {
  /** True when it listens to the room, so the app must not play notes (design §4.3). */
  listens?: boolean;
  start: (emit: (answer: Answer) => void, hooks?: ListenHooks) => Promise<() => void>;
}

/** One answer input, on screen or headless, so it can't be both or neither. */
export type InputMethod = OnScreenInput | HeadlessInput;
