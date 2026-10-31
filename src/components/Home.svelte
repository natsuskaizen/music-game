<!-- Home (design §14): pick the clef, open Settings, or Start with the last settings. -->
<script lang="ts">
  import { CLEFS, type Settings } from '../core/settings';
  import type { ClefMode } from '../core/staff-layout';
  import Segmented from './Segmented.svelte';

  let {
    settings,
    onchange,
    onStart,
    onSettings,
  }: {
    settings: Settings;
    onchange: (next: Settings) => void;
    onStart: () => void;
    onSettings: () => void;
  } = $props();
</script>

<section class="home" aria-label="Home">
  <Segmented
    label="Clef"
    options={CLEFS.map((value) => ({ value, text: value }))}
    value={settings.clef}
    onchange={(clef: ClefMode) => {
      onchange({ ...settings, clef });
    }}
  />
  <button type="button" class="link" onclick={onSettings}>Settings</button>
  <button type="button" class="start" onclick={onStart}>Start</button>
  <small class="credit">Piano sound: Salamander Grand Piano by Alexander Holm, CC BY 3.0</small>
</section>

<style>
  .home {
    display: grid;
    justify-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  button {
    font: 700 1rem var(--font);
    cursor: pointer;
    touch-action: manipulation;
  }
  .link {
    background: none;
    border: 0;
    color: var(--muted);
    text-decoration: underline;
  }
  .credit {
    color: var(--muted);
    font-size: 0.75rem;
    text-align: center;
  }
  .start {
    padding: 0.75rem 3rem;
    border: 0;
    border-radius: var(--surface-radius);
    background: var(--accent);
    color: var(--on-accent);
  }
</style>
