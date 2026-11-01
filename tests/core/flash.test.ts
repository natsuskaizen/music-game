import { describe, expect, test } from 'vitest';
import { addFlash, dropFlash, keyMarks, type Flash } from '../../src/core/flash';

const wrong = (id: number, midi: number): Flash => ({ id, midi, mark: 'wrong' });

describe('keyboard flashes', () => {
  test('M10-AC7 a flash is gone once dropped, so the key goes back to normal', () => {
    const flashes = addFlash([], wrong(1, 60));
    expect(keyMarks(flashes, undefined).get(60)).toBe('wrong');
    expect(keyMarks(dropFlash(flashes, 1), undefined).size).toBe(0);
  });

  test('M10-AC7 an old timer cannot remove a newer flash on the same key', () => {
    const flashes = addFlash(addFlash([], wrong(1, 60)), { id: 2, midi: 60, mark: 'right' });
    expect(dropFlash(flashes, 1)).toEqual([{ id: 2, midi: 60, mark: 'right' }]);
  });

  test('M10-AC7 a flash wins over the heard mark on the same key', () => {
    const marks = keyMarks([wrong(1, 60)], 60);
    expect(marks.get(60)).toBe('wrong');
    expect(keyMarks([], 60).get(60)).toBe('heard');
  });
});
