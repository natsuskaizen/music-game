import { expect, test, type Page } from '@playwright/test';
import { staffTarget } from './staff-target';
import { hzOf, midiOf, type Pitch } from '../src/core/pitch';

declare global {
  interface Window {
    tones: number[];
  }
}

// Stands in for Safari's audioSession (present or missing) and records the frequency of every tone started.
async function stubAudio(page: Page, withSession: boolean) {
  await page.addInitScript((present) => {
    Object.defineProperty(navigator, 'audioSession', { value: present ? { type: 'auto' } : undefined });
    window.tones = [];
    const start: OscillatorNode['start'] = Reflect.get(OscillatorNode.prototype, 'start');
    OscillatorNode.prototype.start = function (when) {
      window.tones.push(Math.round(this.frequency.value));
      Reflect.apply(start, this, [when]);
    };
  }, withSession);
  await page.goto('./');
  const quiz = page.getByRole('region', { name: 'Quiz' });
  const { target } = await staffTarget(quiz);
  return { quiz, target, tones: () => page.evaluate(() => window.tones) };
}

// The rounded frequency of a key label such as "C4".
function hzOfLabel(label: string): number {
  const pitch: Pitch = { letter: label[0] as Pitch['letter'], octave: Number(label.slice(1)) };
  return Math.round(hzOf(midiOf(pitch)));
}

test('M1-AC5 a right answer plays the note with a playback audio session', async ({ page }) => {
  const { quiz, target, tones } = await stubAudio(page, true);
  await expect(quiz.getByText('Turn the ringer on for sound.')).toHaveCount(0);
  await quiz.getByRole('button', { name: target, exact: true }).click();
  expect(await tones()).toEqual([hzOfLabel(target)]);
  expect(
    await page.evaluate(
      () => (navigator as Navigator & { audioSession: { type: string } }).audioSession.type,
    ),
  ).toBe('playback');
});

test('M1-AC5 a miss is silent until the reveal plays the correct note', async ({ page }) => {
  const { quiz, target, tones } = await stubAudio(page, true);
  const wrong = quiz.locator(`.key:not([aria-label="${target}"])`);
  await wrong.nth(0).click();
  expect(await tones()).toEqual([]);
  await wrong.nth(1).click();
  await expect(quiz.getByText(`It's ${target}. Tap Continue.`)).toBeVisible();
  expect(await tones()).toEqual([hzOfLabel(target)]);
  // Taps while the answer is revealed don't replay it.
  await quiz.getByRole('button', { name: target, exact: true }).click();
  expect(await tones()).toHaveLength(1);
});

test('M1-AC5 without audioSession a touch device shows the ringer hint', async ({ page }) => {
  const { quiz } = await stubAudio(page, false);
  await expect(quiz.getByText('Turn the ringer on for sound.')).toBeVisible();
});
