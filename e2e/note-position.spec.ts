import { expect, test } from '@playwright/test';
import { openQuiz } from './quiz-page';

for (const theme of ['paper', 'storybook', 'arcade']) {
  test(`M8-AC2 ${theme}: the note stays on its staff position after answers`, async ({ page }) => {
    const { quiz } = await openQuiz(page, `?theme=${theme}`);
    for (let i = 0; i < 5; i++) {
      const name = ((await quiz.getByRole('img').getAttribute('aria-label')) ?? '').split(' ')[0] ?? '';
      await quiz.getByRole('button', { name, exact: true }).click();
      await expect(quiz.getByText('Find this note on the keyboard.')).toBeVisible();
      await page.waitForTimeout(800); // let the enter animation finish
      const note = quiz.locator('g.note');
      const { e, f } = await note.evaluate((g: SVGGElement) => {
        const m = g.transform.baseVal.consolidate()?.matrix;
        return { e: m?.e ?? 0, f: m?.f ?? 0 };
      });
      expect(e).toBeCloseTo(0, 1);
      expect(f).toBeCloseTo(0, 1);
      // The drawn notehead sits where the layout put it (the glyph's own box is centred on its y within a quarter space).
      const { drawn, layout } = await note
        .locator('text.glyph')
        .first()
        .evaluate((t: SVGGraphicsElement) => {
          const box = t.getBoundingClientRect();
          const y = new DOMPoint(0, Number(t.getAttribute('y'))).matrixTransform(
            t.getScreenCTM() ?? new DOMMatrix(),
          ).y;
          return { drawn: box.top + box.height / 2, layout: y };
        });
      expect(Math.abs(drawn - layout)).toBeLessThan(3);
    }
  });
}
