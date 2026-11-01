<!-- Draws one whole note, or a sequence of quarters and eighths in measures, on a treble, bass, or grand staff,
     with ledger lines, accidentals and a key signature (design §3.1). A listening input's heard note shows as a faint
     notehead beside a single note. -->
<script lang="ts">
  import type { Heat } from '../core/heatmap';
  import {
    keySignatureMarks,
    keySignatureName,
    keySignatureWidth,
    measureAccidentals,
    type KeySignature,
  } from '../core/key-signature';
  import { ledgerPositions, pitchLabel, staffPos, type Accidental, type ClefNote } from '../core/pitch';
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

  type NoteMark = 'right' | 'wrong' | Heat;

  let {
    mode,
    key = 0,
    note,
    sequence,
    marks = [],
    current,
    mark,
    heard,
    noteEl = $bindable(),
  }: {
    mode: ClefMode;
    /** Sharps (positive) or flats (negative) in the key signature after each clef. */
    key?: KeySignature;
    /** The one note to read; leave out when drawing a `sequence`. */
    note?: ClefNote;
    /** Measures to read in order, drawn instead of `note`. */
    sequence?: Measure[];
    /** Colours each sequence note (in play order): right or wrong once settled, or a heat on the stats screen. */
    marks?: (NoteMark | undefined)[];
    /** Index of the sequence note being read, drawn in the accent colour. */
    current?: number;
    /** Colours the note after an answer. */
    mark?: 'right' | 'wrong';
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
  const ACCIDENTAL_GLYPH: Record<Accidental, string> = { [-1]: '\uE260', 0: '\uE261', 1: '\uE262' };
  const GLYPH_SIZE = 4 * SPACE;
  const WIDTH = 640;
  const LEFT = 56;
  const RIGHT = 616;
  const NOTE_X = 340;
  const HEARD_X = NOTE_X - 3.5 * SPACE;
  // Right edge of an accidental before the whole note, and the left edge of the key signature after the clef.
  const NOTE_ACCIDENTAL_X = NOTE_X - 1.05 * SPACE;
  const KEY_FROM = LEFT + 4 * SPACE;
  const LEDGER_HALF = 1.35 * SPACE;
  // Sequence notes sit closer together, so their ledger lines are shorter.
  const SEQUENCE_LEDGER_HALF = 0.85 * SPACE;
  const SEQUENCE_GAP = 0.5 * SPACE;

  const staves = $derived(stavesFor(mode));
  const bounds = $derived(systemBounds(staves));
  // The brace glyph is one staff tall. Stretch it over the system, widening it a little so it doesn't look hairline.
  const braceStretch = $derived((bounds.bottom - bounds.top) / GLYPH_SIZE);
  const noteStave = $derived(staves.find((stave) => stave.clef === note?.clef));
  const pos = $derived(note ? staffPos(note) : 0);
  const noteAccidental = $derived(note && measureAccidentals([note], key)[0]);
  const sequenceFrom = $derived(KEY_FROM + keySignatureWidth(key) + SEQUENCE_GAP);
  const layout = $derived(
    sequence && layoutSequence(sequence, staves, { from: sequenceFrom, to: RIGHT, key }),
  );
  // A sequence too long for the staff widens it; the SVG scales to fit.
  const right = $derived(Math.max(RIGHT, layout?.barlines.at(-1) ?? RIGHT));
  const subject = $derived(
    sequence
      ? `Sequence of ${String(sequence.flat().length)} notes in ${String(sequence.length)} ${sequence.length === 1 ? 'measure' : 'measures'}`
      : note
        ? `${pitchLabel(note.pitch)} on the ${note.clef} staff`
        : '',
  );
  const label = $derived(key === 0 ? subject : `${subject}, key of ${keySignatureName(key)}`);
  const heardAt = $derived.by(() => {
    const mark = heard === undefined ? undefined : heardMark(heard, mode);
    const stave = staves.find((s) => s.clef === mark?.note.clef);
    return mark && stave ? { ...mark, stave, pos: staffPos(mark.note) } : undefined;
  });
</script>

{#snippet accidentalSign(accidental: Accidental, x: number, y: number)}
  <text class="accidental" {x} {y} text-anchor="end" font-size={GLYPH_SIZE}
    >{ACCIDENTAL_GLYPH[accidental]}</text
  >
{/snippet}

{#snippet ledgers(x: number, stave: Stave, at: number, half = LEDGER_HALF)}
  {#each ledgerPositions(at) as p (p)}
    <line class="staff-line ledger" x1={x - half} x2={x + half} y1={yOf(stave, p)} y2={yOf(stave, p)} />
  {/each}
{/snippet}

<svg viewBox="0 0 {WIDTH + right - RIGHT} {bounds.height}" role="img" aria-label={label}>
  {#each staves as stave (stave.clef)}
    {#each STAFF_LINES as p (p)}
      <line class="staff-line" x1={LEFT} x2={right} y1={yOf(stave, p)} y2={yOf(stave, p)} />
    {/each}
    <text class="glyph" x={LEFT + SPACE * 0.75} y={yOf(stave, clefLinePos(stave.clef))} font-size={GLYPH_SIZE}
      >{GLYPH[stave.clef]}</text
    >
    {#each keySignatureMarks(stave.clef, key) as mark (mark.dx)}
      <text class="glyph key-signature" x={KEY_FROM + mark.dx} y={yOf(stave, mark.pos)} font-size={GLYPH_SIZE}
        >{ACCIDENTAL_GLYPH[mark.accidental]}</text
      >
    {/each}
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
        {#if i === current}
          <ellipse class="current-halo" cx={placed.x} cy={placed.y} rx={SPACE * 1.2} ry={SPACE * 0.9} />
        {/if}
        {@render ledgers(placed.x, placed.stave, placed.pos, SEQUENCE_LEDGER_HALF)}
        {#if placed.accidental}
          {@render accidentalSign(placed.accidental.accidental, placed.accidental.x, placed.y)}
        {/if}
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
      {#if noteAccidental !== undefined}
        {@render accidentalSign(noteAccidental, NOTE_ACCIDENTAL_X, yOf(noteStave, pos))}
      {/if}
      <text class="glyph" x={NOTE_X} y={yOf(noteStave, pos)} text-anchor="middle" font-size={GLYPH_SIZE}
        >{GLYPH.wholeNote}</text
      >
    </g>
  {/if}
  {#if heardAt}
    <g class="heard" aria-hidden="true">
      {@render ledgers(HEARD_X, heardAt.stave, heardAt.pos)}
      {#if heardAt.sharp}
        {@render accidentalSign(1, HEARD_X - 1.05 * SPACE, yOf(heardAt.stave, heardAt.pos))}
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
  .glyph,
  .accidental {
    font-family: Bravura;
    fill: var(--ink);
  }
  /* A note's colour, shared by its notehead, accidental and stem. */
  .note {
    --mark: var(--note);
  }
  .note.fair {
    --mark: var(--accent);
  }
  .note.right,
  .note.strong {
    --mark: var(--right);
  }
  .note.wrong,
  .note.weak {
    --mark: var(--wrong);
  }
  .note.current {
    --mark: var(--current);
  }
  .current-halo {
    fill: var(--current);
    opacity: 0.18;
  }
  .note.unseen {
    --mark: var(--muted);
  }
  .note .glyph,
  .note .accidental {
    fill: var(--mark);
  }
  .stem,
  .beam {
    stroke: var(--note);
    stroke-width: 2;
    stroke-linecap: butt;
  }
  .note .stem {
    stroke: var(--mark);
  }
  .beam {
    stroke-width: 8;
  }
  .heard {
    opacity: 0.45;
  }
  .heard .glyph,
  .heard .accidental {
    fill: var(--accent);
  }
</style>
