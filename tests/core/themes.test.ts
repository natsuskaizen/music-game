import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const css = readFileSync('src/themes.css', 'utf8');
const blocks = [...css.matchAll(/(:root(?:\[[^\]]+\])?)\s*\{([^}]*)\}/g)].filter((m) =>
  m[2]?.includes('--current:'),
);

const token = (body: string, name: string) => new RegExp(`${name}:\\s*(#[0-9a-f]{6})`).exec(body)?.[1] ?? '';

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
};

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
};

describe('current-note marker colour', () => {
  test('M10-AC9 every theme defines --current', () => {
    expect(blocks).toHaveLength(3);
  });

  test.each(blocks.map((m) => [m[1] ?? '', m[2] ?? '']))(
    'M10-AC9 %s: --current differs from --wrong and reads on the surface (4.5:1)',
    (_theme, body) => {
      const current = token(body, '--current');
      expect(current).not.toBe(token(body, '--wrong'));
      expect(contrast(current, token(body, '--surface'))).toBeGreaterThanOrEqual(4.5);
    },
  );
});
