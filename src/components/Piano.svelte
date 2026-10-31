<!-- On-screen piano input (design §3.2): real buttons named "C4", scrolls sideways on phones. A tap emits the key's exact pitch. -->
<script lang="ts">
  import { KEY_RANGES, keyName, pianoKeys, type PianoKey } from '../core/keyboard';
  import type { InputProps } from '../inputs/types';

  let { mode, marks, emit }: InputProps = $props();

  const MIDDLE_C = 60;
  const range = $derived(KEY_RANGES[mode]);
  const keys = $derived(pianoKeys(range));
  const whiteCount = $derived(keys.filter((k) => !k.black).length);

  let scroller = $state<HTMLDivElement>();
  let viewWidth = $state(0);
  // Fit the range on wide screens; on phones keep keys finger-sized and scroll.
  const keyWidth = $derived(Math.max(38, Math.min(60, (viewWidth - 2) / whiteCount)));
  const blackWidth = $derived(keyWidth * 0.62);
  const leftOf = (k: PianoKey) =>
    k.black ? (k.whiteIndex + 1) * keyWidth - blackWidth / 2 : k.whiteIndex * keyWidth;

  const scrollToCentre = (k: PianoKey) => {
    if (scroller) scroller.scrollLeft = leftOf(k) - viewWidth / 2 + keyWidth / 2;
  };
  const inView = (k: PianoKey) =>
    !!scroller && leftOf(k) >= scroller.scrollLeft && leftOf(k) + keyWidth <= scroller.scrollLeft + viewWidth;

  // Bring the clef's home register into view whenever the range changes.
  $effect(() => {
    const home = keys.find((k) => k.midi === range.center);
    if (home) scrollToCentre(home);
  });

  // A revealed answer may be off-screen on a phone: scroll it into view.
  $effect(() => {
    const answer = keys.find((k) => marks.get(k.midi) === 'right');
    if (answer && !inView(answer)) scrollToCentre(answer);
  });
</script>

<div class="scroller" bind:this={scroller} bind:clientWidth={viewWidth}>
  <div class="bed" style:width="{whiteCount * keyWidth}px" style:height="{keyWidth * 3.4}px">
    {#each keys as k (k.midi)}
      <button
        type="button"
        class="key {k.black ? 'black' : 'white'} {marks.get(k.midi) ?? ''}"
        style:left="{leftOf(k)}px"
        style:width="{k.black ? blackWidth : keyWidth}px"
        aria-label={keyName(k.midi)}
        onclick={() => {
          emit({ kind: 'pitch', midi: k.midi });
        }}
      >
        {#if !k.black && k.midi % 12 === 0}<span>{keyName(k.midi)}</span>{/if}
        {#if k.midi === MIDDLE_C}<i aria-hidden="true"></i>{/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .scroller {
    overflow-x: auto;
    overscroll-behavior-x: contain;
    background: var(--piano-case);
    border-radius: var(--surface-radius);
    padding-top: 8px;
  }
  .bed {
    position: relative;
    margin: 0 auto;
  }
  .key {
    position: absolute;
    top: 0;
    padding: 0;
    border: 0;
    cursor: pointer;
    touch-action: manipulation;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    border-radius: 0 0 var(--key-radius) var(--key-radius);
  }
  .white {
    height: 100%;
    z-index: 1;
    background: var(--key-white);
    border: 1px solid var(--key-white-edge);
    border-top: 0;
  }
  .black {
    height: 62%;
    z-index: 2;
    background: var(--key-black);
  }
  .key:active {
    filter: brightness(0.92);
  }
  .key.right {
    background: var(--right);
    box-shadow: 0 0 var(--mark-glow) var(--right);
  }
  .key.heard {
    background: var(--accent);
    box-shadow: 0 0 var(--mark-glow) var(--accent);
  }
  .key.wrong {
    background: var(--wrong);
    box-shadow: 0 0 var(--mark-glow) var(--wrong);
  }
  span {
    font: 700 11px var(--font);
    color: var(--key-label);
    margin-bottom: 9px;
    pointer-events: none;
  }
  .heard span,
  .right span,
  .wrong span {
    color: var(--on-accent);
  }
  i {
    position: absolute;
    bottom: 30px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent);
  }
  .key:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: -3px;
  }
</style>
