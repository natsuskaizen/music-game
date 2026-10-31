// The M2 quiz screen (design §8.1, §8.4): retry, reveal, Continue, the grand staff, and switching input mid-quiz.
// The e2e build adds a scripted headless input (src/inputs/scripted.ts) as the second input.
import { expect, test, type Page } from '@playwright/test';
import { openQuiz, pitchOfLabel, staffTarget } from './quiz-page';
import { midiOf, staffPos } from '../src/core/pitch';
import { stavesFor, yOf } from '../src/core/staff-layout';

const RETRY = 'Not quite. One more try.';

// Answers with the scripted input, as a real headless input such as the mic would.
async function scriptedAnswer(page: Page, label: string) {
  const midi = midiOf(pitchOfLabel(label));
  await page.evaluate((detail) => window.dispatchEvent(new CustomEvent('scripted-answer', { detail })), midi);
}

test('M2-AC3 a first miss allows a second try and the question stays', async ({ page }) => {
  const { quiz, staffName, target, wrongKeys, key } = await openQuiz(page);
  await wrongKeys.nth(0).click();
  await expect(quiz.getByText(RETRY)).toBeVisible();
  await page.waitForTimeout(1000);
  await expect(quiz.getByRole('img')).toHaveAttribute('aria-label', staffName);
  await expect(quiz.locator('.key.wrong')).toHaveCount(1);
  await expect(quiz.getByRole('button', { name: 'Continue' })).toHaveCount(0);

  await key(target).click();
  await expect(quiz.getByText(`Yes, ${target}!`)).toBeVisible();
  await expect(quiz.getByText('First try 0%')).toBeVisible();
});

test('M2-AC4 a second miss reveals the note and only Continue moves on', async ({ page }) => {
  const { quiz, staffName, target, wrongKeys, key } = await openQuiz(page);
  await wrongKeys.nth(0).click();
  await wrongKeys.nth(1).click();
  await expect(quiz.getByText(`It's ${target}. Tap Continue.`)).toBeVisible();
  await expect(quiz.locator('.note .name')).toHaveText(target);

  await page.waitForTimeout(1500);
  await key(target).click();
  await wrongKeys.nth(2).click();
  await expect(quiz.getByText(`It's ${target}. Tap Continue.`)).toBeVisible();
  await expect(quiz.getByRole('img')).toHaveAttribute('aria-label', staffName);

  await quiz.getByRole('button', { name: 'Continue' }).click();
  await expect(quiz.getByText('Find this note on the keyboard.')).toBeVisible();
  await expect(quiz.getByRole('img')).not.toHaveAttribute('aria-label', staffName);
});

test('M2-AC5 both shows a grand staff with each note on its own stave', async ({ page }) => {
  const { quiz, key } = await openQuiz(page);
  await quiz.getByRole('radio', { name: 'both' }).click();
  const staff = quiz.getByRole('img');
  // Two staves of five lines plus the system's left barline.
  await expect(staff.locator('.staff-line:not(.ledger)')).toHaveCount(11);

  const clefsSeen = new Set<string>();
  for (let i = 0; i < 20 && clefsSeen.size < 2; i++) {
    const { staffName, target } = await staffTarget(quiz);
    const clef = staffName.endsWith('bass staff') ? 'bass' : 'treble';
    const stave = stavesFor('both').find((s) => s.clef === clef);
    if (!stave) throw new Error(`No ${clef} stave`);
    const y = yOf(stave, staffPos({ pitch: pitchOfLabel(target), clef }));
    await expect(staff.locator('.note text.glyph')).toHaveAttribute('y', String(y));
    clefsSeen.add(clef);
    await key(target).click();
    await expect(staff).not.toHaveAttribute('aria-label', staffName);
  }
  expect([...clefsSeen].sort()).toEqual(['bass', 'treble']);
});

test('M2-AC8 switching input mid-quiz keeps the question and its tries', async ({ page }) => {
  const { quiz, staffName, target, wrongKeys, key } = await openQuiz(page);
  const switcher = quiz.getByRole('combobox', { name: 'Input' });
  await wrongKeys.nth(0).click();
  const secondMiss = (await wrongKeys.nth(1).getAttribute('aria-label')) ?? '';

  await switcher.selectOption('scripted');
  await expect(quiz.getByText('Listening: Scripted (test)')).toBeVisible();
  await expect(quiz.locator('.key')).toHaveCount(0);
  await expect(quiz.getByText(RETRY)).toBeVisible();
  await scriptedAnswer(page, secondMiss);
  await expect(quiz.getByText(`It's ${target}. Tap Continue.`)).toBeVisible();
  await expect(quiz.getByRole('img')).toHaveAttribute('aria-label', staffName);

  await switcher.selectOption('piano');
  await expect(quiz.locator('.key.wrong')).toHaveCount(2);
  await expect(key(secondMiss)).toHaveClass(/wrong/);
  await expect(key(target)).toHaveClass(/right/);
});

test('M2-AC8 a miss on one input and a hit on the other is a second-try answer', async ({ page }) => {
  const { quiz, target, wrongKeys, key } = await openQuiz(page);
  const switcher = quiz.getByRole('combobox', { name: 'Input' });
  const miss = (await wrongKeys.nth(0).getAttribute('aria-label')) ?? '';
  await switcher.selectOption('scripted');
  await scriptedAnswer(page, miss);
  await expect(quiz.getByText(RETRY)).toBeVisible();

  await switcher.selectOption('piano');
  await key(target).click();
  await expect(quiz.getByText(`Yes, ${target}!`)).toBeVisible();
  await expect(quiz.getByText('First try 0%')).toBeVisible();
  await expect(quiz.getByText('Streak 0')).toBeVisible();
});
