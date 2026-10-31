/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

// WebKit is the closest engine to iOS Safari, where Stan runs the app.
export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['json', { outputFile: 'reports/e2e.json' }]] : 'list',
  use: { baseURL: 'http://localhost:4173/music-game/' },
  // An e2e-mode build adds the scripted test input (src/inputs/scripted.ts), in its own folder so dist/ stays the shipped build.
  webServer: {
    command: 'npx vite build --mode e2e --outDir dist-e2e && npx vite preview --outDir dist-e2e',
    url: 'http://localhost:4173/music-game/',
  },
  projects: [
    { name: 'iphone', use: { ...devices['iPhone 15'] } },
    { name: 'ipad', use: { ...devices['iPad (gen 11)'] } },
  ],
});
