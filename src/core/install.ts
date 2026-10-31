// The "Add to Home Screen" hint (design §5.2): iOS has no install prompt, so Home explains the Share menu itself.

/** What the browser tells us about where the app is running. */
export interface InstallEnv {
  userAgent: string;
  maxTouchPoints: number;
  /** Safari's `navigator.standalone`: true only when launched from the Home Screen. */
  standalone: boolean;
}

const KEY = 'install-hint-dismissed';

// iPadOS Safari reports a Mac user agent, so a Mac with a touch screen is an iPad.
function isIos({ userAgent, maxTouchPoints }: InstallEnv): boolean {
  return /iPhone|iPad|iPod/.test(userAgent) || (userAgent.includes('Macintosh') && maxTouchPoints > 1);
}

/** True in an iOS browser tab that has not been dismissed; never in the installed app. */
export function shouldShowInstallHint(env: InstallEnv, dismissed: boolean): boolean {
  return isIos(env) && !env.standalone && !dismissed;
}

/** Reads the browser's environment (the one place that touches `navigator`). */
export function installEnv(nav: Navigator & { standalone?: boolean }): InstallEnv {
  return {
    userAgent: nav.userAgent,
    maxTouchPoints: nav.maxTouchPoints,
    standalone: nav.standalone === true,
  };
}

/** Whether the hint was dismissed before; unreadable storage counts as not dismissed. */
export function isInstallHintDismissed(storage: Pick<Storage, 'getItem'>): boolean {
  try {
    return storage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

/** Remembers the dismissal so the hint stays away; storage errors are ignored. */
export function dismissInstallHint(storage: Pick<Storage, 'setItem'>): void {
  try {
    storage.setItem(KEY, '1');
  } catch {
    // The hint then shows again next visit, which is harmless.
  }
}
