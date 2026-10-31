<!-- A row of exclusive choices (clef, difficulty, session length), one radio button each. -->
<script lang="ts" generics="T extends string | number">
  let {
    label,
    options,
    value,
    onchange,
  }: { label: string; options: { value: T; text: string }[]; value: T; onchange: (value: T) => void } =
    $props();
</script>

<div class="seg" role="radiogroup" aria-label={label}>
  {#each options as option (option.value)}
    <button
      type="button"
      role="radio"
      aria-checked={value === option.value}
      onclick={() => {
        onchange(option.value);
      }}>{option.text}</button
    >
  {/each}
</div>

<style>
  .seg {
    display: inline-flex;
    border: var(--surface-border);
    border-radius: var(--surface-radius);
    overflow: hidden;
  }
  button {
    font: 700 0.95rem var(--font);
    text-transform: capitalize;
    border: 0;
    padding: 0.5rem 1rem;
    background: none;
    color: var(--muted);
    cursor: pointer;
    touch-action: manipulation;
  }
  button[aria-checked='true'] {
    background: var(--accent);
    color: var(--on-accent);
  }
</style>
