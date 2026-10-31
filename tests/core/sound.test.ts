import { describe, expect, test } from 'vitest';
import { midiOf } from '../../src/core/pitch';
import { notePool } from '../../src/core/ranges';
import { reduce, startSession, type Session } from '../../src/core/session';
import { DEFAULT_SOUND, noteToPlay, type SoundSettings } from '../../src/core/sound';

import { stepwisePicker } from '../../src/core/selector';

const first = stepwisePicker(() => 0);
const ask = startSession(notePool('treble', 'medium'), 20, first);
const target = midiOf(ask.note.pitch);
const press = (s: Session, midi: number) =>
  reduce(s, { type: 'answer', answer: { kind: 'pitch', midi } }, first);
const next = (s: Session) => reduce(s, { type: 'next' }, first);
const sound = (over: Partial<SoundSettings> = {}): SoundSettings => ({ ...DEFAULT_SOUND, ...over });
const retry = press(ask, target + 1);
const right = press(ask, target);
const reveal = press(retry, target + 2);

describe('noteToPlay', () => {
  test('M3-AC2 by default a settled question plays its note and nothing else does', () => {
    expect(noteToPlay(ask, right, sound())).toBe(target);
    expect(noteToPlay(retry, press(retry, target), sound())).toBe(target);
    expect(noteToPlay(retry, reveal, sound())).toBe(target);
    expect(noteToPlay(ask, retry, sound())).toBeUndefined();
    expect(noteToPlay(undefined, ask, sound())).toBeUndefined();
    expect(noteToPlay(right, next(right), sound())).toBeUndefined();
  });

  test('M3-AC2 taps after a reveal do not replay the note', () => {
    expect(noteToPlay(reveal, press(reveal, target), sound())).toBeUndefined();
  });

  test('M3-AC2 "when the note appears" plays at the start, on the next question and on Play again', () => {
    const on = sound({ onShow: true });
    expect(noteToPlay(undefined, ask, on)).toBe(target);
    expect(noteToPlay(right, next(right), on)).toBe(midiOf(next(right).note.pitch));
    expect(noteToPlay(ask, retry, on)).toBeUndefined();
    const done: Session = { ...right, phase: 'done' };
    expect(noteToPlay(done, ask, on)).toBe(target);
  });

  test('M3-AC2 "after a wrong try" plays the correct note after the first miss only', () => {
    const on = sound({ onWrong: true });
    expect(noteToPlay(ask, retry, on)).toBe(target);
    expect(noteToPlay(retry, reveal, on)).toBe(target);
    expect(noteToPlay(ask, right, on)).toBe(target);
  });

  test('M3-AC2 the master switch off plays nothing, whatever the other toggles say', () => {
    const off = sound({ on: false, onShow: true, onWrong: true });
    for (const [before, after] of [
      [undefined, ask],
      [ask, right],
      [ask, retry],
      [retry, reveal],
    ] as const)
      expect(noteToPlay(before, after, off)).toBeUndefined();
  });
});
