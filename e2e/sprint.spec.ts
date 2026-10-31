// The sprint in the quiz (M6-2, design §14): a countdown bar that ends the session at the limit.
// Playwright's fake clock jumps the 40 s instead of waiting.
import { expect, test } from '@playwright/test';

test('M6-AC2 a Hard sprint ends at the time limit and results show', async ({ page }) => {
  await page.clock.install();
  await page.goto('./');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: 'hard' }).click();
  await page.getByRole('checkbox', { name: /timer/i }).check();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  const quiz = page.getByRole('region', { name: 'Quiz' });
  const bar = quiz.getByRole('progressbar', { name: 'Time left' });
  await expect(bar).toHaveAttribute('aria-valuemax', '40');

  await page.clock.fastForward(20_000);
  await expect(bar).toHaveAttribute('aria-valuenow', '20');
  await expect(quiz.getByText(/Session done/)).toBeHidden();

  await page.clock.fastForward(21_000);
  await expect(quiz.getByText('Session done: 0 of 0 right on the first try (0%).')).toBeVisible();
  await expect(bar).toBeHidden();
});

test('M6-AC2 with the timer off there is no countdown bar', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('progressbar', { name: 'Time left' })).toHaveCount(0);
});
