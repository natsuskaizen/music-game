<script lang="ts">
  import Home from './components/Home.svelte';
  import Quiz from './components/Quiz.svelte';
  import UpdateBanner from './components/UpdateBanner.svelte';
  import SettingsScreen from './components/SettingsScreen.svelte';
  import StatsScreen from './components/StatsScreen.svelte';
  import Staff from './components/Staff.svelte';
  import type { KeySignature } from './core/key-signature';
  import type { Clef, ClefNote, Pitch } from './core/pitch';
  import type { Measure } from './core/sequence';
  import type { ClefMode } from './core/staff-layout';
  import { loadSettings, saveSettings, type Settings } from './core/settings';
  import type { NoteStat } from './core/stats';
  import { applyUpdate, watchForUpdates } from './pwa/update';
  import { activeTheme } from './core/theme';

  let updateReady = $state(false);
  watchForUpdates(() => (updateReady = true));
  let screen = $state<'home' | 'settings' | 'stats' | 'quiz' | 'review'>('home');
  let reviewStats = $state.raw<ReadonlyMap<string, NoteStat>>(new Map());
  let settings = $state(loadSettings(localStorage));

  function change(next: Settings) {
    settings = next;
    saveSettings(localStorage, next);
  }

  const theme = $derived(activeTheme(location.search, settings.theme));
  $effect(() => {
    document.documentElement.dataset.theme = theme;
  });

  // `p('F#5')`: a pitch from its name, with an optional # or b.
  const p = (name: string): Pitch => {
    const accidental = ({ '#': 1, b: -1 } as const)[name.charAt(1)];
    return {
      letter: name.charAt(0) as Pitch['letter'],
      ...(accidental && { accidental }),
      octave: Number(name.at(-1)),
    };
  };
  // `n('treble', 'A5', 'eighth')`: a note from its clef, pitch name and duration.
  const n = (clef: Clef, name: string, duration: 'quarter' | 'eighth') => ({
    note: { pitch: p(name), clef },
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

  // In B♭ major: naturals cancel the key's flats, and an accidental holds to the end of its measure (M9-AC2).
  const KEY_SEQUENCE: Measure[] = [
    [
      n('treble', 'E5', 'quarter'),
      n('treble', 'E5', 'quarter'),
      n('treble', 'F#5', 'eighth'),
      n('treble', 'F#5', 'eighth'),
      n('treble', 'Gb5', 'quarter'),
    ],
    [
      n('bass', 'Bb2', 'quarter'),
      n('bass', 'B2', 'quarter'),
      n('bass', 'C#3', 'eighth'),
      n('bass', 'D3', 'eighth'),
      n('bass', 'Bb2', 'quarter'),
    ],
  ];

  // M1 spike gallery: the extremes of the hard range (3 ledger lines) and middle C on a grand staff; then key signatures and accidentals (M9).
  const EXAMPLES: { title: string; mode: ClefMode; note: ClefNote; key?: KeySignature }[] = [
    { title: 'Treble', mode: 'treble', note: { pitch: p('F6'), clef: 'treble' } },
    { title: 'Bass', mode: 'bass', note: { pitch: p('G1'), clef: 'bass' } },
    { title: 'Grand staff', mode: 'both', note: { pitch: p('C4'), clef: 'treble' } },
    { title: 'A major', mode: 'treble', key: 3, note: { pitch: p('G5'), clef: 'treble' } },
    { title: 'A♭ major', mode: 'bass', key: -4, note: { pitch: p('F#3'), clef: 'bass' } },
  ];
</script>

<UpdateBanner ready={updateReady} onUpdate={applyUpdate} />
<main>
  <h1>Sight Reading</h1>
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
          <Staff mode={example.mode} key={example.key} note={example.note} />
          <figcaption>{example.title}</figcaption>
        </figure>
      {/each}
      <figure>
        <Staff mode="both" sequence={SEQUENCE} />
        <figcaption>Sequence</figcaption>
      </figure>
      <figure>
        <Staff mode="both" key={-2} sequence={KEY_SEQUENCE} />
        <figcaption>Sequence in B♭ major</figcaption>
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
