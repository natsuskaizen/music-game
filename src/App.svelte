<script lang="ts">
  import Home from './components/Home.svelte';
  import Quiz from './components/Quiz.svelte';
  import UpdateBanner from './components/UpdateBanner.svelte';
  import SettingsScreen from './components/SettingsScreen.svelte';
  import StatsScreen from './components/StatsScreen.svelte';
  import Staff from './components/Staff.svelte';
  import type { Clef, ClefNote, Pitch } from './core/pitch';
  import type { Measure } from './core/sequence';
  import type { ClefMode } from './core/staff-layout';
  import { loadSettings, saveSettings, type Settings } from './core/settings';
  import type { NoteStat } from './core/stats';
  import { applyUpdate, watchForUpdates } from './pwa/update';
  import { THEME_NAMES, type Theme } from './core/theme';

  let { theme }: { theme: Theme } = $props();

  let updateReady = $state(false);
  watchForUpdates(() => (updateReady = true));
  let screen = $state<'home' | 'settings' | 'stats' | 'quiz' | 'review'>('home');
  let reviewStats = $state.raw<ReadonlyMap<string, NoteStat>>(new Map());
  let settings = $state(loadSettings(localStorage));

  function change(next: Settings) {
    settings = next;
    saveSettings(localStorage, next);
  }

  // `n('treble', 'A5', 'eighth')`: a note from its clef, pitch name and duration.
  const n = (clef: Clef, name: string, duration: 'quarter' | 'eighth') => ({
    note: { pitch: { letter: name.charAt(0) as Pitch['letter'], octave: Number(name.slice(1)) }, clef },
    duration,
  });
  // 16 notes in 3 measures with ledger lines on both staves, the largest sequence (M5-AC4).
  const SEQUENCE: Measure[] = [
    [
      n('treble', 'A5', 'eighth'),
      n('treble', 'C6', 'eighth'),
      n('treble', 'E6', 'quarter'),
      n('treble', 'F6', 'eighth'),
      n('treble', 'E6', 'eighth'),
      n('treble', 'D6', 'quarter'),
    ],
    [
      n('bass', 'E2', 'quarter'),
      n('bass', 'D2', 'quarter'),
      n('bass', 'C2', 'eighth'),
      n('bass', 'B1', 'eighth'),
      n('bass', 'A1', 'quarter'),
    ],
    [
      n('treble', 'D4', 'quarter'),
      n('treble', 'C4', 'quarter'),
      n('treble', 'B3', 'eighth'),
      n('treble', 'A3', 'eighth'),
      n('treble', 'G3', 'quarter'),
    ],
  ];

  // M1 spike gallery: the extremes of the hard range (3 ledger lines) and middle C on a grand staff.
  const EXAMPLES: { title: string; mode: ClefMode; note: ClefNote }[] = [
    { title: 'Treble', mode: 'treble', note: { pitch: { letter: 'F', octave: 6 }, clef: 'treble' } },
    { title: 'Bass', mode: 'bass', note: { pitch: { letter: 'G', octave: 1 }, clef: 'bass' } },
    { title: 'Grand staff', mode: 'both', note: { pitch: { letter: 'C', octave: 4 }, clef: 'treble' } },
  ];
</script>

<UpdateBanner ready={updateReady} onUpdate={applyUpdate} />
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
  {:else if screen === 'stats'}
    <StatsScreen {settings} onBack={() => (screen = 'home')} />
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
      onStats={() => (screen = 'stats')}
    />
    <section aria-label="Staff gallery">
      {#each EXAMPLES as example (example.title)}
        <figure>
          <Staff mode={example.mode} note={example.note} />
          <figcaption>{example.title}</figcaption>
        </figure>
      {/each}
      <figure>
        <Staff mode="both" sequence={SEQUENCE} />
        <figcaption>Sequence</figcaption>
      </figure>
    </section>
  {/if}
</main>

<style>
  main {
    text-align: center;
    padding: max(2rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right))
      max(2rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left));
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
