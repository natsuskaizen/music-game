// @vitest-environment happy-dom
// The input contract suite (design §3.4): every registered input, plus a fake one, passes the same checks.
import { flushSync, mount, unmount } from 'svelte';
import { describe, expect, test } from 'vitest';
import { notePool } from '../../src/core/ranges';
import { stepwisePicker } from '../../src/core/selector';
import { reduce, startSession, type Answer, type Session } from '../../src/core/session';
import { available, inputById } from '../../src/inputs';
import { register } from '../../src/inputs/registry';
import type { InputMethod } from '../../src/inputs/types';
import type { ClefNote } from '../../src/core/pitch';
import { fakeInput } from './fake-input';

const random = stepwisePicker(Math.random);

const E4: ClefNote = { pitch: { letter: 'E', octave: 4 }, clef: 'treble' };
const fake = fakeInput();
register(fake);

const MIDI_RANGE = { lo: 21, hi: 108 }; // A0 to C8, the 88 keys.
const isWellFormed = (a: Answer) =>
  Number.isInteger(a.midi) && a.midi >= MIDI_RANGE.lo && a.midi <= MIDI_RANGE.hi;

// Taps the on-screen input's first and last controls and returns what it emitted.
function tapEnds(input: InputMethod): Answer[] {
  const answers: Answer[] = [];
  const target = document.createElement('div');
  if (!('component' in input)) return answers;
  const app = mount(input.component, {
    target,
    props: { mode: 'both', marks: new Map(), emit: (a: Answer) => answers.push(a) },
  });
  flushSync();
  const buttons = target.querySelectorAll('button');
  buttons[0]?.click();
  buttons[buttons.length - 1]?.click();
  void unmount(app);
  return answers;
}

// Starts a headless input, has the fake play C4, then stops it.
async function playHeadless(input: InputMethod): Promise<Answer[]> {
  const answers: Answer[] = [];
  if (!('start' in input)) return answers;
  const stop = await input.start((a) => answers.push(a));
  if (input === fake) fake.play(60);
  stop();
  return answers;
}

describe.each(available().map((input) => [input.id, input] as const))('M2-AC7 input %s', (id, input) => {
  test('M2-AC7 is registered under its id, with a label', () => {
    expect(inputById(id)).toBe(input);
    expect(input.label).not.toBe('');
  });

  test('M2-AC7 emits well-formed pitch answers', async () => {
    const answers = 'component' in input ? tapEnds(input) : await playHeadless(input);
    expect(answers.length).toBeGreaterThan(0);
    expect(answers.every(isWellFormed)).toBe(true);
  });
});

describe('M2-AC7 registry', () => {
  test('M2-AC7 lists the piano first, and the fake works with no core changes', () => {
    expect(available().map((i) => i.id)).toEqual(['piano', 'fake']);
  });

  test('M2-AC7 refuses a duplicate id, since ids are stored in settings', () => {
    expect(() => {
      register(fakeInput());
    }).toThrow(/already registered/);
  });

  test('M2-AC7 falls back to the first available input for an unknown id', () => {
    expect(inputById('letter-pad').id).toBe('piano');
  });

  test('M2-AC7 a stopped headless input emits nothing', async () => {
    const answers: Answer[] = [];
    const stop = await fake.start((a) => answers.push(a));
    stop();
    fake.play(60);
    expect(answers).toEqual([]);
  });
});

describe('M2-AC8 switching input mid-quiz', () => {
  test('M2-AC8 keeps the question and its attempt state', async () => {
    let s: Session = { ...startSession(notePool('treble', 'medium'), undefined, random), note: E4 };
    const answer = (a: Answer) => (s = reduce(s, { type: 'answer', answer: a }, random));

    const stop = await fake.start(answer);
    fake.play(60);
    stop();
    expect(s.phase).toBe('retry');

    const [lowestKey] = tapEnds(inputById('piano'));
    if (lowestKey) answer(lowestKey);
    expect(s.note).toBe(E4);
    expect(s.phase).toBe('reveal');
    expect(s.misses.map((a) => a.midi)).toEqual([60, lowestKey?.midi]);
  });
});
