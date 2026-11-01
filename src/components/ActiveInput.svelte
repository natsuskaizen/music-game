<!-- The quiz's current answer input (design §3.4): draws an on-screen input, or starts a headless one and stops it
     when the quiz switches away. Either way its answers go to `emit`. -->
<script lang="ts">
  import MicMeter from './MicMeter.svelte';
  import { pianoInput } from '../inputs/piano';
  import type { InputMethod, InputProps } from '../inputs/types';

  let {
    method,
    mode,
    marks,
    emit,
    onHeard,
    minLevel,
  }: InputProps & {
    method: InputMethod;
    onHeard: (midi: number | undefined) => void;
    /** Loudness a headless input needs to hear a note (meter scale), marked on the meter. */
    minLevel: number;
  } = $props();

  let level = $state(0);
  let failed = $state(false);

  $effect(() => {
    if (!('start' in method)) return;
    let stop: (() => void) | undefined;
    let active = true;
    failed = false;
    // A switch can land before `start` resolves: stop the input as soon as it has started.
    method
      .start(emit, {
        heard: onHeard,
        level: (value) => {
          level = value;
        },
        minLevel,
      })
      .then(
        (stopInput) => {
          if (active) stop = stopInput;
          else stopInput();
        },
        () => {
          if (active) failed = true;
        },
      );
    return () => {
      active = false;
      stop?.();
      onHeard(undefined);
      level = 0;
    };
  });
</script>

{#if 'component' in method}
  {@const Input = method.component}
  <Input {mode} {marks} {emit} />
{:else}
  {@const Keyboard = pianoInput.component}
  {#if failed}
    <p class="listening error" role="alert">
      Can't use the microphone. Allow it for this site in your device settings, or pick another input.
    </p>
  {:else}
    <p class="listening">
      Listening: {method.label}
      {#if method.listens}<MicMeter {level} {minLevel} />{/if}
    </p>
  {/if}
  <Keyboard {mode} {marks} {emit} />
{/if}

<style>
  .listening {
    margin: 0;
    padding: 0.5rem 0;
    color: var(--muted);
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .error {
    color: var(--wrong, var(--muted));
  }
</style>
