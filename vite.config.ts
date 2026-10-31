import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// `base` matches the GitHub Pages path: https://natsuskaizen.github.io/music-game/
export default defineConfig({
  base: '/music-game/',
  plugins: [svelte()],
  build: { target: 'es2022' },
});
