import { expect, test } from '@playwright/test';

const STAFFS = [
  { name: 'F6 on the treble staff', ledgers: 3 },
  { name: 'G1 on the bass staff', ledgers: 3 },
  { name: 'C4 on the treble staff', ledgers: 1 },
];

test('M1-AC1 renders treble, bass, and grand staff with ledger notes', async ({ page }, testInfo) => {
  await page.goto('./');
  await page.evaluate(async () => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('16px Bravura'))).toBe(true);
  for (const staff of STAFFS) {
    const svg = page.getByRole('img', { name: staff.name });
    await expect(svg.locator('.ledger')).toHaveCount(staff.ledgers);
  }
  await expect(page.locator('svg[role="img"]').last().locator('.staff-line:not(.ledger)')).toHaveCount(11);
  await testInfo.attach('staffs', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
});
