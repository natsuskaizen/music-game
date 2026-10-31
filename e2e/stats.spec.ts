// The stats screen (M6-4, design §8.3): the heat-map colors match what was answered.
import { expect, test } from '@playwright/test';
import { notePool } from '../src/core/ranges';
import { DEFAULT_SETTINGS } from '../src/core/settings';
import { openQuiz } from './quiz-page';

test('M6-AC4 the heat-map shows a note answered first try as known and the rest as unseen', async ({
  page,
}) => {
  const { quiz, target, key } = await openQuiz(page, '', 'treble');
  await key(target).click();
  await expect(quiz.getByText(`Yes, ${target}!`)).toBeVisible();
  await quiz.getByRole('button', { name: 'Home' }).click();
  await page.getByRole('button', { name: 'Stats' }).click();

  const stats = page.getByRole('region', { name: 'Stats' });
  await expect(stats.locator('.note.strong')).toHaveCount(1);
  await expect(stats.locator('.note.unseen')).toHaveCount(
    notePool('treble', DEFAULT_SETTINGS.difficulty).length - 1,
  );
  await expect(stats.getByRole('list', { name: 'Seen notes' })).toContainText('100%');
});
