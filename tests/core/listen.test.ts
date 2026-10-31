import { describe, expect, test } from 'vitest';
import { hzOf } from '../../src/core/pitch';
import {
  frameLevel,
  heardNote,
  initialListen,
  hzToMidi,
  listenStep,
  type ListenState,
  type PitchFrame,
} from '../../src/core/listen';

const LOWEST = 31; // G1
const HIGHEST = 89; // F6
const clear = (midi: number, cents = 0): PitchFrame => ({ hz: hzOf(midi + cents / 100), clarity: 0.97 });
const blur: PitchFrame = { hz: 440, clarity: 0.4 };

/** Runs frames through the filter and returns every note it reported. */
function heard(frames: (PitchFrame | undefined)[]): number[] {
  let state: ListenState = initialListen;
  const notes: number[] = [];
  frames.forEach((frame) => {
    const out = listenStep(state, frame);
    state = out.state;
    if (out.note !== undefined) notes.push(out.note);
  });
  return notes;
}

describe('Hz to note', () => {
  test('M3-AC3 every note G1–F6 maps back from its own frequency', () => {
    for (let m = LOWEST; m <= HIGHEST; m++) expect(hzToMidi(hzOf(m))).toBe(m);
  });

  test('M3-AC3 ±30 cents still counts as the note, 31 does not', () => {
    expect(hzToMidi(hzOf(60 + 0.3))).toBe(60);
    expect(hzToMidi(hzOf(60 - 0.3))).toBe(60);
    expect(hzToMidi(hzOf(60.31))).toBeUndefined();
    expect(hzToMidi(hzOf(59.69))).toBeUndefined();
  });

  test('M3-AC3 a non-positive frequency is not a note', () => {
    expect(hzToMidi(0)).toBeUndefined();
    expect(hzToMidi(NaN)).toBeUndefined();
  });
});

describe('stability filter', () => {
  test('M3-AC4 a held note is reported once, after four frames', () => {
    expect(heard([clear(60), clear(60), clear(60)])).toEqual([]);
    expect(heard(Array.from({ length: 12 }, () => clear(60)))).toEqual([60]);
  });

  test('M3-AC4 a single-frame blip is rejected', () => {
    expect(heard([clear(60), clear(60), clear(64), clear(60), clear(60), clear(60)])).toEqual([]);
  });

  test('M3-AC4 low clarity frames never count', () => {
    expect(heard(Array.from({ length: 10 }, () => blur))).toEqual([]);
  });

  test('M3-AC4 slightly sharp frames within tolerance still hold the note', () => {
    expect(heard([clear(67, 20), clear(67, -25), clear(67, 10), clear(67)])).toEqual([67]);
  });

  test('M3-AC4 an octave slip on one frame is out-voted', () => {
    expect(heard([clear(48), clear(48), clear(60), clear(48), clear(48), clear(48)])).toEqual([48]);
    expect(heard([clear(60), clear(48), clear(60), clear(60)])).toEqual([60]);
  });

  test('M3-AC4 the same note fires again only after silence', () => {
    const hold = Array.from({ length: 6 }, () => clear(60));
    expect(heard([...hold, ...hold])).toEqual([60]);
    expect(heard([...hold, undefined, undefined, undefined, ...hold])).toEqual([60, 60]);
    expect(heard([...hold, blur, blur, blur, ...hold])).toEqual([60, 60]);
  });

  test('M3-AC4 a different note fires without silence', () => {
    const hold = (m: number) => Array.from({ length: 5 }, () => clear(m));
    expect(heard([...hold(60), ...hold(62)])).toEqual([60, 62]);
  });
});

describe('heard note', () => {
  test('M3-AC8 a clear frame is the note it sounds like, an unclear or missing one is nothing', () => {
    expect(heardNote({ hz: hzOf(60), clarity: 0.95 })).toBe(60);
    expect(heardNote({ hz: hzOf(60), clarity: 0.5 })).toBeUndefined();
    expect(heardNote(undefined)).toBeUndefined();
  });
});

describe('M3-AC9 mic level meter', () => {
  const frame = (amp: number) => new Float32Array(1024).fill(amp);

  test('M3-AC9 silence reads 0 and a loud frame reads 1', () => {
    expect(frameLevel(frame(0))).toBe(0);
    expect(frameLevel(frame(0.9))).toBe(1);
  });

  test('M3-AC9 a louder frame reads higher than a quieter one', () => {
    expect(frameLevel(frame(0.1))).toBeGreaterThan(frameLevel(frame(0.01)));
  });
});
