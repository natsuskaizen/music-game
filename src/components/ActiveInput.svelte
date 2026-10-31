<!-- The quiz's current answer input (design §3.4): draws an on-screen input, or starts a headless one and stops it
     when the quiz switches away. Either way its answers go to `emit`. -->
<script lang="ts">
  import { pianoInput } from '../inputs/piano';
  import type { InputMethod, InputProps } from '../inputs/types';

  let {
    method,
    mode,
    marks,
    emit,
    onHeard,
  }: InputProps & { method: InputMethod; onHeard: (midi: number | undefined) => void } = $props();

  $effect(() => {
    if (!('start' in method)) return;
    let stop: (() => void) | undefined;
    let active = true;
    // A switch can land before `start` resolves: stop the input as soon as it has started.
    void method.start(emit, onHeard).then((stopInput) => {
      if (active) stop = stopInput;
      else stopInput();
    });
    return () => {
      active = false;
      stop?.();
      onHeard(undefined);
    };
  });
</script>

{#if 'component' in method}
  {@const Input = method.component}
  <Input {mode} {marks} {emit} />
{:else}
  {@const Keyboard = pianoInput.component}
  <p class="listening">Listening: {method.label}</p>
  <Keyboard {mode} {marks} {emit} />
{/if}

<style>
  .listening {
    margin: 0;
    padding: 0.5rem 0;
    color: var(--muted);
  }
</style>
