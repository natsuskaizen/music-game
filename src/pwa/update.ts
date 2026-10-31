// Service-worker updates (design §5.2): a new build downloads in the background and waits. The person applies it
// with the Update button, so it never swaps in mid-quiz. Checks run at launch, when the app returns, and hourly.
import { registerSW } from 'virtual:pwa-register';

const HOUR_MS = 60 * 60 * 1000;

let apply: ((reload?: boolean) => Promise<void>) | undefined;

/** Registers the service worker and starts looking for new versions; `onReady` fires once one is downloaded and waiting. */
export function watchForUpdates(onReady: () => void): void {
  apply = registerSW({
    onNeedRefresh: onReady,
    onRegistered(registration) {
      if (!registration) return;
      const check = () => void registration.update();
      setInterval(check, HOUR_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    },
  });
}

/** Switches to the waiting version and reloads the app. */
export function applyUpdate(): void {
  void apply?.(true);
}
