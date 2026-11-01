// The M2 quiz screen (design §8.1, §8.4): retry, Skip, the grand staff, and switching input mid-quiz.
// The e2e build adds a scripted headless input (src/inputs/scripted.ts) as the second input.
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { openQuiz, pitchOfLabel, staffTarget } from './quiz-page';
import { midiOf, staffPos } from '../src/core/pitch';
import { stavesFor, yOf } from '../src/core/staff-layout';

const RETRY = 'Not quite. Keep trying, or skip.';

// Answers with the scripted input, as a real headless input such as the mic would.
async function scriptedAnswer(page: Page, label: string) {
  const midi = midiOf(pitchOfLabel(label));
  await page.evaluate((detail) => window.dispatchEvent(new CustomEvent('scripted-answer', { detail })), midi);
}

test('M2-AC3 M10-AC7 a first miss allows a second try, the question stays and the red key fades', async ({
  page,
}) => {
  const { quiz, staffName, target, wrongKeys, key } = await openQuiz(page);
  await wrongKeys.nth(0).click();
  await expect(quiz.getByText(RETRY)).toBeVisible();
  await expect(quiz.locator('.key.wrong')).toHaveCount(1);
  await expect(quiz.locator('.key.wrong')).toHaveCount(0); // M10-AC7: the highlight fades away
  await expect(quiz.getByRole('img')).toHaveAttribute('aria-label', staffName);
  await expect(quiz.getByRole('button', { name: 'Continue' })).toHaveCount(0);

  await key(target).click();
  await expect(quiz.getByText(`Yes, ${target}!`)).toBeVisible();
  await expect(quiz.getByText('First try 0%')).toBeVisible();
});

test('M10-AC6 misses keep the question open, a hit still counts, and Skip moves on', async ({ page }) => {
  const { quiz, staffName, wrongKeys } = await openQuiz(page);
  await wrongKeys.nth(0).click();
  await wrongKeys.nth(1).click();
  await wrongKeys.nth(2).click();
  await page.waitForTimeout(1500);
  await expect(quiz.getByText(RETRY)).toBeVisible();
  await expect(quiz.getByRole('img')).toHaveAttribute('aria-label', staffName);

  await quiz.getByRole('button', { name: 'Skip' }).click();
  await expect(quiz.getByText('Find this note on the keyboard.')).toBeVisible();
  await expect(quiz.getByRole('img')).not.toHaveAttribute('aria-label', staffName);
});

// Stepwise ordering (M4-3) changes clef only ~3% of the time, so a seeded Math.random makes this walk reach both clefs.
const SEED = 8;

test('M2-AC5 both shows a grand staff with each note on its own stave', async ({ page }) => {
  await page.addInitScript((seed) => {
    let state = seed;
    Math.random = () => (state = (state * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32;
  }, SEED);
  const { quiz, key } = await openQuiz(page, '', 'both');
  const staff = quiz.getByRole('img');
  // Two staves of five lines plus the system's left barline.
  await expect(staff.locator('.staff-line:not(.ledger)')).toHaveCount(11);

  const clefsSeen = new Set<string>();
  for (let i = 0; i < 20 && clefsSeen.size < 2; i++) {
    const { staffName, target } = await staffTarget(quiz);
    const clef = staffName.endsWith('bass staff') ? 'bass' : 'treble';
    const stave = stavesFor('both').find((s) => s.clef === clef);
    if (!stave) throw new Error(`No ${clef} stave`);
    const y = yOf(stave, staffPos({ pitch: pitchOfLabel(target), clef }));
    await expect(staff.locator('.note text.glyph')).toHaveAttribute('y', String(y));
    clefsSeen.add(clef);
    await key(target).click();
    await expect(staff).not.toHaveAttribute('aria-label', staffName);
  }
  expect([...clefsSeen].sort()).toEqual(['bass', 'treble']);
});

test('M2-AC8 switching input mid-quiz keeps the question and its tries', async ({ page }) => {
  const { quiz, staffName, target, wrongKeys, key } = await openQuiz(page);
  const switcher = quiz.getByRole('combobox', { name: 'Input' });
  await wrongKeys.nth(0).click();
  const secondMiss = (await wrongKeys.nth(1).getAttribute('aria-label')) ?? '';

  await switcher.selectOption('scripted');
  await expect(quiz.getByText('Listening: Scripted (test)')).toBeVisible();
  await expect(quiz.getByText(RETRY)).toBeVisible();
  await scriptedAnswer(page, secondMiss);
  await expect(quiz.getByText(RETRY)).toBeVisible();
  await expect(quiz.getByRole('img')).toHaveAttribute('aria-label', staffName);

  await switcher.selectOption('piano');
  await expect(quiz.locator('.key.wrong')).toHaveCount(0); // faded by now; the question and tries remain
  await key(target).click();
  await expect(quiz.getByText(`Yes, ${target}!`)).toBeVisible();
});

test('M2-AC8 a miss on one input and a hit on the other is a second-try answer', async ({ page }) => {
  const { quiz, target, wrongKeys, key } = await openQuiz(page);
  const switcher = quiz.getByRole('combobox', { name: 'Input' });
  const miss = (await wrongKeys.nth(0).getAttribute('aria-label')) ?? '';
  await switcher.selectOption('scripted');
  await scriptedAnswer(page, miss);
  await expect(quiz.getByText(RETRY)).toBeVisible();

  await switcher.selectOption('piano');
  await key(target).click();
  await expect(quiz.getByText(`Yes, ${target}!`)).toBeVisible();
  await expect(quiz.getByText('First try 0%')).toBeVisible();
  await expect(quiz.getByText('Streak 0')).toBeVisible();
});

test('M10-AC6 with a listening input, playing the note moves on, a miss does not, and Skip does', async ({
  page,
}) => {
  const { quiz, staffName, target, wrongKeys } = await openQuiz(page);
  await quiz.getByRole('combobox', { name: 'Input' }).selectOption('scripted');
  await expect(quiz.getByText('Play this note.')).toBeVisible();
  const miss = (await wrongKeys.nth(0).getAttribute('aria-label')) ?? '';
  await scriptedAnswer(page, miss);
  await scriptedAnswer(page, miss);
  await expect(quiz.getByText(RETRY)).toBeVisible();
  await expect(quiz.getByRole('img')).toHaveAttribute('aria-label', staffName);

  await scriptedAnswer(page, target);
  await expect(quiz.getByText('Play this note.')).toBeVisible();
  await expect(quiz.getByRole('img')).not.toHaveAttribute('aria-label', staffName);
  await expect(quiz.getByText('First try 0%')).toBeVisible();

  const second = (await quiz.getByRole('img').getAttribute('aria-label')) ?? '';
  await quiz.getByRole('button', { name: 'Skip' }).click();
  await expect(quiz.getByRole('img')).not.toHaveAttribute('aria-label', second);
});

test('M3-AC12 the heard note shows on the staff at its position, and leaves with silence', async ({
  page,
}) => {
  const { quiz } = await openQuiz(page, '', 'treble');
  await quiz.getByRole('combobox', { name: 'Input' }).selectOption('scripted');
  const heard = (detail: number | null) =>
    page.evaluate((d) => window.dispatchEvent(new CustomEvent('scripted-heard', { detail: d })), detail);
  const mark = quiz.locator('.heard text.glyph');
  const [treble] = stavesFor('treble');
  if (!treble) throw new Error('No treble stave');

  await heard(midiOf(pitchOfLabel('E4')));
  await expect(mark).toHaveAttribute(
    'y',
    String(yOf(treble, staffPos({ pitch: pitchOfLabel('E4'), clef: 'treble' }))),
  );
  await expect(quiz.locator('.heard .accidental')).toHaveCount(0);
  await heard(midiOf(pitchOfLabel('F4')) + 1);
  await expect(mark).toHaveAttribute(
    'y',
    String(yOf(treble, staffPos({ pitch: pitchOfLabel('F4'), clef: 'treble' }))),
  );
  await expect(quiz.locator('.heard .accidental')).toHaveCount(1);
  await heard(null);
  await expect(mark).toHaveCount(0);
});

/** How many attempts IndexedDB holds. */
const storedAttempts = (page: Page) =>
  page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const open = indexedDB.open('sight-reading');
      open.onsuccess = () => {
        resolve(open.result);
      };
    });
    return new Promise<number>((resolve) => {
      const count = db.transaction('attempts').objectStore('attempts').count();
      count.onsuccess = () => {
        resolve(count.result);
      };
    });
  });

test('M4-4 answers are kept on the device and survive a reload', async ({ page }) => {
  const { quiz, target, key } = await openQuiz(page);
  await key(target).click();
  await expect(quiz.getByText(`Yes, ${target}!`)).toBeVisible();
  const stored = () => storedAttempts(page);
  await expect.poll(stored).toBe(1);
  await page.reload();
  expect(await stored()).toBe(1);
});

test('M4-AC5 review draws only the weak note and ends when it is learned', async ({ page }) => {
  const { quiz, target, wrongKeys, key } = await openQuiz(page, '', 'treble');
  await wrongKeys.nth(0).click();
  await quiz.getByRole('button', { name: 'Skip' }).click();
  await expect.poll(() => storedAttempts(page)).toBe(1);
  await quiz.getByRole('button', { name: 'Home' }).click();

  await page.getByRole('button', { name: 'Review weak notes (1)' }).click();
  const staff = quiz.getByRole('img');
  const asking = quiz.getByText('Find this note on the keyboard.');
  const done = quiz.getByText(/No weak notes left/);
  for (let i = 0; i < 8 && !(await done.isVisible()); i++) {
    await expect(asking.or(done).first()).toBeVisible();
    if (await done.isVisible()) break;
    await expect(staff).toHaveAttribute('aria-label', new RegExp(`^${target} `));
    await key(target).click();
  }
  await expect(done).toBeVisible();
});

test('M4-AC6 export then import restores the progress the file held', async ({ page }) => {
  const { quiz, target, key } = await openQuiz(page);
  await key(target).click();
  await expect(quiz.getByText(`Yes, ${target}!`)).toBeVisible();
  await quiz.getByRole('button', { name: 'Home' }).click();
  await page.getByRole('button', { name: 'Settings' }).click();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export progress' }).click();
  const backup = join(tmpdir(), `backup-${String(Date.now())}.json`);
  await (await download).saveAs(backup);
  expect((JSON.parse(readFileSync(backup, 'utf8')) as { attempts: unknown[] }).attempts).toHaveLength(1);

  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  const again = await staffTarget(quiz);
  await key(again.target).click();
  await expect(quiz.getByText(`Yes, ${again.target}!`)).toBeVisible();
  await quiz.getByRole('button', { name: 'Home' }).click();
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel(/Restore from backup/).setInputFiles(backup);
  await expect(page.getByRole('status')).toHaveText('Restored 1 answers.');

  await page
    .getByLabel(/Restore from backup/)
    .setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('nope') });
  await expect(page.getByRole('status')).toHaveText('That file is not a backup. Nothing changed.');
});

test('M7-AC6 the mic meter shows the live level, the threshold mark and when it is loud enough', async ({
  page,
}) => {
  const { quiz } = await openQuiz(page, '', 'treble');
  await quiz.getByRole('combobox', { name: 'Input' }).selectOption('scripted');
  const meter = quiz.getByRole('meter', { name: 'Microphone level' });
  const level = (detail: number) =>
    page.evaluate((d) => window.dispatchEvent(new CustomEvent('scripted-level', { detail: d })), detail);

  await expect(meter.locator('.threshold')).toHaveAttribute('style', /left: 30%/); // Firm, the default
  await level(0.2);
  await expect(meter).toHaveAttribute('aria-valuenow', '0.2');
  await expect(meter).toHaveAttribute('aria-valuetext', 'Too quiet');
  await expect(quiz.getByText('Too quiet')).toBeVisible();
  await level(0.8);
  await expect(meter).toHaveAttribute('aria-valuenow', '0.8');
  await expect(quiz.getByText('Loud enough')).toBeVisible();
  await expect(meter.locator('.fill')).toHaveClass(/loud/);
});
