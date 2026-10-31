import { expect, test } from '@playwright/test';

test('M0-AC5 the page loads offline after the first visit', async ({ page, context }) => {
  await page.goto('./');
  await page.evaluate(async () => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sight Reading' })).toBeVisible();
});

test('M0-AC5 the manifest makes the app installable full-screen', async ({ request }) => {
  const manifest = (await (await request.get('manifest.webmanifest')).json()) as { display: string };
  expect(manifest.display).toBe('standalone');
});
