/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

// WebKit is the closest engine to iOS Safari, where Stan runs the app.
export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['json', { outputFile: 'reports/e2e.json' }]] : 'list',
  use: { baseURL: 'http://localhost:4173/music-game/' },
  webServer: { command: 'npm run build && npm run preview', url: 'http://localhost:4173/music-game/' },
  projects: [
    { name: 'iphone', use: { ...devices['iPhone 15'] } },
    { name: 'ipad', use: { ...devices['iPad (gen 11)'] } },
  ],
});
