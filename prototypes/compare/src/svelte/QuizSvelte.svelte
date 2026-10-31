<script lang="ts">
  import { gsap } from 'gsap';
  import { LETTERS, staffPos, ledgerPositions, label, start, answer, next, type Letter } from '../shared/quiz';
  import { settings } from '../shared/settings';
  import { playNote } from '../shared/sound';
  import { S, LEFT, RIGHT, NOTE_X, GLYPH, yOf, clefY, clefGlyph } from '../shared/staff';

  let s = $state(start($settings.clef));
  let noteEl: SVGGElement;
  let burstEl: SVGGElement;

  const pos = $derived(staffPos(s.note));
  const accuracy = $derived(s.total ? Math.round((100 * s.firstTry) / s.total) : 0);

  // Restart when the clef setting changes.
  let lastClef = $settings.clef;
  $effect(() => {
    if ($settings.clef !== lastClef) { lastClef = $settings.clef; s = next(s, lastClef); }
  });

  // Slide each new note in.
  $effect(() => {
    void s.note;
    if (noteEl) gsap.fromTo(noteEl, { x: 48, opacity: 0, scale: 1 },
      { x: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.7)', transformOrigin: '50% 50%' });
  });

  function burst() {
    const y = yOf(pos);
    for (let i = 0; i < 18; i++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', String(NOTE_X)); c.setAttribute('cy', String(y));
      c.setAttribute('r', String(2 + Math.random() * 3));
      c.setAttribute('class', i % 3 ? 'spark' : 'spark alt');
      burstEl.appendChild(c);
      const a = (i / 18) * Math.PI * 2;
      const d = 40 + Math.random() * 50;
      gsap.to(c, { attr: { cx: NOTE_X + Math.cos(a) * d, cy: y + Math.sin(a) * d }, opacity: 0,
        duration: 0.6, ease: 'power2.out', onComplete: () => c.remove() });
    }
  }

  function tap(l: Letter) {
    const before = s.phase;
    s = answer(s, l);
    if (s.phase === before) return;
    if (s.phase === 'right') {
      playNote(s.note);
      burst();
      gsap.to(noteEl, { scale: 1.35, opacity: 0, duration: 0.35, delay: 0.25, transformOrigin: '50% 50%',
        onComplete: () => { s = next(s, $settings.clef); } });
    } else {
      gsap.fromTo(noteEl, { x: -10 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
      if (s.phase === 'reveal') playNote(s.note);
    }
  }

  const proceed = () => { s = next(s, $settings.clef); };
</script>

<div class="quiz">
  <div class="status" aria-live="polite">
    <span>Streak <b>{s.streak}</b></span>
    <span>First-try <b>{accuracy}%</b></span>
    <span class="msg {s.phase}">
      {#if s.phase === 'retry'}Not quite. One more try.
      {:else if s.phase === 'reveal'}It's {label(s.note)}.
      {:else if s.phase === 'right'}Yes, {label(s.note)}!
      {:else}Name this note{/if}
    </span>
  </div>

  <svg viewBox="0 0 640 248" role="img" aria-label="Staff showing one note">
    {#each [-4, -2, 0, 2, 4] as p}
      <line class="staffline" x1={LEFT} x2={RIGHT} y1={yOf(p)} y2={yOf(p)} />
    {/each}
    <line class="staffline" x1={LEFT} x2={LEFT} y1={yOf(4)} y2={yOf(-4)} />
    <text class="smufl" x={LEFT + 12} y={clefY(s.note.clef)} font-size={4 * S}>{clefGlyph(s.note.clef)}</text>

    <g bind:this={noteEl} class="note {s.phase}">
      {#each ledgerPositions(pos) as p}
        <line class="ledger" x1={NOTE_X - S * 1.35} x2={NOTE_X + S * 1.35} y1={yOf(p)} y2={yOf(p)} />
      {/each}
      <text class="smufl head" x={NOTE_X} y={yOf(pos)} text-anchor="middle" font-size={4 * S}>{GLYPH.noteWhole}</text>
      {#if s.phase === 'reveal'}
        <text class="reveal" x={NOTE_X + S * 2.2} y={yOf(pos) + 6}>{label(s.note)}</text>
      {/if}
    </g>
    <g bind:this={burstEl}></g>
  </svg>

  <div class="pad">
    {#each LETTERS as l}
      <button type="button"
        class:wrong={s.wrong.includes(l)}
        class:answer={(s.phase === 'reveal' || s.phase === 'right') && l === s.note.letter}
        disabled={s.wrong.includes(l) || s.phase === 'reveal' || s.phase === 'right'}
        onclick={() => tap(l)}>{l}</button>
    {/each}
  </div>
  <div class="continue">
    {#if s.phase === 'reveal'}<button type="button" class="go" onclick={proceed}>Continue</button>{/if}
  </div>
</div>

<style>
  .quiz { display: grid; gap: 10px; }
  .status { display: flex; gap: 16px; align-items: baseline; font-size: 14px; color: var(--stage-muted); flex-wrap: wrap; }
  .status b { color: var(--stage-ink); font-variant-numeric: tabular-nums; }
  .msg { margin-left: auto; font-weight: 700; color: var(--stage-ink); }
  .msg.retry, .msg.reveal { color: var(--wrong); }
  .msg.right { color: var(--right); }
  svg { width: 100%; height: auto; display: block; }
  .staffline, .ledger { stroke: var(--stage-ink); stroke-width: 1.3; }
  .smufl { font-family: Bravura; fill: var(--stage-ink); }
  .note.retry .head, .note.reveal .head { fill: var(--wrong); }
  .note.right .head { fill: var(--right); }
  .reveal { font: 700 20px 'Atkinson Hyperlegible', system-ui, sans-serif; fill: var(--wrong); }
  :global(.spark) { fill: var(--right); }
  :global(.spark.alt) { fill: var(--stage-accent); }
  .pad { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
  .pad button {
    font: 700 22px 'Atkinson Hyperlegible', system-ui, sans-serif; min-height: 52px; border-radius: 10px;
    border: 1.5px solid var(--stage-line); background: var(--stage-key); color: var(--stage-ink);
    touch-action: manipulation; cursor: pointer; transition: transform 80ms, background 120ms;
  }
  .pad button:active:not(:disabled) { transform: translateY(2px); background: var(--stage-key-down); }
  .pad button:focus-visible, .go:focus-visible { outline: 3px solid var(--stage-accent); outline-offset: 2px; }
  .pad button.wrong { background: var(--wrong); border-color: var(--wrong); color: #fff; opacity: 0.85; }
  .pad button.answer { background: var(--right); border-color: var(--right); color: #fff; }
  .pad button:disabled { cursor: default; }
  .continue { min-height: 48px; display: flex; justify-content: center; }
  .go { font: 700 17px 'Atkinson Hyperlegible', system-ui, sans-serif; padding: 12px 32px; border-radius: 999px;
    border: 0; background: var(--stage-accent); color: #fff; cursor: pointer; touch-action: manipulation; }
</style>
