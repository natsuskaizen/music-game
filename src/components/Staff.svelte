<!-- Draws one whole note on a treble, bass, or grand staff, with its ledger lines (design §3.1). Kept after the M1 spike.
     A listening input's heard note shows as a faint notehead beside it, so the player sees where their playing lands. -->
<script lang="ts">
  import { ledgerPositions, pitchLabel, staffPos, type ClefNote } from '../core/pitch';
  import {
    SPACE,
    STAFF_LINES,
    clefLinePos,
    heardMark,
    stavesFor,
    systemBounds,
    yOf,
    type ClefMode,
    type Stave,
  } from '../core/staff-layout';

  let {
    mode,
    note,
    mark,
    revealed = false,
    heard,
    noteEl = $bindable(),
  }: {
    mode: ClefMode;
    note: ClefNote;
    /** Colours the note after an answer. */
    mark?: 'right' | 'wrong';
    /** Writes the note's name beside it (design §8.4 reveal). */
    revealed?: boolean;
    /** MIDI note a listening input hears right now, drawn as a faint notehead; `undefined` for silence. */
    heard?: number;
    /** The note's group, for feedback animations. */
    noteEl?: SVGGElement;
  } = $props();

  // SMuFL code points in the Bravura subset.
  const GLYPH = { treble: '\uE050', bass: '\uE062', brace: '\uE000', wholeNote: '\uE0A2' };
  const GLYPH_SIZE = 4 * SPACE;
  const WIDTH = 640;
  const LEFT = 56;
  const RIGHT = 616;
  const NOTE_X = 340;
  const HEARD_X = NOTE_X - 3.5 * SPACE;
  const LEDGER_HALF = 1.35 * SPACE;

  const staves = $derived(stavesFor(mode));
  const bounds = $derived(systemBounds(staves));
  // The brace glyph is one staff tall. Stretch it over the system, widening it a little so it doesn't look hairline.
  const braceStretch = $derived((bounds.bottom - bounds.top) / GLYPH_SIZE);
  const noteStave = $derived(staves.find((stave) => stave.clef === note.clef));
  const pos = $derived(staffPos(note));
  const label = $derived(`${pitchLabel(note.pitch)} on the ${note.clef} staff`);
  const heardAt = $derived.by(() => {
    const mark = heard === undefined ? undefined : heardMark(heard, mode);
    const stave = staves.find((s) => s.clef === mark?.note.clef);
    return mark && stave ? { ...mark, stave, pos: staffPos(mark.note) } : undefined;
  });
</script>

{#snippet ledgers(x: number, stave: Stave, at: number)}
  {#each ledgerPositions(at) as p (p)}
    <line
      class="staff-line ledger"
      x1={x - LEDGER_HALF}
      x2={x + LEDGER_HALF}
      y1={yOf(stave, p)}
      y2={yOf(stave, p)}
    />
  {/each}
{/snippet}

<svg viewBox="0 0 {WIDTH} {bounds.height}" role="img" aria-label={label}>
  {#each staves as stave (stave.clef)}
    {#each STAFF_LINES as p (p)}
      <line class="staff-line" x1={LEFT} x2={RIGHT} y1={yOf(stave, p)} y2={yOf(stave, p)} />
    {/each}
    <text class="glyph" x={LEFT + SPACE * 0.75} y={yOf(stave, clefLinePos(stave.clef))} font-size={GLYPH_SIZE}
      >{GLYPH[stave.clef]}</text
    >
  {/each}
  <line class="staff-line" x1={LEFT} x2={LEFT} y1={bounds.top} y2={bounds.bottom} />
  {#if staves.length > 1}
    <text
      class="glyph"
      text-anchor="end"
      font-size={GLYPH_SIZE}
      transform="translate({LEFT - SPACE * 0.4} {bounds.bottom}) scale({braceStretch / 2} {braceStretch})"
      >{GLYPH.brace}</text
    >
  {/if}
  {#if noteStave}
    <g class="note {mark ?? ''}" bind:this={noteEl}>
      {@render ledgers(NOTE_X, noteStave, pos)}
      <text class="glyph" x={NOTE_X} y={yOf(noteStave, pos)} text-anchor="middle" font-size={GLYPH_SIZE}
        >{GLYPH.wholeNote}</text
      >
      {#if revealed}
        <text class="name" x={NOTE_X + 2.2 * SPACE} y={yOf(noteStave, pos) + SPACE / 2.5}
          >{pitchLabel(note.pitch)}</text
        >
      {/if}
    </g>
  {/if}
  {#if heardAt}
    <g class="heard" aria-hidden="true">
      {@render ledgers(HEARD_X, heardAt.stave, heardAt.pos)}
      {#if heardAt.sharp}
        <text class="sharp" x={HEARD_X - 1.4 * SPACE} y={yOf(heardAt.stave, heardAt.pos) + SPACE / 2.5}
          >♯</text
        >
      {/if}
      <text
        class="glyph"
        x={HEARD_X}
        y={yOf(heardAt.stave, heardAt.pos)}
        text-anchor="middle"
        font-size={GLYPH_SIZE}>{GLYPH.wholeNote}</text
      >
    </g>
  {/if}
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
  .staff-line {
    stroke: var(--staff-line);
    stroke-width: var(--staff-line-width);
    stroke-linecap: var(--staff-line-cap);
  }
  .glyph {
    font-family: Bravura;
    fill: var(--ink);
  }
  .note .glyph {
    fill: var(--note);
  }
  .note.right .glyph {
    fill: var(--right);
  }
  .note.wrong .glyph,
  .name {
    fill: var(--wrong);
  }
  .name {
    font: 700 20px var(--font);
  }
  .heard {
    opacity: 0.45;
  }
  .heard .glyph,
  .sharp {
    fill: var(--accent);
  }
  .sharp {
    font: 700 22px var(--font);
    text-anchor: middle;
  }
</style>
