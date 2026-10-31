import type { Locator } from '@playwright/test';

/** The quiz staff's name, e.g. "C4 on the treble staff", and its first word: the key to press. */
export async function staffTarget(quiz: Locator): Promise<{ staffName: string; target: string }> {
  const staffName = (await quiz.getByRole('img').getAttribute('aria-label')) ?? '';
  return { staffName, target: staffName.split(' ')[0] ?? '' };
}
