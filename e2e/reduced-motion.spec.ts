import { expect, test } from '@playwright/test';
import { openQuiz } from './quiz-page';

test.use({ reducedMotion: 'reduce' });

test('M7-AC3 reduced motion: a right answer shows no sparks and moves on at once, a miss still shows the retry', async ({
  page,
}) => {
  const { quiz, wrongKeys, key, target } = await openQuiz(page, '?theme=storybook');
  await wrongKeys.first().click();
  await expect(quiz.getByText('Not quite. Keep trying, or skip.')).toBeVisible();
  await key(target).click();
  await expect(quiz.locator('.spark')).toHaveCount(0);
});
