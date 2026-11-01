// Writes strokes on a handwriting pad with pointer events, as a finger would, and waits out its pause.
import { vi } from 'vitest';
import type { Stroke } from '../../src/core/handwriting';

/** Draws each stroke on `pad` (down, moves, up), then runs the pad's timer so it reads the letter. */
export function writeOn(pad: Element, strokes: Stroke[]): void {
  vi.useFakeTimers();
  const send = (type: string, { x, y }: { x: number; y: number }) =>
    pad.dispatchEvent(new PointerEvent(type, { pointerId: 1, clientX: x, clientY: y, bubbles: true }));
  for (const [first, ...rest] of strokes) {
    if (!first) continue;
    send('pointerdown', first);
    rest.forEach((point) => send('pointermove', point));
    send('pointerup', rest.at(-1) ?? first);
  }
  vi.runAllTimers();
  vi.useRealTimers();
}
