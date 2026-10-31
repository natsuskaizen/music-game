// Theme setting (M8-AC1): chosen in Settings, applied at once, kept across reloads.
import { expect, test } from '@playwright/test';

test('M8-AC1 a fresh install shows Paper & ink; a chosen theme applies at once and survives a reload', async ({
  page,
}) => {
  await page.goto('./');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'paper');

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: 'Storybook' }).click();
  await expect(html).toHaveAttribute('data-theme', 'storybook');

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'storybook');
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('radio', { name: 'Storybook' })).toHaveAttribute('aria-checked', 'true');
});

test('M8-AC1 ?theme= still overrides the saved theme as a test hook', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: 'Storybook' }).click();
  await page.goto('./?theme=arcade');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'arcade');
});
