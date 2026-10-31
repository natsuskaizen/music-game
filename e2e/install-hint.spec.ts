// The Add to Home Screen hint (M7-3, design §5.2): shown in a Safari tab, gone once dismissed or installed.
import { expect, test, type Page } from '@playwright/test';

const hint = (page: Page) => page.getByRole('complementary', { name: 'Install the app' });

// The iPhone/iPad projects already send an iOS user agent; this fakes Safari's `navigator.standalone`.
async function setStandalone(page: Page, standalone: boolean) {
  await page.addInitScript((value) => {
    Object.defineProperty(navigator, 'standalone', { value, configurable: true });
  }, standalone);
}

test('M7-AC2 the hint shows in a Safari tab and stays away once dismissed', async ({ page }) => {
  await setStandalone(page, false);
  await page.goto('./');
  await expect(hint(page)).toBeVisible();
  await page.getByRole('button', { name: 'Dismiss' }).click();
  await expect(hint(page)).toBeHidden();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Sight Reading' })).toBeVisible();
  await expect(hint(page)).toBeHidden();
});

test('M7-AC2 the hint never shows in the installed app', async ({ page }) => {
  await setStandalone(page, true);
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Sight Reading' })).toBeVisible();
  await expect(hint(page)).toBeHidden();
});
