import { expect, test } from 'vitest';
import {
  dismissInstallHint,
  isInstallHintDismissed,
  shouldShowInstallHint,
  type InstallEnv,
} from '../../src/core/install';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1';
const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15';
const tab: InstallEnv = { userAgent: IPHONE, maxTouchPoints: 5, standalone: false };

test('M7-AC2 the hint shows in an iPhone Safari tab', () => {
  expect(shouldShowInstallHint(tab, false)).toBe(true);
});

test('M7-AC2 an iPad that reports a Mac user agent still counts as iOS, a real Mac does not', () => {
  expect(shouldShowInstallHint({ userAgent: MAC, maxTouchPoints: 5, standalone: false }, false)).toBe(true);
  expect(shouldShowInstallHint({ userAgent: MAC, maxTouchPoints: 0, standalone: false }, false)).toBe(false);
});

test('M7-AC2 the hint never shows in the installed app', () => {
  expect(shouldShowInstallHint({ ...tab, standalone: true }, false)).toBe(false);
});

test('M7-AC2 a dismissal is remembered and survives unreadable storage', () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => data.set(k, v),
  };
  expect(isInstallHintDismissed(storage)).toBe(false);
  dismissInstallHint(storage);
  expect(isInstallHintDismissed(storage)).toBe(true);
  expect(shouldShowInstallHint(tab, true)).toBe(false);
  const broken = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
  };
  expect(isInstallHintDismissed(broken)).toBe(false);
  expect(() => {
    dismissInstallHint(broken);
  }).not.toThrow();
});
