<!-- The results screen (design §8.3): how the session went, with Play again (not in review) and Home. -->
<script lang="ts">
  import type { Results } from '../core/results';

  let {
    results,
    review = false,
    onAgain,
    onHome,
  }: { results: Results; review?: boolean; onAgain: () => void; onHome: () => void } = $props();

  const seconds = (ms: number) => (ms / 1000).toFixed(1);
  const noteName = (key: string) => key.replace(':', ' ');
</script>

<div class="results">
  <p class="msg right">
    {review ? 'No weak notes left. ' : ''}Session done: {results.firstTry} of {results.total} right on the first
    try ({results.accuracyPercent}%).
  </p>
  {#if results.total > 0}
    <p>Average time <b>{seconds(results.averageMs)} s</b></p>
    <div>
      <p>Slowest notes</p>
      <ol aria-label="Slowest notes">
        {#each results.slowest as slow (slow.key)}
          <li>{noteName(slow.key)} <b>{seconds(slow.ms)} s</b></li>
        {/each}
      </ol>
    </div>
  {/if}
  <div class="actions">
    {#if !review}<button type="button" onclick={onAgain}>Play again</button>{/if}
    <button type="button" onclick={onHome}>Home</button>
  </div>
</div>

<style>
  .results {
    display: grid;
    justify-items: center;
    gap: 0.75rem;
    padding: 1rem 0;
    color: var(--muted);
  }
  p,
  ol {
    margin: 0;
  }
  ol {
    padding: 0;
    list-style: none;
  }
  b {
    color: var(--text);
  }
  .msg {
    font-weight: 700;
    color: var(--right);
  }
  .actions {
    display: flex;
    gap: 0.75rem;
  }
  button {
    padding: 0.75rem 2rem;
    font: 700 0.95rem var(--font);
    background: var(--accent);
    color: var(--on-accent);
    border: 0;
    border-radius: var(--surface-radius);
    cursor: pointer;
    touch-action: manipulation;
  }
</style>
