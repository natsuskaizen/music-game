<!-- Draws one whole note, or a sequence of quarters and eighths in measures, on a treble, bass, or grand staff,
     with ledger lines (design §3.1). A listening input's heard note shows as a faint notehead beside a single note. -->
<script lang="ts">
  import { ledgerPositions, pitchLabel, staffPos, type ClefNote } from '../core/pitch';
  import type { Measure } from '../core/sequence';
  import { layoutSequence } from '../core/sequence-layout';
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
    sequence,
    marks = [],
    current,
    mark,
    revealed = false,
    heard,
    noteEl = $bindable(),
  }: {
    mode: ClefMode;
    /** The one note to read; leave out when drawing a `sequence`. */
    note?: ClefNote;
    /** Measures to read in order, drawn instead of `note`. */
    sequence?: Measure[];
    /** Colours each sequence note (in play order) after it is settled. */
    marks?: ('right' | 'wrong' | undefined)[];
    /** Index of the sequence note being read, drawn in the accent colour. */
    current?: number;
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
  const GLYPH = {
    treble: '\uE050',
    bass: '\uE062',
    brace: '\uE000',
    wholeNote: '\uE0A2',
    quarterNote: '\uE0A4',
  };
  const GLYPH_SIZE = 4 * SPACE;
  const WIDTH = 640;
  const LEFT = 56;
  const RIGHT = 616;
  const NOTE_X = 340;
  const HEARD_X = NOTE_X - 3.5 * SPACE;
  const LEDGER_HALF = 1.35 * SPACE;
  // Sequence notes sit closer together, so their ledger lines are shorter.
  const SEQUENCE_LEDGER_HALF = 0.85 * SPACE;
  const SEQUENCE_FROM = LEFT + 4.5 * SPACE;

  const staves = $derived(stavesFor(mode));
  const bounds = $derived(systemBounds(staves));
  // The brace glyph is one staff tall. Stretch it over the system, widening it a little so it doesn't look hairline.
  const braceStretch = $derived((bounds.bottom - bounds.top) / GLYPH_SIZE);
  const noteStave = $derived(staves.find((stave) => stave.clef === note?.clef));
  const pos = $derived(note ? staffPos(note) : 0);
  const layout = $derived(sequence && layoutSequence(sequence, staves, { from: SEQUENCE_FROM, to: RIGHT }));
  const label = $derived(
    sequence
      ? `Sequence of ${String(sequence.flat().length)} notes in ${String(sequence.length)} ${sequence.length === 1 ? 'measure' : 'measures'}`
      : note && `${pitchLabel(note.pitch)} on the ${note.clef} staff`,
  );
  const heardAt = $derived.by(() => {
    const mark = heard === undefined ? undefined : heardMark(heard, mode);
    const stave = staves.find((s) => s.clef === mark?.note.clef);
    return mark && stave ? { ...mark, stave, pos: staffPos(mark.note) } : undefined;
  });
</script>

{#snippet ledgers(x: number, stave: Stave, at: number, half = LEDGER_HALF)}
  {#each ledgerPositions(at) as p (p)}
    <line class="staff-line ledger" x1={x - half} x2={x + half} y1={yOf(stave, p)} y2={yOf(stave, p)} />
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
  {#if layout}
    {#each layout.barlines as x (x)}
      <line class="staff-line" x1={x} x2={x} y1={bounds.top} y2={bounds.bottom} />
    {/each}
    {#each layout.beams as beam (beam.x1)}
      <line class="beam" {...beam} />
    {/each}
    {#each layout.notes as placed, i (i)}
      <g class="note {marks[i] ?? ''}" class:current={i === current}>
        {@render ledgers(placed.x, placed.stave, placed.pos, SEQUENCE_LEDGER_HALF)}
        <text class="glyph" x={placed.x} y={placed.y} text-anchor="middle" font-size={GLYPH_SIZE}
          >{GLYPH.quarterNote}</text
        >
        <line class="stem" {...placed.stem} />
        {#if placed.flag}<line class="stem" {...placed.flag} />{/if}
      </g>
    {/each}
  {:else if note && noteStave}
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
  .note.current .glyph {
    fill: var(--accent);
  }
  .note.right .glyph {
    fill: var(--right);
  }
  .note.wrong .glyph,
  .name {
    fill: var(--wrong);
  }
  .stem,
  .beam {
    stroke: var(--note);
    stroke-width: 2;
    stroke-linecap: butt;
  }
  .beam {
    stroke-width: 8;
  }
  .note.current .stem {
    stroke: var(--accent);
  }
  .note.right .stem {
    stroke: var(--right);
  }
  .note.wrong .stem {
    stroke: var(--wrong);
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
