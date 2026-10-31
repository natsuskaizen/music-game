// Renders public/icon.svg to the PNG app icons (manifest + apple-touch). Rerun `npm run icons` after changing the SVG;
// set CHROMIUM_PATH when Playwright's bundled browser isn't installed.
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const ICONS = [
  { file: 'public/icon-192.png', size: 192 },
  { file: 'public/icon-512.png', size: 512 },
  { file: 'public/apple-touch-icon.png', size: 180 },
];

const svg = readFileSync('public/icon.svg', 'utf8');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
for (const { file, size } of ICONS) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<body style="margin:0">${svg.replace('<svg ', `<svg width="${String(size)}" height="${String(size)}" `)}</body>`,
  );
  await page.screenshot({ path: file, omitBackground: false });
  await page.close();
}
await browser.close();
