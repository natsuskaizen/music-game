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
    await expect(
      gallery.getByRole('img', { name: 'C4 on the treble staff' }).locator('.staff-line:not(.ledger)'),
    ).toHaveCount(11);
    await testInfo.attach(`${theme} page`, {
      body: await page.screenshot({ fullPage: true, path: shot('page') }),
      contentType: 'image/png',
    });
  });
}

for (const theme of THEMES) {
  test(`M5-AC4 ${theme} theme draws 16 notes in 3 measures with ledger lines and no overlap`, async ({
    page,
  }, testInfo) => {
    await page.goto(`./?theme=${theme}`);
    await expectBravuraLoaded(page);
    const svg = page
      .getByRole('region', { name: 'Staff gallery' })
      .getByRole('img', { name: 'Sequence of 16 notes in 3 measures' });
    await expect(svg.locator('.note')).toHaveCount(16);
    expect(await svg.locator('.ledger').count()).toBeGreaterThan(0);
    const heads = await svg
      .locator('.note .glyph')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect()));
    heads.slice(1).forEach((head, i) => {
      expect(head.left).toBeGreaterThanOrEqual(heads[i]?.right ?? 0);
    });
    await svg.screenshot({ path: `reports/screenshots/${theme}-${testInfo.project.name}-sequence.png` });
  });
}

const KEYED = [
  { name: 'G5 on the treble staff, key of 3 sharps', file: 'key-treble', signs: 3, accidentals: 1 },
  { name: 'F#3 on the bass staff, key of 4 flats', file: 'key-bass', signs: 4, accidentals: 1 },
  {
    name: 'Sequence of 10 notes in 2 measures, key of 2 flats',
    file: 'key-sequence',
    signs: 4,
    accidentals: 6,
  },
];

for (const theme of THEMES) {
  test(`M9-AC2 ${theme} theme draws key signatures and accidentals on both clefs`, async ({
    page,
  }, testInfo) => {
    await page.goto(`./?theme=${theme}`);
    await expectBravuraLoaded(page);
    const gallery = page.getByRole('region', { name: 'Staff gallery' });
    for (const staff of KEYED) {
      const svg = gallery.getByRole('img', { name: staff.name });
      await expect(svg.locator('.key-signature')).toHaveCount(staff.signs);
      await expect(svg.locator('.accidental')).toHaveCount(staff.accidentals);
      // Each accidental ends before its own notehead begins.
      const gaps = await svg.locator('.note').evaluateAll((notes) =>
        notes.flatMap((note) => {
          const sign = note.querySelector('.accidental')?.getBoundingClientRect();
          const head = note.querySelector('.glyph')?.getBoundingClientRect();
          return sign && head ? [head.left - sign.right] : [];
        }),
      );
      expect(gaps).toHaveLength(staff.accidentals);
      for (const gap of gaps) expect(gap).toBeGreaterThanOrEqual(0);
      await svg.screenshot({
        path: `reports/screenshots/${theme}-${testInfo.project.name}-${staff.file}.png`,
      });
    }
  });
}
