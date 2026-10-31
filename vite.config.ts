import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// `base` matches the GitHub Pages path: https://natsuskaizen.github.io/music-game/
export default defineConfig({
  base: '/music-game/',
  plugins: [svelte()],
  build: { target: 'es2022' },
  test: {
    include: ['tests/**/*.test.ts'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: ['src/core/**/*.ts'],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
    },
  },
});
