<!-- Handwriting input (design §3.4, M9-6, M10-2): write the note's letter with a finger. Once the finger has been lifted
     for a moment the ink is read as a letter (`recognizeLetter`), answered with the ♯ or ♭ chosen beside the pad,
     and cleared for the next one. -->
<script lang="ts">
  import { recognizeLetter, type Point, type Stroke } from '../core/handwriting';
  import type { Accidental } from '../core/pitch';
  import type { InputProps } from '../inputs/types';

  let { emit }: InputProps = $props();

  /** How long the finger stays lifted before the letter counts as finished; E and F take several strokes. */
  const PAUSE_MS = 600;

  let strokes = $state<Stroke[]>([]);
  let read = $state<string>();
  let accidental = $state<Accidental>(0);
  const MARK = { [-1]: '♭', 0: '', 1: '♯' } as const;
  const CHOICES: { value: Accidental; mark: string; name: string }[] = [
    { value: 1, mark: '♯', name: 'Sharp' },
    { value: -1, mark: '♭', name: 'Flat' },
  ];
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
    read = letter + MARK[accidental];
    emit({ kind: 'letter', letter, ...(accidental && { accidental }) });
    accidental = 0;
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
  <div class="accidentals" role="group" aria-label="Accidental">
    {#each CHOICES as choice (choice.value)}
      <button
        type="button"
        aria-label={choice.name}
        aria-pressed={accidental === choice.value}
        onclick={() => (accidental = accidental === choice.value ? 0 : choice.value)}>{choice.mark}</button
      >
    {/each}
  </div>
  <p class="read" aria-live="polite">
    {read ? `Read as ${read}` : 'Write A to G with your finger (tap ♯ or ♭ first for a black key)'}
  </p>
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
  .accidentals {
    display: flex;
    gap: 0.5rem;
  }
  .accidentals button {
    min-width: 3rem;
    min-height: 2.75rem;
    font-size: 1.5rem;
    color: var(--ink);
    background: var(--surface);
    border: var(--surface-border);
    border-radius: var(--surface-radius);
  }
  .accidentals button[aria-pressed='true'] {
    color: var(--on-accent);
    background: var(--accent);
  }
  .read {
    margin: 0;
    color: var(--muted);
  }
</style>
