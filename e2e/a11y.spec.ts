// Accessibility (M7-AC4): axe finds no WCAG 2 AA violations on any screen, in every theme.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { openQuiz } from './quiz-page';

const THEMES = ['paper', 'storybook', 'arcade'];

/** Fails with the offending rules and elements when axe finds a WCAG 2 A/AA violation. */
async function expectNoViolations(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const summary = violations.map(
    (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ') + ' ' + (n.any[0]?.message ?? '')).join(' | ')}`,
  );
  expect(summary).toEqual([]);
}

for (const theme of THEMES) {
  test(`M7-AC4 Home, Settings and Stats have no axe violations (${theme})`, async ({ page }) => {
    await page.goto(`./?theme=${theme}`);
    await expectNoViolations(page);
    await page.getByRole('button', { name: 'Settings' }).click();
    await expectNoViolations(page);
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await page.getByRole('button', { name: 'Stats' }).click();
    await expectNoViolations(page);
  });

  test(`M7-AC4 the quiz and results have no axe violations (${theme})`, async ({ page }) => {
    await page.goto(`./?theme=${theme}`);
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('radio', { name: '10' }).click();
    const { quiz, target, key } = await openQuiz(page, `?theme=${theme}`);
    await expectNoViolations(page);
    await quiz.locator(`.key:not([aria-label="${target}"])`).first().click();
    await expectNoViolations(page);
    const playAgain = quiz.getByRole('button', { name: 'Play again' });
    const staff = quiz.getByRole('img');
    for (let i = 0; i < 15 && !(await playAgain.isVisible()); i++) {
      const name = (await staff.getAttribute('aria-label')) ?? '';
      await key(name.split(' ')[0] ?? '').click();
      await expect(staff.or(playAgain)).not.toHaveAttribute('aria-label', name);
    }
    await expect(playAgain).toBeVisible();
    await expectNoViolations(page);
  });
}
