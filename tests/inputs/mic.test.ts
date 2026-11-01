// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { DEFAULT_MIC_LEVEL, MIC_LEVELS } from '../../src/core/listen';
import type { Answer } from '../../src/core/session';
import { micInput } from '../../src/inputs/mic';

const RATE = 44100;
const A4_HZ = 440;
const A4 = 69;

let pending: (() => void) | undefined;
let tone = true;
let amplitude = 0.5;
const trackStop = vi.fn();
const sourceDisconnect = vi.fn();

const setRecording = vi.fn();

vi.mock('../../src/audio/context', () => ({
  setRecording: (on: boolean) => {
    setRecording(on);
  },
  audioContext: () => ({
    sampleRate: RATE,
    createAnalyser: () => ({
      fftSize: 0,
      getFloatTimeDomainData: (buf: Float32Array) => {
        buf.forEach((_, i) => {
          buf[i] = tone ? amplitude * Math.sin((2 * Math.PI * A4_HZ * i) / RATE) : 0;
        });
      },
    }),
    createMediaStreamSource: () => ({ connect: vi.fn(), disconnect: sourceDisconnect }),
  }),
}));

const getUserMedia = vi.fn(() => Promise.resolve({ getTracks: () => [{ stop: trackStop }] }));

beforeEach(() => {
  tone = true;
  amplitude = 0.5;
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

  test('M3-AC8 reports the sounding note as heard, then none once stopped', async () => {
    const heard: (number | undefined)[] = [];
    const stop = await micInput.start(() => undefined, { heard: (midi) => heard.push(midi) });
    runFrames(2);
    stop();
    expect(heard).toEqual([A4, A4, undefined]);
  });

  test('M3-5 hears nothing from silence', async () => {
    tone = false;
    const answers: Answer[] = [];
    const stop = await micInput.start((a) => answers.push(a));
    runFrames(10);
    expect(answers).toEqual([]);
    stop();
  });

  test('M3-AC10 a note quieter than the threshold neither answers nor shows as heard', async () => {
    amplitude = 0.004; // about -51 dB: heard on Soft, under the default threshold
    const answers: Answer[] = [];
    const heard: (number | undefined)[] = [];
    const stop = await micInput.start((a) => answers.push(a), {
      heard: (midi) => heard.push(midi),
      minLevel: DEFAULT_MIC_LEVEL,
    });
    runFrames(10);
    expect(answers).toEqual([]);
    expect(heard.every((midi) => midi === undefined)).toBe(true);
    stop();
  });

  test('M10-AC5 the same quiet note answers on Soft', async () => {
    amplitude = 0.004;
    const answers: Answer[] = [];
    const stop = await micInput.start((a) => answers.push(a), { minLevel: MIC_LEVELS[0] });
    runFrames(10);
    expect(answers).toEqual([{ kind: 'pitch', midi: 69 }]);
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

  test('M3-AC9 reports a level each frame, 0 once stopped', async () => {
    const levels: number[] = [];
    const stop = await micInput.start(() => undefined, { level: (level) => levels.push(level) });
    runFrames(2);
    expect(levels.at(-1)).toBeGreaterThan(0);
    stop();
    expect(levels.at(-1)).toBe(0);
  });

  test('M3-AC9 records while listening and stops recording on stop', async () => {
    const stop = await micInput.start(() => undefined);
    expect(setRecording).toHaveBeenLastCalledWith(true);
    stop();
    expect(setRecording).toHaveBeenLastCalledWith(false);
  });

  test('M3-AC9 a blocked mic rejects and leaves recording off', async () => {
    getUserMedia.mockRejectedValueOnce(new Error('NotAllowedError'));
    await expect(micInput.start(() => undefined)).rejects.toThrow('NotAllowedError');
    expect(setRecording).toHaveBeenLastCalledWith(false);
  });
});
