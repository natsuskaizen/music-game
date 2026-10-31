/// <reference types="node" />
import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

// `base` matches the GitHub Pages path: https://natsuskaizen.github.io/music-game/
export default defineConfig({
  base: '/music-game/',
  plugins: [
    svelte(),
    // Installable, offline-first shell (design §5.1). `prompt` waits for an update prompt (M7) instead of
    // swapping versions mid-quiz.
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'script',
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
