// Spoken letters (design §3.4, M9-5): turns what a speech recognizer heard into note letters, so the speech input
// stays a thin wrapper and the word list is unit-tested.
import type { Letter } from './pitch';

/** How recognizers write each letter when it's said on its own ("see", "sea" and "c" are all C). */
const SPOKEN: [Letter, string[]][] = [
  ['A', ['a', 'ay', 'aye', 'eh']],
  ['B', ['b', 'be', 'bee']],
  ['C', ['c', 'see', 'sea', 'cee', 'si']],
  ['D', ['d', 'dee', 'de']],
  ['E', ['e', 'ee']],
  ['F', ['f', 'ef', 'eff']],
  ['G', ['g', 'gee', 'jee', 'ji']],
];

const LETTER_OF_WORD = new Map(
  SPOKEN.flatMap(([letter, words]) => words.map((word) => [word, letter] as const)),
);

/** The letters in a transcript, in order; other words ("sharp", "um") are skipped, so "B flat" is just B. */
export function lettersIn(transcript: string): Letter[] {
  const words = transcript.toLowerCase().match(/[a-z]+/g) ?? [];
  return words.flatMap((word) => {
    const letter = LETTER_OF_WORD.get(word);
    return letter ? [letter] : [];
  });
}
