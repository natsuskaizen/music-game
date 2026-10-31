<script lang="ts">
  import { gsap } from 'gsap';
  import Piano from './Piano.svelte';
  import { staffPos, ledgerPositions, label, start, answerKey, next, midiOf, type ClefMode } from '../shared/quiz';
  import { playNote } from '../shared/sound';
  import { settings } from '../shared/settings';
  import { listen, type Listening } from '../shared/mic';
  import { S, LEFT, RIGHT, NOTE_X, GLYPH, yOf, clefY, clefGlyph } from '../shared/staff';

  // Keyboard range per clef setting: up to 3 ledger lines beyond the staff (design §6.1).
  const RANGE: Record<ClefMode, { lo: number; hi: number; center: number }> = {
    treble: { lo: 52, hi: 89, center: 71 },  // E3–F6, centered on B4
    bass: { lo: 31, hi: 69, center: 50 },    // G1–A4, centered on D3
    both: { lo: 31, hi: 89, center: 60 },    // G1–F6, centered on middle C
  };

  let clef = $state<ClefMode>('treble');
  let exact = $state(true);
  let showNames = $state(false);
  let sound = $state(true);
  let s = $state(start('treble'));
  let wrongKeys = $state<number[]>([]);
  let heard = $state<number | null>(null);
  let mic = $state<{ on: boolean; msg: string }>({ on: false, msg: '' });
  let listening: Listening | null = null;
  let noteEl: SVGGElement;
  let burstEl: SVGGElement;

  const pos = $derived(staffPos(s.note));
  const target = $derived(midiOf(s.note));
  const accuracy = $derived(s.total ? Math.round((100 * s.firstTry) / s.total) : 0);
  const marks = $derived.by(() => {
    const m = new Map<number, 'wrong' | 'right' | 'heard'>();
    if (heard !== null) m.set(heard, 'heard');
    for (const k of wrongKeys) m.set(k, 'wrong');
    if (s.phase === 'reveal' || s.phase === 'right') m.set(target, 'right');
    return m;
  });

  $effect(() => { settings.update(v => ({ ...v, sound: sound && !mic.on })); }); // never play while listening

  $effect(() => {
    void s.note;
    if (noteEl) gsap.fromTo(noteEl, { x: 48, opacity: 0, scale: 1 },
      { x: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.7)', transformOrigin: '50% 50%' });
  });

  function setClef(c: ClefMode) { clef = c; advance(); }
  function advance() { wrongKeys = []; s = next(s, clef); }

  function burst() {
    const y = yOf(pos);
    for (let i = 0; i < 18; i++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', String(NOTE_X)); c.setAttribute('cy', String(y));
      c.setAttribute('r', String(2 + Math.random() * 3));
      c.setAttribute('class', i % 3 ? 'spark' : 'spark alt');
      burstEl.appendChild(c);
      const a = (i / 18) * Math.PI * 2, d = 40 + Math.random() * 50;
      gsap.to(c, { attr: { cx: NOTE_X + Math.cos(a) * d, cy: y + Math.sin(a) * d }, opacity: 0,
        duration: 0.6, ease: 'power2.out', onComplete: () => c.remove() });
    }
  }

  function press(m: number) {
    const before = s.phase;
    s = answerKey(s, m, exact);
    if (s.phase === before) return;
    if (s.phase === 'right') {
      playNote(s.note);
      burst();
      gsap.to(noteEl, { scale: 1.35, opacity: 0, duration: 0.35, delay: 0.35, transformOrigin: '50% 50%', onComplete: advance });
    } else {
      wrongKeys = [...wrongKeys, m];
      gsap.fromTo(noteEl, { x: -10 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
      if (s.phase === 'reveal') playNote(s.note);
    }
  }

  async function toggleMic() {
    if (mic.on) { listening?.stop(); listening = null; heard = null; mic = { on: false, msg: '' }; return; }
    if (!navigator.mediaDevices?.getUserMedia) {
      mic = { on: false, msg: "The microphone isn't available on this page. It will work in the installed app." };
      return;
    }
    try {
      listening = await listen(press, m => (heard = m));
      mic = { on: true, msg: 'Listening. Play the note on your piano.' };
    } catch {
      mic = { on: false, msg: "The microphone isn't available on this page. It will work in the installed app." };
    }
  }
</script>

<div class="controls">
  <div class="seg" role="radiogroup" aria-label="Clef">
    {#each ['treble', 'bass', 'both'] as const as c}
      <button type="button" role="radio" aria-checked={clef === c} onclick={() => setClef(c)}>{c[0].toUpperCase() + c.slice(1)}</button>
    {/each}
  </div>
  <label class="toggle"><input type="checkbox" id="exact" bind:checked={exact}> Octave must match</label>
  <label class="toggle"><input type="checkbox" id="names" bind:checked={showNames}> Key names</label>
  <label class="toggle"><input type="checkbox" id="sound" bind:checked={sound}> Play the note</label>
  <button type="button" class="mic" class:on={mic.on} onclick={toggleMic} aria-pressed={mic.on}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-2.1a7 7 0 0 0 6-6.9h-2Z"/></svg>
    {mic.on ? 'Stop listening' : 'Listen with mic'}
  </button>
</div>
{#if mic.msg}<p class="micmsg" class:on={mic.on}>{mic.msg}</p>{/if}

<div class="stage">
  <div class="status" aria-live="polite">
    <span>Streak <b>{s.streak}</b></span>
    <span>First-try <b>{accuracy}%</b></span>
    <span class="msg {s.phase}">
      {#if s.phase === 'retry'}Not quite. One more try.
      {:else if s.phase === 'reveal'}It's {label(s.note)}. Tap Continue.
      {:else if s.phase === 'right'}Yes, {label(s.note)}!
      {:else}Find this note on the keyboard{/if}
    </span>
  </div>

  <svg viewBox="0 0 640 248" role="img" aria-label="Staff showing one note">
    {#each [-4, -2, 0, 2, 4] as p}<line class="staffline" x1={LEFT} x2={RIGHT} y1={yOf(p)} y2={yOf(p)} />{/each}
    <line class="staffline" x1={LEFT} x2={LEFT} y1={yOf(4)} y2={yOf(-4)} />
    <text class="smufl" x={LEFT + 12} y={clefY(s.note.clef)} font-size={4 * S}>{clefGlyph(s.note.clef)}</text>
    <g bind:this={noteEl} class="note {s.phase}">
      {#each ledgerPositions(pos) as p}
        <line class="staffline" x1={NOTE_X - S * 1.35} x2={NOTE_X + S * 1.35} y1={yOf(p)} y2={yOf(p)} />
      {/each}
      <text class="smufl head" x={NOTE_X} y={yOf(pos)} text-anchor="middle" font-size={4 * S}>{GLYPH.noteWhole}</text>
      {#if s.phase === 'reveal'}<text class="reveal" x={NOTE_X + S * 2.2} y={yOf(pos) + 6}>{label(s.note)}</text>{/if}
    </g>
    <g bind:this={burstEl}></g>
  </svg>

  <Piano lo={RANGE[clef].lo} hi={RANGE[clef].hi} center={RANGE[clef].center} {marks} {showNames} onpress={press} />

  <div class="continue">
    {#if s.phase === 'reveal'}<button type="button" class="go" onclick={advance}>Continue</button>{/if}
  </div>
</div>

<style>
  .controls { display: flex; flex-wrap: wrap; gap: 10px 18px; align-items: center; }
  .seg { display: inline-flex; border: 1.5px solid var(--line); border-radius: 999px; padding: 3px; background: var(--surface); }
  .seg button { font: 700 14px var(--body); padding: 6px 14px; border-radius: 999px; border: 0; background: none; color: var(--muted); cursor: pointer; }
  .seg button[aria-checked='true'] { background: var(--accent); color: var(--surface); }
  .toggle { display: inline-flex; gap: 7px; align-items: center; font-weight: 700; font-size: 14px; color: var(--muted); cursor: pointer; }
  .toggle input { width: 18px; height: 18px; accent-color: var(--accent); }
  .mic { display: inline-flex; gap: 6px; align-items: center; font: 700 14px var(--body); padding: 7px 14px 7px 10px;
    border-radius: 999px; border: 1.5px solid var(--accent); background: none; color: var(--accent); cursor: pointer; }
  .mic svg { width: 18px; height: 18px; fill: currentColor; }
  .mic.on { background: var(--accent); color: var(--surface); }
  .micmsg { margin: 0; font-size: 14px; color: var(--muted); }
  .micmsg.on { color: var(--accent); font-weight: 700; }

  .stage { display: grid; gap: 10px; background: var(--paper); color: var(--stage-ink); border-radius: 14px; padding: 14px;
    box-shadow: 0 1px 0 var(--line), 0 10px 28px -18px rgb(0 0 0 / 0.45); min-width: 0; }
  .status { display: flex; gap: 16px; align-items: baseline; font-size: 14px; color: var(--stage-muted); flex-wrap: wrap; }
  .status b { color: var(--stage-ink); font-variant-numeric: tabular-nums; }
  .msg { margin-left: auto; font-weight: 700; color: var(--stage-ink); }
  .msg.retry, .msg.reveal { color: var(--wrong); }
  .msg.right { color: var(--right); }
  svg[role='img'] { width: 100%; max-width: 760px; margin: 0 auto; height: auto; display: block; }
  .staffline { stroke: var(--stage-ink); stroke-width: 1.3; }
  .smufl { font-family: Bravura; fill: var(--stage-ink); }
  .note.retry .head, .note.reveal .head { fill: var(--wrong); }
  .note.right .head { fill: var(--right); }
  .reveal { font: 700 20px var(--body); fill: var(--wrong); }
  :global(.spark) { fill: var(--right); }
  :global(.spark.alt) { fill: var(--stage-accent); }
  .continue { min-height: 48px; display: flex; justify-content: center; }
  .go { font: 700 17px var(--body); padding: 12px 32px; border-radius: 999px; border: 0; background: var(--stage-accent); color: #fff; cursor: pointer; touch-action: manipulation; }
  .go:focus-visible, .seg button:focus-visible, .mic:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
</style>
