import { describe, expect, test } from 'vitest';
import { themeFromQuery } from '../../src/core/theme';

describe('themeFromQuery', () => {
  test('M1-AC1 picks the theme named in ?theme=', () => {
    expect(themeFromQuery('?theme=storybook')).toBe('storybook');
    expect(themeFromQuery('?x=1&theme=paper')).toBe('paper');
  });

  test('M1-AC1 falls back to Paper & ink when the theme is missing or unknown', () => {
    expect(themeFromQuery('')).toBe('paper');
    expect(themeFromQuery('?theme=neon')).toBe('paper');
  });
});
