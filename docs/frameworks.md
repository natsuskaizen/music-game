# Framework evaluation

> **Decision (2026-10-31): Svelte 5 + SVG + GSAP.** Prototypes of both finalists are in `prototypes/compare/`.

Versions checked on npm on 2026-10-30. What this app needs most is crisp notation,
forms (settings, stats), testability for the CI gates, small offline bundles on iOS,
and "pretty" animation. Physics, tilemaps, and sprite worlds are not needed.

## Options

### 1. Svelte 5 + SVG + GSAP (recommended)
`svelte@5.57`, `gsap@3.15` (GSAP and all its plugins have been free since 2025).
The staff is SVG in the DOM, either drawn by hand or with VexFlow, which outputs SVG natively. Animation comes from GSAP.

- **Pros**
  - Vector notation stays sharp at any zoom.
  - Forms and stats are trivial to build.
  - Smallest bundle, about 60 KB gz with GSAP.
  - **Easiest to test**: Playwright can click `getByRole('button', { name: 'C' })` and assert on DOM.
    Canvas apps need test hooks, so this is the best fit for the gates you want.
  - Svelte reads like HTML, with little boilerplate.
- **Cons**
  - No built-in particles or shaders. You add `canvas-confetti` or a small Pixi layer for big effects.
  - Game-feel takes more hand-work than in a game engine.

```svelte
<!-- Note.svelte -->
<script lang="ts">
  import { gsap } from 'gsap';
  let { y, state } = $props<{ y: number; state: 'idle' | 'right' | 'wrong' }>();
  let el: SVGGElement;
  $effect(() => { if (state === 'wrong') gsap.fromTo(el, { x: -6 }, { x: 0, duration: 0.3, ease: 'elastic.out' }); });
</script>
<g bind:this={el} class={state}><text y={y} class="bravura">{''}</text></g>
```

### 2. Phaser 4
`phaser@4.2.1`. A full 2D game framework.

- **Pros**
  - Tweens, particles, shaders, scene management, and a sound manager with the iOS audio unlock built in.
  - The best "game feel" for the least effort.
  - Big community.
- **Cons**
  - About 350 KB gz.
  - No notation, so you draw the staff with glyphs.
  - Text is rasterized, so it blurs without DPR tuning.
  - Forms need a DOM overlay anyway.
  - Canvas makes e2e tests harder: you have to expose state via `window.__game` hooks.
  - Many examples still target Phaser 3.

### 3. PixiJS 8 + GSAP
`pixi.js@8.22`. A fast 2D WebGL renderer, not a full framework.

- **Pros**
  - Lighter than Phaser and tree-shakeable.
  - Excellent effects and filters.
  - Pairs with any DOM UI. You could use Svelte for menus with a Pixi canvas only for the staff, or only for effects.
- **Cons**
  - You build scenes, input, and audio yourself (add Howler or Web Audio).
  - Same canvas testability and text issues as Phaser.

### 4. Godot 4 (web export)
Editor-based engine. Its language, GDScript, is close to Python.

- **Pros**
  - Strong visual editor and animation tools.
  - Python-like scripting.
  - Could also ship as a native iOS app later.
- **Cons**
  - Web builds are about 20–40 MB (wasm), with slow first load on iPhone.
  - Threaded builds need COOP/COEP headers, which **GitHub Pages can't set**, so you're stuck with single-threaded export.
  - iOS Safari audio quirks.
  - Weakest fit for a small PWA, and harder to CI-test.

### 5. KAPLAY
`kaplay@3001`. A simple, fun JS game library (the successor to Kaboom).

- **Pros**: very quick to prototype and approachable.
- **Cons**
  - Smaller community and ecosystem.
  - Weaker text and UI.
  - Same canvas testing issues.
  - Less proven for a polished app.

## Summary

| | Notation crispness | Pretty effects | Forms/UI | Testability | Bundle | Fit |
|---|---|---|---|---|---|---|
| Svelte + SVG + GSAP | ★★★ | ★★ | ★★★ | ★★★ | ★★★ | **Best overall** |
| Phaser 4 | ★★ | ★★★ | ★ | ★ | ★★ | Best if game-feel is the priority |
| PixiJS 8 + GSAP | ★★ | ★★★ | ★ (pair with DOM) | ★ | ★★ | Effects layer add-on |
| Godot 4 | ★★ | ★★★ | ★★ | ★ | ★ | Poor fit for a PWA |
| KAPLAY | ★ | ★★ | ★ | ★ | ★★ | Prototype only |

**Recommendation**: Svelte 5 + SVG + GSAP. If the M1 look-and-feel spike shows we need
heavier effects, add a small PixiJS canvas behind the staff for particles only. That keeps
notation, UI, and tests in the DOM. The core (`src/core/`) is framework-agnostic in every option.
