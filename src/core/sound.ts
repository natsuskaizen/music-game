// When a note plays (design §14): the sound settings and the one rule that turns a session change into a sound.
import { midiOf } from './pitch';
import { isSettled, type Session } from './session';

/** The sound group in Settings. `on` is the master switch; the correct note then always plays once the question settles. */
export interface SoundSettings {
  on: boolean;
  /** Also play the note when it appears. */
  onShow: boolean;
  /** Also play the correct note after the first miss. */
  onWrong: boolean;
  /** Loudness, one of `VOLUMES`. */
  volume: number;
  /** Play with the iPhone silent switch on. */
  ignoreSilentSwitch: boolean;
}

/** Quiet, medium and loud. */
export const VOLUMES = [0.4, 0.8, 1];

export const DEFAULT_SOUND: SoundSettings = {
  on: true,
  onShow: false,
  onWrong: false,
  volume: 0.8,
  ignoreSilentSwitch: true,
};

// Whether entering `phase` makes a sound: settling always does, the other two moments only when their toggle is on.
function soundsOn(phase: Session['phase'], sound: SoundSettings): boolean {
  if (isSettled(phase)) return true;
  return (phase === 'retry' && sound.onWrong) || (phase === 'ask' && sound.onShow);
}

/**
 * The MIDI note to play now that the session went from `before` (none at the start) to `after`, or undefined for silence.
 * Settling a question plays its note; a new question plays on show; a first miss plays on wrong.
 */
export function noteToPlay(
  before: Session | undefined,
  after: Session,
  sound: SoundSettings,
): number | undefined {
  const entered = after.phase !== before?.phase;
  return sound.on && entered && soundsOn(after.phase, sound) ? midiOf(after.note.pitch) : undefined;
}
