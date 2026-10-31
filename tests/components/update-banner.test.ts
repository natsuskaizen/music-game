// @vitest-environment happy-dom
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, expect, test } from 'vitest';
import UpdateBanner from '../../src/components/UpdateBanner.svelte';

const mounted: object[] = [];
afterEach(() => {
  for (const app of mounted.splice(0)) void unmount(app);
});

// The banner's button, or null when nothing shows.
function bannerButton(ready: boolean, onUpdate: () => void): HTMLButtonElement | null {
  const target = document.createElement('div');
  const app = mount(UpdateBanner, { target, props: { ready, onUpdate } });
  mounted.push(app);
  flushSync();
  return target.querySelector('button');
}

test('M0-AC5 no banner shows until a new version is waiting', () => {
  expect(bannerButton(false, () => undefined)).toBeNull();
});

test('M0-AC5 a waiting version shows an Update now button that applies it', () => {
  let applied = 0;
  const button = bannerButton(true, () => applied++);
  expect(button?.textContent).toBe('Update now');
  button?.click();
  expect(applied).toBe(1);
});
