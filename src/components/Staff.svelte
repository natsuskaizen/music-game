<!-- Draws one whole note on a treble, bass, or grand staff, with its ledger lines (design §3.1). Kept after the M1 spike. -->
<script lang="ts">
  import { ledgerPositions, pitchLabel, staffPos, type ClefNote } from '../core/pitch';
  import {
    SPACE,
    STAFF_LINES,
    clefLinePos,
    stavesFor,
    systemBounds,
    yOf,
    type ClefMode,
  } from '../core/staff-layout';

  let { mode, note }: { mode: ClefMode; note: ClefNote } = $props();

  // SMuFL code points in the Bravura subset.
  const GLYPH = { treble: '\uE050', bass: '\uE062', brace: '\uE000', wholeNote: '\uE0A2' };
  const GLYPH_SIZE = 4 * SPACE;
  const WIDTH = 640;
  const LEFT = 56;
  const RIGHT = 616;
  const NOTE_X = 340;
  const LEDGER_HALF = 1.35 * SPACE;

  const staves = $derived(stavesFor(mode));
  const bounds = $derived(systemBounds(staves));
  // The brace glyph is one staff tall. Stretch it over the system, widening it a little so it doesn't look hairline.
  const braceStretch = $derived((bounds.bottom - bounds.top) / GLYPH_SIZE);
  const noteStave = $derived(staves.find((stave) => stave.clef === note.clef));
  const pos = $derived(staffPos(note));
  const label = $derived(`${pitchLabel(note.pitch)} on the ${note.clef} staff`);
</script>

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
    <g class="note">
      {#each ledgerPositions(pos) as p (p)}
        <line
          class="staff-line ledger"
          x1={NOTE_X - LEDGER_HALF}
          x2={NOTE_X + LEDGER_HALF}
          y1={yOf(noteStave, p)}
          y2={yOf(noteStave, p)}
        />
      {/each}
      <text class="glyph" x={NOTE_X} y={yOf(noteStave, pos)} text-anchor="middle" font-size={GLYPH_SIZE}
        >{GLYPH.wholeNote}</text
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
</style>
