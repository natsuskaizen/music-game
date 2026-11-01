<!-- Settings (design §14): theme, difficulty, questions per session, timer, accidentals and key signature, the default answer input, mic loudness, and sound. Changes save at once. -->
<script lang="ts">
  import { KEY_SIGNATURES, keyLabel, type KeyChoice } from '../core/key-signature';
  import { MIC_LEVELS } from '../core/listen';
  import { DIFFICULTIES, SESSION_LENGTHS, type Settings } from '../core/settings';
  import { SPRINT_SECONDS } from '../core/sprint';
  import { VOLUMES, type SoundSettings } from '../core/sound';
  import type { Difficulty } from '../core/ranges';
  import { THEME_IDS, THEME_NAMES, type Theme } from '../core/theme';
  import { available } from '../inputs';
  import { exportProgress, importProgress } from '../storage/backup-file';
  import Segmented from './Segmented.svelte';

  let {
    settings,
    onchange,
    onBack,
  }: { settings: Settings; onchange: (next: Settings) => void; onBack: () => void } = $props();

  const inputs = available();
  const TOGGLES: { key: keyof Omit<SoundSettings, 'volume'>; text: string }[] = [
    { key: 'on', text: 'Sound' },
    { key: 'onShow', text: 'Play the note when it appears' },
    { key: 'onWrong', text: 'Play the note after a wrong try' },
    { key: 'ignoreSilentSwitch', text: 'Play with the silent switch on' },
  ];
  const VOLUME_NAMES = ['Quiet', 'Medium', 'Loud'];
  const MIC_LEVEL_NAMES = ['Soft', 'Firm', 'Loud'];
  const canListen = inputs.some((input) => 'listens' in input && input.listens);
  let backupMessage = $state('');
  async function runBackup(task: () => Promise<string>) {
    try {
      backupMessage = await task();
    } catch {
      backupMessage = 'That did not work. Your progress on this device is unchanged.';
    }
  }
  const exportClicked = () => runBackup(async () => ((await exportProgress()) ? 'Backup ready.' : ''));
  const importPicked = (file: File) =>
    runBackup(async () => {
      const count = await importProgress(file);
      return count === null
        ? 'That file is not a backup. Nothing changed.'
        : `Restored ${String(count)} answers.`;
    });
  // Random first, then C major, sharp keys and flat keys; a select's value is a string, so options carry their index.
  const KEY_OPTIONS: { value: KeyChoice; text: string }[] = [
    { value: 'random', text: 'Random each session' },
    ...[0, ...KEY_SIGNATURES.filter((k) => k > 0), ...KEY_SIGNATURES.filter((k) => k < 0).reverse()].map(
      (value) => ({
        value,
        text: keyLabel(value),
      }),
    ),
  ];
  const setSound = (change: Partial<SoundSettings>) => {
    onchange({ ...settings, sound: { ...settings.sound, ...change } });
  };
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
  <div class="row">
    <span>Theme</span>
    <Segmented
      label="Theme"
      options={THEME_IDS.map((value) => ({ value, text: THEME_NAMES[value] }))}
      value={settings.theme}
      onchange={(theme: Theme) => {
        onchange({ ...settings, theme });
      }}
    />
  </div>
  <label class="check">
    <input
      type="checkbox"
      checked={settings.timer}
      onchange={(e) => {
        onchange({ ...settings, timer: e.currentTarget.checked });
      }}
    />
    Timer: race the clock ({SPRINT_SECONDS[settings.difficulty]} s for the session)
  </label>
  <label class="check">
    <input
      type="checkbox"
      checked={settings.accidentals}
      onchange={(e) => {
        onchange({ ...settings, accidentals: e.currentTarget.checked });
      }}
    />
    Include sharps, flats and naturals
  </label>
  <label class="row">
    <span>Key signature</span>
    <select
      value={String(KEY_OPTIONS.findIndex((option) => option.value === settings.key))}
      onchange={(e) => {
        const key = KEY_OPTIONS[Number(e.currentTarget.value)]?.value ?? 0;
        onchange({ ...settings, key });
      }}
    >
      {#each KEY_OPTIONS as option, i (option.value)}<option value={String(i)}>{option.text}</option>{/each}
    </select>
  </label>
  <label class="check">
    <input
      type="checkbox"
      checked={settings.accidentalsOnNote}
      onchange={(e) => {
        onchange({ ...settings, accidentalsOnNote: e.currentTarget.checked });
      }}
    />
    Write sharps and flats on the note, with no key signature
  </label>
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
  {#if canListen}
    <div class="row">
      <span>Mic hears notes played at least</span>
      <Segmented
        label="Mic loudness"
        options={MIC_LEVELS.map((value, i) => ({ value, text: MIC_LEVEL_NAMES[i] ?? '' }))}
        value={settings.micLevel}
        onchange={(micLevel: number) => {
          onchange({ ...settings, micLevel });
        }}
      />
    </div>
  {/if}
  <fieldset class="row sound">
    <legend>Sound</legend>
    {#each TOGGLES as toggle (toggle.key)}
      <label class="check">
        <input
          type="checkbox"
          checked={settings.sound[toggle.key]}
          disabled={toggle.key !== 'on' && !settings.sound.on}
          onchange={(e) => {
            setSound({ [toggle.key]: e.currentTarget.checked });
          }}
        />
        {toggle.text}
      </label>
    {/each}
    <Segmented
      label="Volume"
      options={VOLUMES.map((value, i) => ({ value, text: VOLUME_NAMES[i] ?? '' }))}
      value={settings.sound.volume}
      onchange={(volume: number) => {
        setSound({ volume });
      }}
    />
  </fieldset>
  <fieldset class="row backup">
    <legend>Backup</legend>
    <button type="button" onclick={exportClicked}>Export progress</button>
    <label class="file">
      Restore from backup (replaces progress on this device)
      <input
        type="file"
        accept="application/json,.json"
        onchange={(e) => {
          const file = e.currentTarget.files?.[0];
          e.currentTarget.value = '';
          if (file) void importPicked(file);
        }}
      />
    </label>
    <p role="status">{backupMessage}</p>
  </fieldset>
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
  fieldset {
    margin: 0;
    padding: 0;
    border: 0;
  }
  .check {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    color: var(--text);
  }
  .file {
    display: grid;
    gap: 0.4rem;
  }
  p {
    margin: 0;
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
