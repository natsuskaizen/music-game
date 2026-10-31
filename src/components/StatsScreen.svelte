<!-- The stats screen (design §8.3): each note of the current clef and difficulty on a staff, colored by how well it is known. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { heatRows, seenNotes } from '../core/heatmap';
  import { notePool } from '../core/ranges';
  import type { Settings } from '../core/settings';
  import type { NoteStat } from '../core/stats';
  import { loadStats } from '../storage/db';
  import Staff from './Staff.svelte';

  let { settings, onBack }: { settings: Settings; onBack: () => void } = $props();

  let stats = $state<ReadonlyMap<string, NoteStat>>(new Map());
  const pool = $derived(notePool(settings.clef, settings.difficulty));
  const rows = $derived(heatRows(pool, stats));
  const seen = $derived(seenNotes(pool, stats));
  onMount(() => {
    loadStats()
      .then((stored) => {
        stats = stored;
      })
      .catch(() => undefined);
  });
</script>

<section class="stats" aria-label="Stats">
  <button type="button" class="back" onclick={onBack}>Back</button>
  <p class="legend">Red: needs work · Orange: getting there · Green: known · Grey: not seen yet</p>
  {#each rows as row, i (i)}
    <Staff mode={row.clef} sequence={row.measures} marks={row.heats} />
  {/each}
  {#if seen.length > 0}
    <ol aria-label="Seen notes">
      {#each seen as stat (stat.key)}
        <li>
          {stat.key.replace(':', ' ')}: {Math.round(stat.ewmaAcc * 100)}%, {(stat.ewmaMs / 1000).toFixed(1)} s
        </li>
      {/each}
    </ol>
  {:else}
    <p>Nothing here yet. Play a few questions first.</p>
  {/if}
</section>

<style>
  .stats {
    display: grid;
    gap: 0.75rem;
    justify-items: center;
  }
  .back {
    font: 700 1rem var(--font);
    background: none;
    border: 0;
    color: var(--muted);
    text-decoration: underline;
    cursor: pointer;
  }
  .legend {
    color: var(--muted);
    font-size: 0.85rem;
  }
  ol {
    padding: 0;
    list-style: none;
  }
</style>
