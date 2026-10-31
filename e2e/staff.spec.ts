import { expect, test, type Page } from '@playwright/test';

const THEMES = ['paper', 'storybook', 'arcade'];
const STAFFS = [
  { name: 'F6 on the treble staff', file: 'treble', ledgers: 3 },
  { name: 'G1 on the bass staff', file: 'bass', ledgers: 3 },
  { name: 'C4 on the treble staff', file: 'grand', ledgers: 1 },
];

async function expectBravuraLoaded(page: Page) {
  await page.evaluate(async () => document.fonts.ready);
  const bravura = await page.evaluate(() =>
    [...document.fonts].filter((face) => face.family === 'Bravura').map((face) => face.status),
  );
  expect(bravura).toEqual(['loaded']);
}

for (const theme of THEMES) {
  test(`M1-AC1 ${theme} theme renders treble, bass, and grand staff with ledger notes`, async ({
    page,
  }, testInfo) => {
    await page.goto(`./?theme=${theme}`);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expectBravuraLoaded(page);
    // CI uploads reports/screenshots as the "theme-screenshots" artifact.
    const shot = (file: string) => `reports/screenshots/${theme}-${testInfo.project.name}-${file}.png`;
    const gallery = page.getByRole('region', { name: 'Staff gallery' });
    for (const staff of STAFFS) {
      const svg = gallery.getByRole('img', { name: staff.name });
      await expect(svg.locator('.ledger')).toHaveCount(staff.ledgers);
      await svg.screenshot({ path: shot(staff.file) });
    }
    await expect(gallery.locator('svg[role="img"]').last().locator('.staff-line:not(.ledger)')).toHaveCount(
      11,
    );
    await testInfo.attach(`${theme} page`, {
      body: await page.screenshot({ fullPage: true, path: shot('page') }),
      contentType: 'image/png',
    });
  });
}

test('M1-AC1 theme switch links to the other theme', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'paper');
  await page.getByRole('link', { name: 'Storybook' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'storybook');
  await expect(page.getByRole('link', { name: 'Storybook' })).toHaveAttribute('aria-current', 'page');
});
