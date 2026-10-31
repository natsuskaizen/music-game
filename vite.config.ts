/// <reference types="node" />
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

// `base` matches the GitHub Pages path: https://natsuskaizen.github.io/music-game/
export default defineConfig({
  base: '/music-game/',
  plugins: [
    svelte(),
    // Installable, offline-first shell (design §5.1). `prompt` keeps a new version waiting until the person taps
    // the Update button (src/pwa/update.ts), so it never swaps in mid-quiz.
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2,m4a,mp3}'] },
      manifest: {
        name: 'Sight Reading Trainer',
        short_name: 'SightRead',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f3ead6',
        theme_color: '#f3ead6',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  build: { target: 'es2022' },
  // Unit tests that mount components (the input contract suite) need Svelte's browser build, not its server one.
  resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
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
