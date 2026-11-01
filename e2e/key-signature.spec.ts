// Key signatures and accidentals in the quiz (M9-3, design §14): notes are graded by how they sound in the key,
// on the piano and on a listening input.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { keyName } from '../src/core/keyboard';
import { midiOf } from '../src/core/pitch';
import { pitchOfLabel, staffTarget } from './quiz-page';

async function startInKey(page: Page, key: string, accidentals = false): Promise<Locator> {
  await page.goto('./');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('combobox', { name: 'Key signature' }).selectOption({ label: key });
  if (accidentals) await page.getByRole('checkbox', { name: 'Include sharps, flats and naturals' }).check();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  return page.getByRole('region', { name: 'Quiz' });
}

const sounding = async (quiz: Locator) => midiOf(pitchOfLabel((await staffTarget(quiz)).target));

test('M9-AC4 in a key every question is graded by its sounding pitch on the piano', async ({ page }) => {
  const quiz = await startInKey(page, 'E♭ major / C minor (3♭)');
  for (let i = 0; i < 8; i++) {
    const { staffName } = await staffTarget(quiz);
    expect(staffName).toMatch(/^[A-G][#b]?\d on the treble staff, key of 3 flats$/);
    expect(staffName).not.toMatch(/^[EAB]\d/); // E, A and B are flat in this key
    await quiz.getByRole('button', { name: keyName(await sounding(quiz)), exact: true }).click();
    await expect(quiz.getByRole('img')).not.toHaveAttribute('aria-label', staffName);
  }
  await expect(quiz.getByText('First try 100%')).toBeVisible();
});

test('M9-AC4 a listening input accepts the sounding pitch with accidentals on', async ({ page }) => {
  const quiz = await startInKey(page, 'D major / B minor (2♯)', true);
  await quiz.getByRole('combobox', { name: 'Input' }).selectOption('scripted');
  for (let i = 0; i < 6; i++) {
    const { staffName } = await staffTarget(quiz);
    const midi = await sounding(quiz);
    await page.evaluate(
      (detail) => window.dispatchEvent(new CustomEvent('scripted-answer', { detail })),
      midi,
    );
    await expect(quiz.getByRole('img')).not.toHaveAttribute('aria-label', staffName);
  }
  await expect(quiz.getByText('First try 100%')).toBeVisible();
});

test('M9-AC4 the key signature and accidentals settings persist across reloads', async ({ page }) => {
  await startInKey(page, 'Random each session', true);
  await page.reload();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('combobox', { name: 'Key signature' })).toHaveValue('0');
  await expect(page.getByRole('checkbox', { name: 'Include sharps, flats and naturals' })).toBeChecked();
});

test('M10-AC10 accidentals on the note: the setting draws no key signature and sharps beside every note', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page
    .getByRole('combobox', { name: 'Key signature' })
    .selectOption({ label: 'C♯ major / A♯ minor (7♯)' });
  await page
    .getByRole('checkbox', { name: 'Write sharps and flats on the note, with no key signature' })
    .check();
  await page.reload();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('checkbox', { name: /Write sharps and flats on the note/ })).toBeChecked();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('radio', { name: 'sequence' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  const quiz = page.getByRole('region', { name: 'Quiz' });
  await expect(quiz.locator('.key-signature')).toHaveCount(0);
  // In C♯ major every note is sharp, so each one carries its own sign.
  await expect(quiz.locator('.accidental')).not.toHaveCount(0);
});
