// Turns raw pitch-detector frames into note answers for the mic input (design §4.4). Pure, so it is unit-tested without audio.

/** Tuning for the mic filter; the defaults are the design §4.4 values. */
export interface ListenConfig {
  /** Frames a note must hold before it counts. */
  stableFrames: number;
  /** Detector clarity needed for a frame to count. */
  minClarity: number;
  /** How far from a semitone a frequency may be and still count as that note. */
  toleranceCents: number;
  /** Silent or unclear frames in a row that let the same note fire again. */
  silenceFrames: number;
}

const DEFAULT_LISTEN: ListenConfig = {
  stableFrames: 4,
  minClarity: 0.9,
  toleranceCents: 30,
  silenceFrames: 3,
};

/** One analysis frame from the pitch detector. */
export interface PitchFrame {
  hz: number;
  clarity: number;
}

/** What the filter remembers between frames. */
export interface ListenState {
  /** Valid MIDI notes of the latest frames (`undefined` = no clear note), newest last. */
  recent: (number | undefined)[];
  /** The note already reported, until silence or a different note frees it. */
  fired?: number;
}

export const initialListen: ListenState = { recent: [] };

/** The MIDI note a frequency is within `toleranceCents` of, or `undefined` when it falls between notes. */
export function hzToMidi(hz: number, toleranceCents = DEFAULT_LISTEN.toleranceCents): number | undefined {
  if (!(hz > 0)) return undefined;
  const exact = 69 + 12 * Math.log2(hz / 440);
  const midi = Math.round(exact);
  return Math.abs(exact - midi) * 100 <= toleranceCents ? midi : undefined;
}

function mostCommon(values: number[]): number {
  const counts = new Map<number, number>();
  values.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  return [...counts].reduce((best, entry) => (entry[1] > best[1] ? entry : best))[0];
}

/** The note held by the whole window: all frames share a letter; the octave is a majority vote (overtones cause octave slips). */
function heldNote(window: (number | undefined)[]): number | undefined {
  const notes = window.filter((m): m is number => m !== undefined);
  const letter = notes[0] === undefined ? undefined : notes[0] % 12;
  return notes.length === window.length && notes.every((m) => m % 12 === letter)
    ? mostCommon(notes)
    : undefined;
}

function trailingGaps(recent: (number | undefined)[]): number {
  const lastNote = recent.findLastIndex((m) => m !== undefined);
  return recent.length - 1 - lastNote;
}

/** Feeds one frame in; returns the next state and the note to report, if this frame completed a new one. */
export function listenStep(
  state: ListenState,
  frame: PitchFrame | undefined,
  config: ListenConfig = DEFAULT_LISTEN,
): { state: ListenState; note?: number } {
  const clear = frame !== undefined && frame.clarity > config.minClarity;
  const midi = clear ? hzToMidi(frame.hz, config.toleranceCents) : undefined;
  const recent = [...state.recent, midi].slice(-Math.max(config.stableFrames, config.silenceFrames));
  const fired = trailingGaps(recent) >= config.silenceFrames ? undefined : state.fired;
  const held = heldNote(recent.slice(-config.stableFrames));
  if (recent.length < config.stableFrames || held === undefined || held === fired)
    return { state: { recent, fired } };
  return { state: { recent, fired: held }, note: held };
}
