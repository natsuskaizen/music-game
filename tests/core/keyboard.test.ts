import { expect, test } from 'vitest';
import { KEY_RANGES, keyName, pianoKeys } from '../../src/core/keyboard';

test('M1-AC1 the treble keyboard spans E3 to F6 and starts on a white key', () => {
  const keys = pianoKeys(KEY_RANGES.treble);
  expect(keyName(keys[0]?.midi ?? 0)).toBe('E3');
  expect(keyName(keys.at(-1)?.midi ?? 0)).toBe('F6');
  expect(keys[0]).toEqual({ midi: 52, black: false, whiteIndex: 0 });
});

test('M1-AC1 black keys share the index of the white key to their left', () => {
  const [c, cSharp, d] = pianoKeys({ lo: 60, hi: 62, center: 60 });
  expect(c).toEqual({ midi: 60, black: false, whiteIndex: 0 });
  expect(cSharp).toEqual({ midi: 61, black: true, whiteIndex: 0 });
  expect(d).toEqual({ midi: 62, black: false, whiteIndex: 1 });
});

test('M1-AC1 the grand staff keyboard covers both clefs, G1 to F6, centred on middle C', () => {
  const { lo, hi, center } = KEY_RANGES.both;
  expect([keyName(lo), keyName(hi), keyName(center)]).toEqual(['G1', 'F6', 'C4']);
});

test('M1-AC1 keyName labels white and black keys with their octave', () => {
  expect(keyName(60)).toBe('C4');
  expect(keyName(54)).toBe('F♯3');
});
