<!-- Home (design §14): pick the clef and Single or Sequence, open Settings, or Start with the last settings. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { notePool } from '../core/ranges';
  import { weakNotes, type NoteStat } from '../core/stats';
  import { loadStats } from '../storage/db';
  import { CLEFS, MODES, type QuizMode, type Settings } from '../core/settings';
  import type { ClefMode } from '../core/staff-layout';
  import Segmented from './Segmented.svelte';

  let {
    settings,
    onchange,
    onStart,
    onReview,
    onSettings,
  }: {
    settings: Settings;
    onchange: (next: Settings) => void;
    onStart: () => void;
    onReview: (stats: ReadonlyMap<string, NoteStat>) => void;
    onSettings: () => void;
  } = $props();

  // Review needs stored stats; until they load, or if storage is unavailable, there is nothing to review.
  let stats = $state<ReadonlyMap<string, NoteStat>>(new Map());
  const weakCount = $derived(weakNotes(notePool(settings.clef, settings.difficulty), stats).length);
  onMount(() => {
    loadStats()
      .then((stored) => {
        stats = stored;
      })
      .catch(() => undefined);
  });
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
  <Segmented
    label="Mode"
    options={MODES.map((value) => ({ value, text: value }))}
    value={settings.mode}
    onchange={(mode: QuizMode) => {
      onchange({ ...settings, mode });
    }}
  />
  <button type="button" class="link" onclick={onSettings}>Settings</button>
  <button type="button" class="start" onclick={onStart}>Start</button>
  <button
    type="button"
    class="link"
    disabled={weakCount === 0}
    onclick={() => {
      onReview(stats);
    }}
  >
    Review weak notes ({weakCount})
  </button>
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
  .link:disabled {
    opacity: 0.5;
    cursor: default;
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
