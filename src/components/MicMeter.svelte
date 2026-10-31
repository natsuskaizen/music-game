<!-- The mic level meter (M7-1): a tall track with a live fill, the "loud enough" zone tinted from the threshold mark,
     and a label that says when a note would count. Theme tokens only. -->
<script lang="ts">
  let { level, minLevel }: { level: number; minLevel: number } = $props();

  const percent = (value: number) => `${String(Math.round(Math.min(Math.max(value, 0), 1) * 100))}%`;
  const loud = $derived(level >= minLevel);
</script>

<span class="wrap">
  <span
    class="meter"
    role="meter"
    aria-label="Microphone level"
    aria-valuemin="0"
    aria-valuemax="1"
    aria-valuenow={level}
    aria-valuetext={loud ? 'Loud enough' : 'Too quiet'}
  >
    <span class="zone" style:left={percent(minLevel)}></span>
    <span class="fill" class:loud style:width={percent(level)}></span>
    <span class="threshold" style:left={percent(minLevel)}></span>
  </span>
  <span class="status" class:loud>{loud ? 'Loud enough' : 'Too quiet'}</span>
</span>

<style>
  .wrap {
    flex: 1;
    max-width: 16rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .meter {
    position: relative;
    flex: 1;
    height: 1.25rem;
    overflow: hidden;
    background: var(--surface);
    border: var(--surface-border);
    border-radius: var(--surface-radius);
  }
  /* Everything right of the threshold is the zone where a note counts. */
  .zone {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    background: var(--accent);
    opacity: 0.18;
  }
  .fill {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    background: var(--muted);
  }
  .fill.loud {
    background: var(--accent);
  }
  .threshold {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--text);
  }
  .status {
    min-width: 5.5rem;
    font-size: 0.85rem;
    color: var(--muted);
  }
  .status.loud {
    color: var(--right);
  }
</style>
