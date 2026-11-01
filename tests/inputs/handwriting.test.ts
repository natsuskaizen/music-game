// @vitest-environment happy-dom
import { flushSync, mount, unmount } from 'svelte';
import { describe, expect, test } from 'vitest';
import type { Answer } from '../../src/core/session';
import { handwritingInput } from '../../src/inputs/handwriting';
import { HANDWRITTEN } from '../fixtures/handwriting';
import { writeOn } from './write-on';

// Mounts the pad and returns it with the answers it emits.
function openPad() {
  const answers: Answer[] = [];
  const target = document.createElement('div');
  const app = mount(handwritingInput.component, {
    target,
    props: { mode: 'treble', marks: new Map(), emit: (a: Answer) => answers.push(a) },
  });
  flushSync();
  const pad = target.querySelector('[role="application"]');
  if (!pad) throw new Error('No writing pad');
  return { answers, pad, target, close: () => void unmount(app) };
}

const sample = (letter: string) => HANDWRITTEN.find((f) => f.letter === letter)?.strokes ?? [];

describe('M9-AC7 handwriting pad', () => {
  test('M9-AC7 answers with the letter it reads, then clears for the next one', () => {
    const { answers, pad, target, close } = openPad();
    writeOn(pad, sample('D'));
    flushSync();
    expect(answers).toEqual([{ kind: 'letter', letter: 'D' }]);
    expect(target.textContent).toContain('Read as D');
    expect(pad.querySelectorAll('polyline')).toHaveLength(0);

    writeOn(pad, sample('F'));
    expect(answers.at(-1)).toEqual({ kind: 'letter', letter: 'F' });
    close();
  });

  test('M10-AC2 the pad has sharp and flat controls; the chosen one rides on the next letter, then resets', () => {
    const { answers, pad, target, close } = openPad();
    const press = (name: string) => {
      target.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)?.click();
      flushSync();
    };
    press('Sharp');
    expect(target.querySelector('button[aria-label="Sharp"]')?.getAttribute('aria-pressed')).toBe('true');
    writeOn(pad, sample('F'));
    flushSync();
    expect(answers).toEqual([{ kind: 'letter', letter: 'F', accidental: 1 }]);
    expect(target.textContent).toContain('Read as F♯');

    writeOn(pad, sample('F'));
    expect(answers.at(-1)).toEqual({ kind: 'letter', letter: 'F' });

    press('Flat');
    writeOn(pad, sample('B'));
    expect(answers.at(-1)).toEqual({ kind: 'letter', letter: 'B', accidental: -1 });
    close();
  });

  test('M9-AC7 a tap answers nothing', () => {
    const { answers, pad, close } = openPad();
    writeOn(pad, [[{ x: 10, y: 10 }]]);
    expect(answers).toEqual([]);
    close();
  });
});
