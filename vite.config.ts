/// <reference types="node" />
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
    // CI also writes JSON results for the AC status report (scripts/ac-report).
    reporters: process.env.CI ? ['default', ['json', { outputFile: 'reports/unit.json' }]] : ['default'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**/*.ts'],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
    },
  },
});
