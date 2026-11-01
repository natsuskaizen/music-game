// The handwriting input (M9-6): write the note's letter on the pad and the quiz grades it as a letter.
import { expect, test } from '@playwright/test';
import { openQuiz } from './quiz-page';
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
