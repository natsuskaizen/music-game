// The update prompt (M7-2, design §5.2): serve one build, swap in a new one mid-quiz, and check the person decides when to switch.
import { cp, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { expect, test } from '@playwright/test';
import { staffTarget } from './quiz-page';

const TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
};

/** A copy of the e2e build whose index.html carries a `build` marker and whose service worker precaches it as changed. */
async function makeBuild(marker: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), `build-${marker}-`));
  await cp('dist-e2e', dir, { recursive: true });
  const html = join(dir, 'index.html');
  await writeFile(
    html,
    (await readFile(html, 'utf8')).replace('<head>', `<head><meta name="build" content="${marker}">`),
  );
  const worker = join(dir, 'sw.js');
  const script = (await readFile(worker, 'utf8')).replace(
    /(url:"index\.html",revision:)"[^"]*"/,
    `$1"${marker}"`,
  );
  await writeFile(worker, `${script}\n// ${marker}`);
  return dir;
}

/** Serves whichever build folder `current.dir` names under the app's base path. */
function serve(current: { dir: string }): Promise<{ server: Server; base: string }> {
  const server = createServer((req, res) => {
    const path = (req.url ?? '/').split('?')[0]?.replace('/music-game/', '') ?? '';
    readFile(join(current.dir, path === '' ? 'index.html' : path))
      .then((body) => res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'text/html' }).end(body))
      .catch(() => res.writeHead(404).end());
  });
  return new Promise((resolve) =>
    server.listen(0, () => {
      const { port } = server.address() as AddressInfo;
      resolve({ server, base: `http://localhost:${String(port)}/music-game/` });
    }),
  );
}

test('M7-AC1 a new deploy shows the prompt, keeps the question, and Update now reloads into it', async ({
  page,
}) => {
  const current = { dir: await makeBuild('v1') };
  const { server, base } = await serve(current);
  try {
    await page.goto(base);
    await page.evaluate(async () => navigator.serviceWorker.ready);
    await page.reload();
    await expect(page.locator('meta[name=build]')).toHaveAttribute('content', 'v1');
    await page.getByRole('button', { name: 'Start' }).click();
    const quiz = page.getByRole('region', { name: 'Quiz' });
    const { staffName } = await staffTarget(quiz);
    await expect(page.getByRole('button', { name: 'Update now' })).toHaveCount(0);

    current.dir = await makeBuild('v2');
    await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
    const update = page.getByRole('button', { name: 'Update now' });
    await expect(update).toBeVisible();
    await expect(quiz.getByRole('img')).toHaveAttribute('aria-label', staffName);
    await expect(page.locator('meta[name=build]')).toHaveAttribute('content', 'v1');

    await update.click();
    await expect(page.locator('meta[name=build]')).toHaveAttribute('content', 'v2');
    await expect(page.getByRole('button', { name: 'Update now' })).toHaveCount(0);
  } finally {
    server.close();
  }
});
