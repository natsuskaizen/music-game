<!-- The sprint's countdown bar (design §14): one clock for the whole session, paused while the app is hidden.
     It lives only while the quiz runs, so "Play again" mounts it afresh with a full bar. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { pause, remaining, resume, startSprint } from '../core/sprint';
  import type { Difficulty } from '../core/ranges';

  let { difficulty, onTimeUp }: { difficulty: Difficulty; onTimeUp: () => void } = $props();

  // svelte-ignore state_referenced_locally
  let clock = $state.raw(startSprint(difficulty, Date.now()));
  // svelte-ignore state_referenced_locally
  let left = $state(clock.lengthMs);

  onMount(() => {
    const tick = () => {
      left = remaining(clock, Date.now());
      if (left === 0) onTimeUp();
    };
    const timer = setInterval(tick, 100);
    const onVisibility = () => {
      clock = document.hidden ? pause(clock, Date.now()) : resume(clock, Date.now());
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  });
</script>

<div
  class="sprint"
  role="progressbar"
  aria-label="Time left"
  aria-valuemin="0"
  aria-valuemax={Math.round(clock.lengthMs / 1000)}
  aria-valuenow={Math.ceil(left / 1000)}
>
  <div class="fill" style:width="{(100 * left) / clock.lengthMs}%"></div>
</div>

<style>
  .sprint {
    height: 0.5rem;
    background: color-mix(in srgb, var(--muted) 30%, transparent);
    border-radius: var(--surface-radius);
    overflow: hidden;
  }
  .fill {
    height: 100%;
    background: var(--accent);
  }
</style>
