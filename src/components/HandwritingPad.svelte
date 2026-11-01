<!-- Handwriting input (design §3.4, M9-6): write the note's letter with a finger. Once the finger has been lifted
     for a moment the ink is read as a letter (`recognizeLetter`), answered, and cleared for the next one. -->
<script lang="ts">
  import { recognizeLetter, type Point, type Stroke } from '../core/handwriting';
  import type { Letter } from '../core/pitch';
  import type { InputProps } from '../inputs/types';

  let { emit }: InputProps = $props();

  /** How long the finger stays lifted before the letter counts as finished; E and F take several strokes. */
  const PAUSE_MS = 600;

  let strokes = $state<Stroke[]>([]);
  let read = $state<Letter>();
  let pad = $state<SVGSVGElement>();
  let drawing = false;
  let pending: ReturnType<typeof setTimeout> | undefined;

  const pointOf = (event: PointerEvent): Point => {
    const box = pad?.getBoundingClientRect();
    return { x: event.clientX - (box?.left ?? 0), y: event.clientY - (box?.top ?? 0) };
  };

  const finish = () => {
    const letter = recognizeLetter(strokes);
    strokes = [];
    if (!letter) return;
    read = letter;
    emit({ kind: 'letter', letter });
  };

  const down = (event: PointerEvent) => {
    clearTimeout(pending);
    pad?.setPointerCapture(event.pointerId);
    drawing = true;
    strokes.push([pointOf(event)]);
  };

  const move = (event: PointerEvent) => {
    if (drawing) strokes.at(-1)?.push(pointOf(event));
  };

  const up = () => {
    drawing = false;
    clearTimeout(pending);
    pending = setTimeout(finish, PAUSE_MS);
  };

  $effect(() => () => {
    clearTimeout(pending);
  });
</script>

<div class="writing">
  <svg
    bind:this={pad}
    class="pad"
    role="application"
    aria-label="Writing pad: write the letter"
    onpointerdown={down}
    onpointermove={move}
    onpointerup={up}
    onpointercancel={up}
  >
    {#each strokes as stroke, i (i)}
      <polyline points={stroke.map((p) => [p.x, p.y].join(',')).join(' ')} />
    {/each}
  </svg>
  <p class="read" aria-live="polite">{read ? `Read as ${read}` : 'Write A to G with your finger'}</p>
</div>

<style>
  .writing {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }
  .pad {
    width: min(100%, 22rem);
    aspect-ratio: 4 / 3;
    background: var(--surface);
    border: var(--surface-border);
    border-radius: var(--surface-radius);
    touch-action: none;
  }
  polyline {
    fill: none;
    stroke: var(--ink);
    stroke-width: 6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .read {
    margin: 0;
    color: var(--muted);
  }
</style>
