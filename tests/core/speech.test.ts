import { describe, expect, test } from 'vitest';
import { lettersIn } from '../../src/core/speech';

describe('M9-AC6 spoken letters', () => {
  test.each([
    ['see', ['C']],
    ['Sea.', ['C']],
    ['bee', ['B']],
    ['Gee', ['G']],
    ['dee', ['D']],
    ['eff', ['F']],
    ['A', ['A']],
    ['E', ['E']],
  ])('M9-AC6 "%s" is %j', (transcript, letters) => {
    expect(lettersIn(transcript)).toEqual(letters);
  });

  test('M9-AC6 reads several letters in order and skips other words', () => {
    expect(lettersIn('um, B flat then see')).toEqual(['B', 'C']);
  });

  test('M9-AC6 finds no letter in unrelated speech', () => {
    expect(lettersIn('hello there')).toEqual([]);
    expect(lettersIn('')).toEqual([]);
  });
});
