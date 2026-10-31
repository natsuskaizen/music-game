/** The look-and-feel themes and their display names (design §14). The first one is the default. */
export const THEME_NAMES = { paper: 'Paper & ink', storybook: 'Storybook', arcade: 'Neon arcade' } as const;

/** A theme id. It is also the `data-theme` value on `<html>` that selects the CSS tokens in `themes.css`. */
export type Theme = keyof typeof THEME_NAMES;

const THEMES = Object.keys(THEME_NAMES) as Theme[];

/** Reads `?theme=` from a URL query string. A missing or unknown value falls back to Paper & ink. */
export function themeFromQuery(search: string): Theme {
  const value = new URLSearchParams(search).get('theme');
  return THEMES.find((theme) => theme === value) ?? 'paper';
}
