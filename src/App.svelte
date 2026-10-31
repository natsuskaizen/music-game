<script lang="ts">
  import Staff from './components/Staff.svelte';
  import type { ClefNote } from './core/pitch';
  import type { ClefMode } from './core/staff-layout';

  // M1 spike gallery: the extremes of the hard range (3 ledger lines) and middle C on a grand staff.
  const EXAMPLES: { title: string; mode: ClefMode; note: ClefNote }[] = [
    { title: 'Treble', mode: 'treble', note: { pitch: { letter: 'F', octave: 6 }, clef: 'treble' } },
    { title: 'Bass', mode: 'bass', note: { pitch: { letter: 'G', octave: 1 }, clef: 'bass' } },
    { title: 'Grand staff', mode: 'both', note: { pitch: { letter: 'C', octave: 4 }, clef: 'treble' } },
  ];
</script>

<main>
  <h1>Sight Reading</h1>
  {#each EXAMPLES as example (example.title)}
    <figure>
      <Staff mode={example.mode} note={example.note} />
      <figcaption>{example.title}</figcaption>
    </figure>
  {/each}
</main>

<style>
  main {
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
    text-align: center;
    padding: 2rem 1rem;
    max-width: 760px;
    margin: 0 auto;
  }
  figure {
    margin: 0 0 1.5rem;
  }
</style>
