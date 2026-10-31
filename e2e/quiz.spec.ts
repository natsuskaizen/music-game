import { expect, test } from '@playwright/test';
import { openQuiz } from './quiz-page';

for (const theme of ['paper', 'storybook', 'arcade']) {
  test(`M1-AC1 ${theme}: two misses reveal the note and wait for Continue`, async ({ page }, testInfo) => {
    const { quiz, target, staffName, wrongKeys, key } = await openQuiz(page, `?theme=${theme}`);
    await wrongKeys.nth(0).click();
    await expect(quiz.getByText('Not quite. One more try.')).toBeVisible();
    await wrongKeys.nth(1).click();
    await expect(quiz.getByText(`It's ${target}. Tap Continue.`)).toBeVisible();
    await expect(key(target)).toHaveClass(/right/);
    await expect(quiz.locator('.key.wrong')).toHaveCount(2);
    await expect(key(target)).toBeInViewport();

    // Never auto-advance after a miss: the reveal is still up after the feedback animations finish.
    await page.waitForTimeout(1500);
    await quiz.screenshot({ path: `reports/screenshots/${theme}-${testInfo.project.name}-quiz-reveal.png` });
    await expect(quiz.getByRole('img')).toHaveAttribute('aria-label', staffName);
    await key(target).click();
    await expect(quiz.getByText(`It's ${target}. Tap Continue.`)).toBeVisible();

    await quiz.getByRole('button', { name: 'Continue' }).click();
    await expect(quiz.getByText('Find this note on the keyboard.')).toBeVisible();
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

test('M1-AC1 the clef switch changes the staff and the keyboard range', async ({ page }) => {
  const { quiz } = await openQuiz(page);
  await quiz.getByRole('radio', { name: 'bass' }).click();
  await expect(quiz.getByRole('img')).toHaveAttribute('aria-label', / on the bass staff$/);
  await expect(quiz.getByRole('button', { name: 'G1', exact: true })).toBeVisible();
  await expect(quiz.getByRole('button', { name: 'F6', exact: true })).toHaveCount(0);
});
