import { expect, test } from '@playwright/test';

test('M0-AC1 app shell loads and shows the title', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Sight Reading' })).toBeVisible();
});
