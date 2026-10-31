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
}

/** An input drawn on screen, e.g. the piano: the quiz renders its component. */
export interface OnScreenInput extends InputBase {
  component: Component<InputProps>;
}

/**
 * An input with no UI, e.g. the mic: it starts listening and resolves to a stop function.
 * `heard` reports the note sounding right now (`undefined` for none), so the keyboard can show it;
 * `level` reports the loudness 0..1 each frame, so the screen can show that the mic is working.
 */
export interface HeadlessInput extends InputBase {
  /** True when it listens to the room, so the app must not play notes (design §4.3). */
  listens?: boolean;
  start: (
    emit: (answer: Answer) => void,
    heard?: (midi: number | undefined) => void,
    level?: (level: number) => void,
  ) => Promise<() => void>;
}

/** One answer input, on screen or headless, so it can't be both or neither. */
export type InputMethod = OnScreenInput | HeadlessInput;
