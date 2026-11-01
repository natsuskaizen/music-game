// Sequence mode in the quiz (M5-4, design §8.2, §8.4): chosen on Home, read note by note with the single-note rules.
// The scripted input stands in for the mic: it listens like the mic.
import { expect, test, type Page } from '@playwright/test';
import { pitchOfLabel } from './quiz-page';
import { midiOf } from '../src/core/pitch';

// A note no Easy treble sequence contains, so it is always a miss.
const MISS = 'A0';

async function scriptedAnswer(page: Page, label: string) {
  const midi = midiOf(pitchOfLabel(label));
  await page.evaluate((detail) => window.dispatchEvent(new CustomEvent('scripted-answer', { detail })), midi);
}

test('M5-AC2 M10-AC8 M10-AC9 a sequence moves on only with Skip or the right note, and ends after every note', async ({
  page,
}) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: 'easy' }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('radio', { name: 'sequence' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  const quiz = page.getByRole('region', { name: 'Quiz' });
  await expect(quiz.getByRole('img').first()).toHaveAttribute(
    'aria-label',
    'Sequence of 4 notes in 1 measure',
  );
  await quiz.getByRole('combobox', { name: 'Input' }).selectOption('scripted');

  const current = quiz.locator('.note.current');
  for (let i = 0; i < 4; i++) {
    await expect(current).toHaveCount(1);
    // M10-AC9: the current note carries a halo; settled notes do not.
    await expect(quiz.locator('.current-halo')).toHaveCount(1);
    await scriptedAnswer(page, MISS);
    await scriptedAnswer(page, MISS);
    await expect(quiz.getByText('Not quite. Keep trying, or skip.')).toBeVisible();
    // A miss never moves on; Skip moves past the current note and marks it wrong.
    await expect(quiz.locator('.note.wrong')).toHaveCount(i);
    await quiz.getByRole('button', { name: 'Skip' }).click();
  }
  await expect(quiz.getByText('Session done: 0 of 4 right on the first try (0%).')).toBeVisible();
});

test('M5-AC2 the Single / Sequence choice persists across reloads', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('radio', { name: 'sequence' }).click();
  await page.reload();
  await expect(page.getByRole('radio', { name: 'sequence' })).toHaveAttribute('aria-checked', 'true');
});
