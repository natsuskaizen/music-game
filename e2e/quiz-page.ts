// Shared e2e helpers for the quiz screen: open it, read its current note, and find its keys.
import type { Locator, Page } from '@playwright/test';
import type { Pitch } from '../src/core/pitch';

/** The quiz staff's name, e.g. "C4 on the treble staff", and its first word: the key to press. */
export async function staffTarget(quiz: Locator): Promise<{ staffName: string; target: string }> {
  const staffName = (await quiz.getByRole('img').getAttribute('aria-label')) ?? '';
  return { staffName, target: staffName.split(' ')[0] ?? '' };
}

const ACCIDENTALS: Record<string, Pitch['accidental']> = { '#': 1, b: -1 };

/** The pitch of a note label such as "C4", "F#5" or "Bb3". */
export function pitchOfLabel(label: string): Pitch {
  const accidental = ACCIDENTALS[label[1] ?? ''];
  const octave = Number(label.slice(accidental ? 2 : 1));
  return { letter: label[0] as Pitch['letter'], octave, ...(accidental && { accidental }) };
}

/** Opens the quiz from Home (`query` such as "?theme=arcade", optional `clef`) and returns it with its current note and key locators. */
export async function openQuiz(page: Page, query = '', clef?: string) {
  await page.goto(`./${query}`);
  if (clef) await page.getByRole('radio', { name: clef }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  const quiz = page.getByRole('region', { name: 'Quiz' });
  const { staffName, target } = await staffTarget(quiz);
  return {
    quiz,
    staffName,
    target,
    wrongKeys: quiz.locator(`.key:not([aria-label="${target}"])`),
    key: (name: string) => quiz.getByRole('button', { name, exact: true }),
  };
}
