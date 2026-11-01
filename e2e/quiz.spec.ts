import { expect, test } from '@playwright/test';
import { openQuiz } from './quiz-page';

for (const theme of ['paper', 'storybook', 'arcade']) {
  test(`M1-AC1 ${theme}: misses keep the question open and Skip moves on`, async ({ page }, testInfo) => {
    const { quiz, staffName, wrongKeys } = await openQuiz(page, `?theme=${theme}`);
    await wrongKeys.nth(0).click();
    await expect(quiz.getByText('Not quite. Keep trying, or skip.')).toBeVisible();
    await wrongKeys.nth(1).click();
    await expect(quiz.getByText('Not quite. Keep trying, or skip.')).toBeVisible();
    await expect(quiz.locator('.key.wrong')).toHaveCount(2);

    // Never auto-advance after a miss: the question is still up after the feedback animations finish.
    await page.waitForTimeout(1500);
    await quiz.screenshot({ path: `reports/screenshots/${theme}-${testInfo.project.name}-quiz-reveal.png` });
    await expect(quiz.getByRole('img')).toHaveAttribute('aria-label', staffName);

    await quiz.getByRole('button', { name: 'Skip' }).click();
    await expect(quiz.getByText('Find this note on the keyboard.')).toBeVisible();
    await expect(quiz.getByRole('img')).not.toHaveAttribute('aria-label', staffName);
    await expect(quiz.getByRole('button', { name: 'Continue' })).toHaveCount(0);
  });

  test(`M1-AC1 ${theme}: a right answer scores and moves to the next note`, async ({ page }) => {
    const { quiz, target, key } = await openQuiz(page, `?theme=${theme}`);
    await key(target).click();
    await expect(quiz.getByText(`Yes, ${target}!`)).toBeVisible();
    await expect(quiz.getByText('Find this note on the keyboard.')).toBeVisible();
    await expect(quiz.getByText('Streak 1')).toBeVisible();
    await expect(quiz.getByText('First try 100%')).toBeVisible();
  });
}

test('M1-AC1 the clef chosen on Home sets the staff and the keyboard range', async ({ page }) => {
  const { quiz } = await openQuiz(page, '', 'bass');
  await expect(quiz.getByRole('img')).toHaveAttribute('aria-label', / on the bass staff$/);
  await expect(quiz.getByRole('button', { name: 'G1', exact: true })).toBeVisible();
  await expect(quiz.getByRole('button', { name: 'F6', exact: true })).toHaveCount(0);
});
