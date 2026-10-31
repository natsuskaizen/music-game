// Home and Settings (design §14): choices persist across reloads and drive the quiz.
import { expect, test } from '@playwright/test';
import { openQuiz } from './quiz-page';

test('M2-AC6 clef, difficulty and session length persist across reloads', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('radio', { name: 'bass' }).click();
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: 'hard' }).click();
  await page.getByRole('radio', { name: '10' }).click();

  await page.reload();
  await expect(page.getByRole('radio', { name: 'bass' })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('radio', { name: 'hard' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('radio', { name: '10' })).toHaveAttribute('aria-checked', 'true');
});

test('M2-AC6 the default input starts the quiz', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('combobox').selectOption('scripted');
  await page.reload();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByText('Listening: Scripted (test)')).toBeVisible();
});

test('M2-AC6 a 10-question session ends with a result and can start again', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: '10' }).click();
  const { quiz, staffName, key } = await openQuiz(page);
  let name = staffName;
  for (let i = 0; i < 10; i++) {
    const target = name.split(' ')[0] ?? '';
    await key(target).click();
    if (i < 9) await expect(quiz.getByRole('img')).not.toHaveAttribute('aria-label', name);
    if (i < 9) name = (await quiz.getByRole('img').getAttribute('aria-label')) ?? '';
  }
  await expect(quiz.getByText('Session done: 10 of 10 right on the first try (100%).')).toBeVisible();
  await expect(quiz.getByText(/Average time \d+\.\d s/)).toBeVisible();
  await expect(quiz.getByRole('list', { name: 'Slowest notes' }).getByRole('listitem')).toHaveCount(3);
  await quiz.getByRole('button', { name: 'Play again' }).click();
  await expect(quiz.getByText('Streak 0')).toBeVisible();
});

test('M6-AC5 the results screen has a Home button', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: '10' }).click();
  const { quiz, staffName, key } = await openQuiz(page);
  let name = staffName;
  for (let i = 0; i < 10; i++) {
    await key(name.split(' ')[0] ?? '').click();
    if (i < 9) await expect(quiz.getByRole('img')).not.toHaveAttribute('aria-label', name);
    if (i < 9) name = (await quiz.getByRole('img').getAttribute('aria-label')) ?? '';
  }
  await quiz.getByRole('button', { name: 'Home' }).click();
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
});
