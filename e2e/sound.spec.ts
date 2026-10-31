import { expect, test, type Page } from '@playwright/test';
import { openQuiz, pitchOfLabel } from './quiz-page';
import { midiOf } from '../src/core/pitch';

declare global {
  interface Window {
    tones: number[];
  }
}

// Stands in for Safari's audioSession (present or missing, starting as 'initial') on a touch device and records the MIDI note of every sound started.
async function stubAudio(page: Page, withSession: boolean, sound?: object) {
  if (sound)
    await page.addInitScript((saved) => {
      localStorage.setItem('settings', JSON.stringify({ sound: saved }));
    }, sound);
  await page.addInitScript((present) => {
    const session = present ? { type: 'initial' } : undefined;
    Object.defineProperty(Navigator.prototype, 'audioSession', { get: () => session });
    // iPhone and iPad report 5 touch points; Playwright's WebKit emulation doesn't always.
    Object.defineProperty(Navigator.prototype, 'maxTouchPoints', { get: () => 5 });
    window.tones = [];
    // Records the MIDI note of every sound started: a sample's own note shifted by its detune, or the synth fallback's pitch.
    const sampleOf = new WeakMap<object, number>();
    const fetchSample = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const res = await fetchSample(input, init);
      const midi = /piano\/(\d+)\.m4a/.exec(typeof input === 'string' ? input : '')?.[1];
      if (midi === undefined) return res;
      const bytes = await res.arrayBuffer();
      sampleOf.set(bytes, Number(midi));
      // The app reads the body once, so hand back the same tagged buffer.
      res.arrayBuffer = () => Promise.resolve(bytes);
      return res;
    };
    const decode: BaseAudioContext['decodeAudioData'] = Reflect.get(
      BaseAudioContext.prototype,
      'decodeAudioData',
    );
    BaseAudioContext.prototype.decodeAudioData = async function (bytes) {
      const buffer = await Reflect.apply(decode, this, [bytes]);
      sampleOf.set(buffer, sampleOf.get(bytes) ?? NaN);
      return buffer;
    };
    const startSample: AudioBufferSourceNode['start'] = Reflect.get(AudioBufferSourceNode.prototype, 'start');
    AudioBufferSourceNode.prototype.start = function (when) {
      const base = this.buffer ? (sampleOf.get(this.buffer) ?? NaN) : NaN;
      window.tones.push(Math.round(base + this.detune.value / 100));
      Reflect.apply(startSample, this, [when]);
    };
    const startSynth: OscillatorNode['start'] = Reflect.get(OscillatorNode.prototype, 'start');
    OscillatorNode.prototype.start = function (when) {
      window.tones.push(Math.round(69 + 12 * Math.log2(this.frequency.value / 440)));
      Reflect.apply(startSynth, this, [when]);
    };
  }, withSession);
  const { quiz, target } = await openQuiz(page);
  return { quiz, target, tones: () => page.evaluate(() => window.tones) };
}

// The MIDI note of a key label such as "C4".
function midiOfLabel(label: string): number {
  return midiOf(pitchOfLabel(label));
}

test('M1-AC5 a right answer plays the note with a playback audio session', async ({ page }) => {
  const { quiz, target, tones } = await stubAudio(page, true);
  await expect(quiz.getByText('Turn the ringer on for sound.')).toHaveCount(0);
  await quiz.getByRole('button', { name: target, exact: true }).click();
  expect(await tones()).toEqual([midiOfLabel(target)]);
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
  expect(await tones()).toEqual([midiOfLabel(target)]);
  // Taps while the answer is revealed don't replay it.
  await quiz.getByRole('button', { name: target, exact: true }).click();
  expect(await tones()).toHaveLength(1);
});

test('M1-AC5 without audioSession a touch device shows the ringer hint', async ({ page }) => {
  const { quiz } = await stubAudio(page, false);
  await expect(quiz.getByText('Turn the ringer on for sound.')).toBeVisible();
});

test('M3-AC2 with sound off nothing plays, even after a reveal', async ({ page }) => {
  const { quiz, target, tones } = await stubAudio(page, true, { on: false, onShow: true, onWrong: true });
  const wrong = quiz.locator(`.key:not([aria-label="${target}"])`);
  await wrong.nth(0).click();
  await wrong.nth(1).click();
  await expect(quiz.getByText(`It's ${target}. Tap Continue.`)).toBeVisible();
  expect(await tones()).toEqual([]);
});

test('M3-AC2 "when the note appears" plays the note as the question shows', async ({ page }) => {
  const { target, tones } = await stubAudio(page, true, { onShow: true });
  await expect.poll(tones).toEqual([midiOfLabel(target)]);
});

test('M3-AC2 "after a wrong try" plays the correct note on the first miss', async ({ page }) => {
  const { quiz, target, tones } = await stubAudio(page, true, { onWrong: true });
  await quiz.locator(`.key:not([aria-label="${target}"])`).first().click();
  await expect(quiz.getByText('Not quite. One more try.')).toBeVisible();
  expect(await tones()).toEqual([midiOfLabel(target)]);
});

const sessionType = (page: Page) =>
  page.evaluate(() => (navigator as Navigator & { audioSession: { type: string } }).audioSession.type);

test('M3-AC2 playing with the silent switch on asks for a playback audio session', async ({ page }) => {
  await stubAudio(page, true, { ignoreSilentSwitch: true });
  expect(await sessionType(page)).toBe('playback');
});

test('M3-AC2 turning the silent-switch setting off leaves the audio session on auto', async ({ page }) => {
  await stubAudio(page, true, { ignoreSilentSwitch: false });
  expect(await sessionType(page)).toBe('auto');
});

test('M3-AC8 while a listening input is active nothing plays and the heard key is highlighted', async ({
  page,
}) => {
  const { quiz, target, tones } = await stubAudio(page, true, { onShow: true });
  await expect.poll(tones).toEqual([midiOfLabel(target)]);
  await quiz.getByRole('combobox', { name: 'Input' }).selectOption('scripted');
  const heard = (detail: number | null) =>
    page.evaluate((d) => window.dispatchEvent(new CustomEvent('scripted-heard', { detail: d })), detail);

  await heard(midiOfLabel(target));
  await expect(quiz.getByRole('button', { name: target, exact: true })).toHaveClass(/heard/);
  await heard(null);
  await expect(quiz.locator('.key.heard')).toHaveCount(0);

  await page.evaluate(
    (d) => window.dispatchEvent(new CustomEvent('scripted-answer', { detail: d })),
    midiOfLabel(target),
  );
  await expect(quiz.getByText(`Yes, ${target}!`)).toBeVisible();
  expect(await tones()).toEqual([midiOfLabel(target)]); // still only the one from before listening
});
