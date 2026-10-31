<!-- Tells an iOS Safari tab how to install the app; it vanishes once dismissed or when installed (design §5.2). -->
<script lang="ts">
  import {
    dismissInstallHint,
    installEnv,
    isInstallHintDismissed,
    shouldShowInstallHint,
  } from '../core/install';

  let visible = $state(shouldShowInstallHint(installEnv(navigator), isInstallHintDismissed(localStorage)));

  function dismiss() {
    dismissInstallHint(localStorage);
    visible = false;
  }
</script>

{#if visible}
  <aside class="hint" aria-label="Install the app">
    <span>Install: tap Share, then <strong>Add to Home Screen</strong>.</span>
    <button type="button" onclick={dismiss}>Dismiss</button>
  </aside>
{/if}

<style>
  .hint {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 1rem;
    background: var(--surface);
    border: var(--surface-border);
    border-radius: var(--surface-radius);
    box-shadow: var(--surface-shadow);
    color: var(--text);
  }
  button {
    font: 700 1rem var(--font);
    padding: 0.3rem 0.9rem;
    background: none;
    color: var(--muted);
    border: var(--surface-border);
    border-radius: var(--surface-radius);
    cursor: pointer;
    touch-action: manipulation;
  }
</style>
