// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Answer } from '../../src/core/session';
import { micInput } from '../../src/inputs/mic';

const RATE = 44100;
const A4_HZ = 440;
const A4 = 69;

let pending: (() => void) | undefined;
let tone = true;
const trackStop = vi.fn();
const sourceDisconnect = vi.fn();

vi.mock('../../src/audio/context', () => ({
  audioContext: () => ({
    sampleRate: RATE,
    createAnalyser: () => ({
      fftSize: 0,
      getFloatTimeDomainData: (buf: Float32Array) => {
        buf.forEach((_, i) => {
          buf[i] = tone ? 0.5 * Math.sin((2 * Math.PI * A4_HZ * i) / RATE) : 0;
        });
      },
    }),
    createMediaStreamSource: () => ({ connect: vi.fn(), disconnect: sourceDisconnect }),
  }),
}));

const getUserMedia = vi.fn(() => Promise.resolve({ getTracks: () => [{ stop: trackStop }] }));

beforeEach(() => {
  tone = true;
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
  vi.stubGlobal('requestAnimationFrame', (cb: () => void) => {
    pending = cb;
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {
    pending = undefined;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const runFrames = (n: number) => {
  for (let i = 0; i < n; i++) pending?.();
};

describe('M3-5 mic input', () => {
  test('M3-5 asks for the mic only when started, with raw audio', async () => {
    expect(getUserMedia).not.toHaveBeenCalled();
    const stop = await micInput.start(() => undefined);
    expect(getUserMedia).toHaveBeenCalledWith({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    stop();
  });

  test('M3-5 emits a held note once as a pitch answer', async () => {
    const answers: Answer[] = [];
    const stop = await micInput.start((a) => answers.push(a));
    runFrames(10);
    expect(answers).toEqual([{ kind: 'pitch', midi: A4 }]);
    stop();
  });

  test('M3-5 hears nothing from silence', async () => {
    tone = false;
    const answers: Answer[] = [];
    const stop = await micInput.start((a) => answers.push(a));
    runFrames(10);
    expect(answers).toEqual([]);
    stop();
  });

  test('M3-5 stop releases the mic and ends the frame loop', async () => {
    const stop = await micInput.start(() => undefined);
    stop();
    expect(trackStop).toHaveBeenCalled();
    expect(sourceDisconnect).toHaveBeenCalled();
    expect(pending).toBeUndefined();
  });

  test('M3-5 is unavailable without a mic API', () => {
    vi.stubGlobal('navigator', {});
    expect(micInput.isAvailable()).toBe(false);
  });
});
