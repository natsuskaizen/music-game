import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build` keeps Svelte and Phaser in separate chunks so their sizes can be compared.
// `npm run build:single` inlines everything into one HTML file for sharing.
export default defineConfig({
  plugins: [svelte(), ...(process.env.SINGLE ? [viteSingleFile()] : [])],
  build: {
    target: 'es2022',
    assetsInlineLimit: 8192,
    // PAGE=keyboard builds only that page (single-file builds need one entry).
    rollupOptions: { input: process.env.PAGE ? `${process.env.PAGE}.html` : ['index.html', 'keyboard.html'] },
  },
});
