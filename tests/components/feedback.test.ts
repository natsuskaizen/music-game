import { gsap } from 'gsap';
import { describe, expect, test } from 'vitest';
import { FEEDBACK } from '../../src/components/feedback';

// GSAP animates plain objects too, so a stand-in note shows where each animation leaves it, without a DOM.
// `ownerSVGElement: null` makes the spark burst skip itself.
interface FakeNote {
  ownerSVGElement: null;
  transformOrigin: string;
  opacity: number;
  scale: number;
  x: number;
}

// Starts mid-animation, so each test shows the feedback really moves it.
const fakeNote = (): FakeNote => ({
  ownerSVGElement: null,
  transformOrigin: '',
  opacity: 0.5,
  scale: 0.5,
  x: 5,
});
const asNote = (note: FakeNote) => note as unknown as SVGGElement;
const finish = (note: FakeNote) => {
  for (const tween of gsap.getTweensOf(note)) tween.progress(1);
};

describe('arcade feedback', () => {
  const arcade = FEEDBACK.arcade;

  test('M1-AC1 arcade: a new note flickers on and ends fully shown at normal size', () => {
    const note = fakeNote();
    arcade.enter(asNote(note));
    finish(note);
    expect(note).toMatchObject({ opacity: 1, scale: 1, x: 0 });
  });

  test('M1-AC1 arcade: a miss glitches sideways and settles back in place', () => {
    const note = fakeNote();
    arcade.wrong(asNote(note));
    finish(note);
    expect(note.x).toBe(0);
  });

  test('M1-AC1 arcade: a hit resolves once the note has flickered out', async () => {
    const note = fakeNote();
    await arcade.right(asNote(note));
    expect(note.opacity).toBe(0);
  });
});
