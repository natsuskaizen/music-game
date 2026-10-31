// The sprint clock (design §14): one countdown for a whole session, pausable when the app is backgrounded.
// Pure: every function takes `now` (ms) so tests drive it with a fake clock.
import type { Difficulty } from './ranges';

/** Sprint length in seconds by difficulty. */
export const SPRINT_SECONDS: Record<Difficulty, number> = { easy: 60, medium: 50, hard: 40 };

/** A sprint: time used before the last pause, and when it last started running (null while paused). */
export interface SprintClock {
  lengthMs: number;
  usedMs: number;
  runningSince: number | null;
}

/** A running clock for `difficulty`, started at `now`. */
export function startSprint(difficulty: Difficulty, now: number): SprintClock {
  return { lengthMs: SPRINT_SECONDS[difficulty] * 1000, usedMs: 0, runningSince: now };
}

/** Milliseconds left, never below 0. */
export function remaining(clock: SprintClock, now: number): number {
  const running = clock.runningSince === null ? 0 : now - clock.runningSince;
  return Math.max(0, clock.lengthMs - clock.usedMs - running);
}

/** Stops the clock at `now` (the app went to the background). Pausing a paused clock changes nothing. */
export function pause(clock: SprintClock, now: number): SprintClock {
  if (clock.runningSince === null) return clock;
  return { ...clock, usedMs: clock.usedMs + now - clock.runningSince, runningSince: null };
}

/** Starts a paused clock again at `now`. Resuming a running clock changes nothing. */
export function resume(clock: SprintClock, now: number): SprintClock {
  return clock.runningSince === null ? { ...clock, runningSince: now } : clock;
}
