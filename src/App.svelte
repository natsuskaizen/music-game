<script lang="ts">
  import Staff from './components/Staff.svelte';
  import type { ClefNote } from './core/pitch';
  import type { ClefMode } from './core/staff-layout';
  import { THEME_NAMES, type Theme } from './core/theme';

  let { theme }: { theme: Theme } = $props();

  // M1 spike gallery: the extremes of the hard range (3 ledger lines) and middle C on a grand staff.
  const EXAMPLES: { title: string; mode: ClefMode; note: ClefNote }[] = [
    { title: 'Treble', mode: 'treble', note: { pitch: { letter: 'F', octave: 6 }, clef: 'treble' } },
    { title: 'Bass', mode: 'bass', note: { pitch: { letter: 'G', octave: 1 }, clef: 'bass' } },
    { title: 'Grand staff', mode: 'both', note: { pitch: { letter: 'C', octave: 4 }, clef: 'treble' } },
  ];
</script>

<main>
  <h1>Sight Reading</h1>
  <nav aria-label="Theme">
    {#each Object.entries(THEME_NAMES) as [id, name] (id)}
      <a href="?theme={id}" aria-current={id === theme ? 'page' : undefined}>{name}</a>
    {/each}
  </nav>
  {#each EXAMPLES as example (example.title)}
    <figure>
      <Staff mode={example.mode} note={example.note} />
      <figcaption>{example.title}</figcaption>
    </figure>
  {/each}
</main>

<style>
  main {
    text-align: center;
    padding: 2rem 1rem;
    max-width: 760px;
    margin: 0 auto;
  }
  nav {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }
  nav a {
    color: var(--muted);
    padding: 0.35rem 0.9rem;
    border: var(--surface-border);
    border-radius: var(--surface-radius);
    text-decoration: none;
  }
  nav a[aria-current='page'] {
    color: var(--surface);
    background: var(--accent);
  }
  figure {
    margin: 0 0 1.5rem;
    padding: 0.75rem 0.5rem;
    background: var(--surface);
    border: var(--surface-border);
    border-radius: var(--surface-radius);
    box-shadow: var(--surface-shadow);
  }
  figcaption {
    color: var(--muted);
  }
</style>
