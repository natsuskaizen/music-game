<script lang="ts">
  import Home from './components/Home.svelte';
  import Quiz from './components/Quiz.svelte';
  import SettingsScreen from './components/SettingsScreen.svelte';
  import Staff from './components/Staff.svelte';
  import type { ClefNote } from './core/pitch';
  import type { ClefMode } from './core/staff-layout';
  import { loadSettings, saveSettings, type Settings } from './core/settings';
  import type { NoteStat } from './core/stats';
  import { THEME_NAMES, type Theme } from './core/theme';

  let { theme }: { theme: Theme } = $props();

  let screen = $state<'home' | 'settings' | 'quiz' | 'review'>('home');
  let reviewStats = $state.raw<ReadonlyMap<string, NoteStat>>(new Map());
  let settings = $state(loadSettings(localStorage));

  function change(next: Settings) {
    settings = next;
    saveSettings(localStorage, next);
  }

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
  {#if screen === 'quiz'}
    <Quiz {theme} {settings} onHome={() => (screen = 'home')} />
  {:else if screen === 'review'}
    <Quiz {theme} {settings} review={reviewStats} onHome={() => (screen = 'home')} />
  {:else if screen === 'settings'}
    <SettingsScreen {settings} onchange={change} onBack={() => (screen = 'home')} />
  {:else}
    <Home
      {settings}
      onchange={change}
      onStart={() => (screen = 'quiz')}
      onReview={(stats: ReadonlyMap<string, NoteStat>) => {
        reviewStats = stats;
        screen = 'review';
      }}
      onSettings={() => (screen = 'settings')}
    />
    <section aria-label="Staff gallery">
      {#each EXAMPLES as example (example.title)}
        <figure>
          <Staff mode={example.mode} note={example.note} />
          <figcaption>{example.title}</figcaption>
        </figure>
      {/each}
    </section>
  {/if}
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
