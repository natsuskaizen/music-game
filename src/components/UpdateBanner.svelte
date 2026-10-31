<!-- Shown on every screen once a new version is waiting; tapping Update reloads into it (design §5.2). -->
<script lang="ts">
  let { ready, onUpdate }: { ready: boolean; onUpdate: () => void } = $props();
</script>

{#if ready}
  <div class="banner" role="status">
    <span>A new version is ready.</span>
    <button type="button" onclick={onUpdate}>Update now</button>
  </div>
{/if}

<style>
  .banner {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    padding: max(0.6rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) 0.6rem
      max(1rem, env(safe-area-inset-left));
    background: var(--accent);
    color: var(--on-accent);
    font-weight: 700;
  }
  button {
    font: 700 1rem var(--font);
    padding: 0.4rem 1.2rem;
    background: var(--surface);
    color: var(--text);
    border: 0;
    border-radius: var(--surface-radius);
    cursor: pointer;
    touch-action: manipulation;
  }
</style>
