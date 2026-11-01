// The handwriting input (M9-6): write the note's letter on the pad and the quiz grades it as a letter.
import { expect, test } from '@playwright/test';
import { openQuiz, staffTarget } from './quiz-page';
import { HANDWRITTEN } from '../tests/fixtures/handwriting';

test('M9-AC7 writing the letter on the pad answers the question', async ({ page }) => {
  const { quiz, target } = await openQuiz(page);
  await quiz.getByRole('combobox', { name: 'Input' }).selectOption('handwriting');
  await expect(quiz.getByText("Write this note's letter.")).toBeVisible();

  const pad = quiz.getByRole('application', { name: /Writing pad/ });
  const box = await pad.boundingBox();
  if (!box) throw new Error('No writing pad');
  const scale = (box.height * 0.7) / 100; // fixtures are drawn in a 100-unit box
  const strokes = HANDWRITTEN.find((f) => f.letter === target[0])?.strokes ?? [];
  for (const [first, ...rest] of strokes) {
    if (!first) continue;
    const at = (p: { x: number; y: number }) => [box.x + 30 + p.x * scale, box.y + 20 + p.y * scale] as const;
    await page.mouse.move(...at(first));
    await page.mouse.down();
    for (const point of rest) await page.mouse.move(...at(point));
    await page.mouse.up();
  }

  await expect(quiz.getByText(`Yes, ${target}!`)).toBeVisible();
  await expect(quiz.getByText(`Read as ${target[0] ?? ''}`)).toBeVisible();
});

test('M10-AC2 a sharp note is only right with the sharp chosen on the pad', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page
    .getByRole('combobox', { name: 'Key signature' })
    .selectOption({ label: 'C♯ major / A♯ minor (7♯)' });
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  const quiz = page.getByRole('region', { name: 'Quiz' });
  await quiz.getByRole('combobox', { name: 'Input' }).selectOption('handwriting');
  const { target } = await staffTarget(quiz);
  expect(target).toMatch(/^[A-G]#\d/); // all seven letters are sharp in C♯ major

  const writeLetter = async () => {
    const pad = quiz.getByRole('application', { name: /Writing pad/ });
    const box = await pad.boundingBox();
    if (!box) throw new Error('No writing pad');
    const scale = (box.height * 0.7) / 100;
    for (const [first, ...rest] of HANDWRITTEN.find((f) => f.letter === target[0])?.strokes ?? []) {
      if (!first) continue;
      const at = (p: { x: number; y: number }) =>
        [box.x + 30 + p.x * scale, box.y + 20 + p.y * scale] as const;
      await page.mouse.move(...at(first));
      await page.mouse.down();
      for (const point of rest) await page.mouse.move(...at(point));
      await page.mouse.up();
    }
  };

  await writeLetter(); // the letter alone is a miss
  await expect(quiz.getByText(`Read as ${target[0] ?? ''}`, { exact: true })).toBeVisible();
  await expect(quiz.getByText(`Yes, ${target}!`)).toBeHidden();
  await quiz.getByRole('button', { name: 'Sharp' }).click();
  await writeLetter();
  await expect(quiz.getByText(`Read as ${target[0] ?? ''}♯`)).toBeVisible();
  await expect(quiz.getByText(`Yes, ${target}!`)).toBeVisible();
});
