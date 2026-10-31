<!-- Settings (design §14): difficulty, questions per session, and the default answer input. Changes save at once. -->
<script lang="ts">
  import { DIFFICULTIES, SESSION_LENGTHS, type Settings } from '../core/settings';
  import type { Difficulty } from '../core/ranges';
  import { available } from '../inputs';
  import Segmented from './Segmented.svelte';

  let {
    settings,
    onchange,
    onBack,
  }: { settings: Settings; onchange: (next: Settings) => void; onBack: () => void } = $props();

  const inputs = available();
</script>

<section class="settings" aria-label="Settings">
  <h2>Settings</h2>
  <div class="row">
    <span>Difficulty</span>
    <Segmented
      label="Difficulty"
      options={DIFFICULTIES.map((value) => ({ value, text: value }))}
      value={settings.difficulty}
      onchange={(difficulty: Difficulty) => {
        onchange({ ...settings, difficulty });
      }}
    />
  </div>
  <div class="row">
    <span>Questions per session</span>
    <Segmented
      label="Questions per session"
      options={SESSION_LENGTHS.map((value) => ({ value, text: value ? String(value) : 'Endless' }))}
      value={settings.questionsPerSession}
      onchange={(questionsPerSession: number) => {
        onchange({ ...settings, questionsPerSession });
      }}
    />
  </div>
  {#if inputs.length > 1}
    <label class="row">
      <span>Default input</span>
      <select
        value={settings.input}
        onchange={(e) => {
          onchange({ ...settings, input: e.currentTarget.value });
        }}
      >
        {#each inputs as option (option.id)}<option value={option.id}>{option.label}</option>{/each}
      </select>
    </label>
  {/if}
  <button type="button" onclick={onBack}>Back</button>
</section>

<style>
  .settings {
    display: grid;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 0.75rem;
    background: var(--surface);
    border: var(--surface-border);
    border-radius: var(--surface-radius);
    box-shadow: var(--surface-shadow);
  }
  h2 {
    margin: 0;
  }
  .row {
    display: grid;
    justify-items: center;
    gap: 0.4rem;
    color: var(--muted);
  }
  select,
  button {
    font: 700 1rem var(--font);
    padding: 0.5rem 1rem;
    color: var(--text);
    background: none;
    border: var(--surface-border);
    border-radius: var(--surface-radius);
    cursor: pointer;
    touch-action: manipulation;
  }
  button {
    justify-self: center;
    background: var(--accent);
    color: var(--on-accent);
    border: 0;
  }
</style>
