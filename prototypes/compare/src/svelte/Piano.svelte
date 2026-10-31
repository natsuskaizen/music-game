<script lang="ts">
  type Mark = 'wrong' | 'right' | 'heard';
  let { lo, hi, center, marks, showNames, onpress }: {
    lo: number; hi: number; center: number; marks: Map<number, Mark>; showNames: boolean; onpress: (midi: number) => void;
  } = $props();

  const BLACK = new Set([1, 3, 6, 8, 10]);
  const LETTER = ['C', '', 'D', '', 'E', 'F', '', 'G', '', 'A', '', 'B'];
  const nameOf = (m: number) => {
    const pc = m % 12, oct = Math.floor(m / 12) - 1;
    return BLACK.has(pc) ? `${LETTER[pc - 1]}♯${oct}` : `${LETTER[pc]}${oct}`;
  };

  const layout = $derived.by(() => {
    const keys: { m: number; black: boolean; wi: number }[] = [];
    let wi = 0;
    for (let m = lo; m <= hi; m++) {
      const black = BLACK.has(m % 12);
      keys.push({ m, black, wi });
      if (!black) wi++;
    }
    return { keys, nWhite: wi };
  });

  let scroller: HTMLDivElement;
  let viewW = $state(0);
  // Fit the range on wide screens; on phones keep keys finger-sized and scroll.
  const W = $derived(Math.max(38, Math.min(60, (viewW - 2) / layout.nWhite)));
  const BW = $derived(W * 0.62);

  // Scroll so the clef's home register is in view whenever the range changes.
  $effect(() => {
    const k = layout.keys.find(k => k.m === center);
    if (scroller && k) scroller.scrollLeft = k.wi * W - viewW / 2 + W / 2;
  });
</script>

<div class="scroller" bind:this={scroller} bind:clientWidth={viewW}>
  <div class="bed" style:width="{layout.nWhite * W}px" style:height="{W * 3.4}px">
    {#each layout.keys as k (k.m)}
      <button type="button"
        class="key {k.black ? 'black' : 'white'} {marks.get(k.m) ?? ''}"
        style:left="{k.black ? k.wi * W - BW / 2 : k.wi * W}px"
        style:width="{k.black ? BW : W}px"
        aria-label={nameOf(k.m)}
        onclick={() => onpress(k.m)}>
        {#if !k.black && (showNames || k.m % 12 === 0)}
          <span class:c={k.m % 12 === 0}>{nameOf(k.m)}</span>
        {/if}
        {#if k.m === 60}<i class="mid" aria-hidden="true"></i>{/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .scroller { overflow-x: auto; overscroll-behavior-x: contain; -webkit-overflow-scrolling: touch;
    border-radius: 10px; background: var(--piano-case); padding: 8px 0 0; scrollbar-width: thin; }
  .bed { position: relative; margin: 0 auto; }
  .key { position: absolute; top: 0; border: 0; padding: 0; cursor: pointer; touch-action: manipulation;
    display: flex; flex-direction: column; justify-content: flex-end; align-items: center; }
  .white { height: 100%; background: linear-gradient(#fff, #f2f2ee); border: 1px solid #b9bcc2; border-top: 0;
    border-radius: 0 0 7px 7px; z-index: 1; box-shadow: inset 0 -5px 0 #e0e0da; }
  .black { height: 62%; background: linear-gradient(#3a3f47, #15181d); border-radius: 0 0 5px 5px; z-index: 2;
    box-shadow: inset 0 -4px 0 #000, 0 2px 3px rgb(0 0 0 / 0.35); }
  .white:active { background: #e9ece9; box-shadow: inset 0 -2px 0 #d4d4cd; }
  .black:active { background: #2a2e35; }
  .key span { font: 700 11px var(--body, system-ui); color: #7a808a; margin-bottom: 9px; pointer-events: none; }
  .key span.c { color: var(--stage-accent); }
  .mid { position: absolute; bottom: 30px; width: 6px; height: 6px; border-radius: 50%; background: var(--stage-accent); }
  .key.wrong.white { background: var(--wrong); box-shadow: none; } .key.wrong.black { background: var(--wrong); }
  .key.right.white, .key.right.black { background: var(--right); box-shadow: none; }
  .key.heard.white { background: #cfe8ea; } .key.heard.black { background: #2d6f74; }
  .key.wrong span, .key.right span { color: #fff; }
  .key:focus-visible { outline: 3px solid var(--stage-accent); outline-offset: -3px; }
</style>
