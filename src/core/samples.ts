// Which piano sample plays a note, and by how much to bend it (design §4.1). Pure, so the math is unit-tested.

/** MIDI numbers of the recorded samples: every third semitone from F#1 to F#6, covering G1–F6. */
export const SAMPLE_MIDIS: readonly number[] = Array.from({ length: 21 }, (_, i) => 30 + i * 3);

/** The recorded sample closest to a note, so no note is bent by more than one semitone. */
export function nearestSample(midi: number): number {
  return SAMPLE_MIDIS.reduce((best, m) => (Math.abs(m - midi) < Math.abs(best - midi) ? m : best));
}

/** Cents to detune `sample` by so it sounds at `midi` (100 cents per semitone). */
export function detuneCents(midi: number, sample: number): number {
  return (midi - sample) * 100;
}
