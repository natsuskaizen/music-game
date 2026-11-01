// @vitest-environment happy-dom
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { Answer } from '../../src/core/session';
import { speechInput } from '../../src/inputs/speech';

/** A stand-in recognizer: the test says what it heard, as one result per utterance. */
class FakeRecognizer {
  static last: FakeRecognizer | undefined;
  onstart: (() => void) | null = null;
  onresult: ((event: { resultIndex: number; results: unknown }) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  starts = 0;
  aborted = false;
  constructor() {
    FakeRecognizer.last = this;
  }
  start() {
    this.starts++;
    queueMicrotask(() => this.onstart?.());
  }
  abort() {
    this.aborted = true;
  }
  /** Reports `transcripts` as the session's results so far, the last one starting at `resultIndex`. */
  hear(transcripts: string[], resultIndex = transcripts.length - 1) {
    const results = transcripts.map((transcript) => [{ transcript }]);
    this.onresult?.({ resultIndex, results });
  }
}

const recognizer = () => {
  if (!FakeRecognizer.last) throw new Error('not started');
  return FakeRecognizer.last;
};

afterEach(() => {
  vi.unstubAllGlobals();
  FakeRecognizer.last = undefined;
});

describe('M9-AC6 speech input', () => {
  test('M9-AC6 is hidden when the browser has no speech recognition', () => {
    expect(speechInput.isAvailable()).toBe(false);
    vi.stubGlobal('webkitSpeechRecognition', FakeRecognizer);
    expect(speechInput.isAvailable()).toBe(true);
  });

  test('M9-AC6 emits each spoken letter once as its result grows and is revised', async () => {
    vi.stubGlobal('webkitSpeechRecognition', FakeRecognizer);
    const answers: Answer[] = [];
    const stop = await speechInput.start((a) => answers.push(a));
    recognizer().hear(['see']);
    recognizer().hear(['sea']);
    recognizer().hear(['sea bee']);
    recognizer().hear(['sea bee', 'gee']);
    expect(answers).toEqual([
      { kind: 'letter', letter: 'C' },
      { kind: 'letter', letter: 'B' },
      { kind: 'letter', letter: 'G' },
    ]);
    stop();
    expect(recognizer().aborted).toBe(true);
  });

  test('M9-AC6 listens again after iOS ends a session, until stopped', async () => {
    vi.stubGlobal('webkitSpeechRecognition', FakeRecognizer);
    const answers: Answer[] = [];
    const stop = await speechInput.start((a) => answers.push(a));
    recognizer().hear(['dee']);
    recognizer().onend?.();
    expect(recognizer().starts).toBe(2);
    recognizer().hear(['dee']);
    expect(answers).toHaveLength(2);
    stop();
    recognizer().onend?.();
    expect(recognizer().starts).toBe(2);
  });

  test('M9-AC6 fails to start when permission is refused, and ignores silence', async () => {
    class Refused extends FakeRecognizer {
      override start() {
        this.starts++;
        queueMicrotask(() => {
          this.onerror?.({ error: 'no-speech' });
          this.onerror?.({ error: 'not-allowed' });
        });
      }
    }
    vi.stubGlobal('SpeechRecognition', Refused);
    await expect(speechInput.start(() => undefined)).rejects.toThrow(/not-allowed/);
    expect(recognizer().aborted).toBe(true);
  });
});
