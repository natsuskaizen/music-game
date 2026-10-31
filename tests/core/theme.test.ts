import { describe, expect, test } from 'vitest';
import { activeTheme, themeFromQuery } from '../../src/core/theme';

describe('themeFromQuery', () => {
  test('M1-AC1 picks the theme named in ?theme=', () => {
    expect(themeFromQuery('?theme=storybook')).toBe('storybook');
    expect(themeFromQuery('?theme=arcade')).toBe('arcade');
    expect(themeFromQuery('?x=1&theme=paper')).toBe('paper');
  });

  test('M1-AC1 returns nothing when the theme is missing or unknown', () => {
    expect(themeFromQuery('')).toBeUndefined();
    expect(themeFromQuery('?theme=neon')).toBeUndefined();
  });
});

describe('activeTheme', () => {
  test('M8-AC1 the ?theme= test hook wins over the saved theme, which is used otherwise', () => {
    expect(activeTheme('?theme=arcade', 'storybook')).toBe('arcade');
    expect(activeTheme('', 'storybook')).toBe('storybook');
    expect(activeTheme('?theme=neon', 'storybook')).toBe('storybook');
  });
});
