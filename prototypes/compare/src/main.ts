import { mount } from 'svelte';
import QuizSvelte from './svelte/QuizSvelte.svelte';
import { loadFonts } from './shared/font';
import { settings } from './shared/settings';
import type { ClefMode } from './shared/quiz';

await loadFonts();
mount(QuizSvelte, { target: document.getElementById('svelte-stage')! });
const { startPhaser } = await import('./phaser/QuizScene');
const game = startPhaser(document.getElementById('phaser-stage')!);
(window as any).__game = game; // test hook for e2e

const grid = document.getElementById('panels')!;
for (const tab of document.querySelectorAll<HTMLButtonElement>('[role="tab"]')) {
  tab.addEventListener('click', () => {
    grid.dataset.active = tab.dataset.panel;
    for (const t of document.querySelectorAll('[role="tab"]')) t.setAttribute('aria-selected', String(t === tab));
    requestAnimationFrame(() => game.scale.refresh());
  });
}
for (const r of document.querySelectorAll<HTMLInputElement>('input[name="clef"]')) {
  r.addEventListener('change', () => settings.update(v => ({ ...v, clef: r.value as ClefMode })));
}
const sound = document.getElementById('sound') as HTMLInputElement;
sound.addEventListener('change', () => settings.update(v => ({ ...v, sound: sound.checked })));
