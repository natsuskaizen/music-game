import { expect, test } from 'vitest';
import { parseBackup, rebuildStats, serializeBackup } from '../../src/core/backup';
import { applyAttempt, newStat, type Attempt } from '../../src/core/stats';

const attempt = (over: Partial<Attempt> = {}): Attempt => ({
  ts: 1000,
  key: 'treble:C4',
  input: 'piano',
  answer: { kind: 'pitch', midi: 60 },
  tries: 1,
  correct: true,
  ms: 1200,
  ...over,
});

test('M4-AC6 a backup parses back to the same attempts', () => {
  const attempts = [attempt(), attempt({ ts: 2000, answer: null, correct: false, tries: 2 })];
  expect(parseBackup(serializeBackup(attempts))).toEqual(attempts);
});

test.each([
  ['not json', 'oops'],
  ['a wrong version', '{"v":2,"attempts":[]}'],
  ['no attempts list', '{"v":1}'],
  [
    'an attempt missing its key',
    '{"v":1,"attempts":[{"ts":1,"ms":1,"input":"p","correct":true,"tries":1,"answer":null}]}',
  ],
  ['three tries', JSON.stringify({ v: 1, attempts: [attempt({ tries: 3 as 1 })] })],
  [
    'an answer of an unknown kind',
    JSON.stringify({ v: 1, attempts: [attempt({ answer: { kind: 'tap' } as never })] }),
  ],
])('M4-AC6 %s is refused', (_name, text) => {
  expect(parseBackup(text)).toBeNull();
});

test('M9-AC5 a letter answer survives a backup, a bad letter is refused', () => {
  const letter = attempt({ answer: { kind: 'letter', letter: 'F' } });
  expect(parseBackup(serializeBackup([letter]))).toEqual([letter]);
  expect(
    parseBackup(
      JSON.stringify({ v: 1, attempts: [attempt({ answer: { kind: 'letter', letter: 'H' } as never })] }),
    ),
  ).toBeNull();
});

test('M4-AC6 stats rebuild by replaying attempts oldest first', () => {
  const first = attempt({ ts: 1000 });
  const second = attempt({ ts: 2000, correct: false, tries: 2 });
  const expected = applyAttempt(applyAttempt(newStat('treble:C4'), first), second);
  expect(rebuildStats([second, first])).toEqual([expected]);
});
