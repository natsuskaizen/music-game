// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from 'vitest';

interface Options {
  onNeedRefresh: () => void;
  onRegistered: (r: { update: () => Promise<void> }) => void;
}
let options: Options | undefined;
const updateSW = vi.fn(() => Promise.resolve());
vi.mock('virtual:pwa-register', () => ({
  registerSW: (o: Options) => {
    options = o;
    return updateSW;
  },
}));

const { applyUpdate, watchForUpdates } = await import('../../src/pwa/update');

afterEach(() => {
  vi.useRealTimers();
});

test('M7-AC5 a waiting version reports ready and applying it reloads into it', () => {
  const ready = vi.fn();
  watchForUpdates(ready);
  options?.onNeedRefresh();
  expect(ready).toHaveBeenCalledOnce();
  applyUpdate();
  expect(updateSW).toHaveBeenCalledWith(true);
});

test('M7-AC5 the app looks for a new version hourly and when it returns to the foreground', () => {
  vi.useFakeTimers();
  const update = vi.fn(() => Promise.resolve());
  watchForUpdates(() => undefined);
  options?.onRegistered({ update });
  vi.advanceTimersByTime(60 * 60 * 1000);
  expect(update).toHaveBeenCalledTimes(1);
  document.dispatchEvent(new Event('visibilitychange'));
  expect(update).toHaveBeenCalledTimes(2);
});
