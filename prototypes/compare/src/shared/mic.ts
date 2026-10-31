import { PitchDetector } from 'pitchy';
import { audioCtx } from './sound';

export interface Listening { stop(): void }

/**
 * Listen for single piano notes. Calls onNote(midi) once per played note:
 * a pitch must hold for 4 frames (~65 ms) with high clarity, and the same note
 * only fires again after a short silence or a different note.
 */
export async function listen(onNote: (midi: number) => void, onPitch?: (midi: number | null) => void): Promise<Listening> {
  const ctx = audioCtx();
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 4096; // ~85 ms window at 48 kHz, enough for low bass notes
  const source = ctx.createMediaStreamSource(stream);
  source.connect(analyser);

  const detector = PitchDetector.forFloat32Array(analyser.fftSize);
  detector.minVolumeDecibels = -45;
  const buf = new Float32Array(analyser.fftSize);
  let candidate = -1, frames = 0, lastFired = -1, raf = 0;

  const loop = () => {
    analyser.getFloatTimeDomainData(buf);
    const [hz, clarity] = detector.findPitch(buf, ctx.sampleRate);
    const midi = clarity > 0.9 && hz > 40 && hz < 2100 ? Math.round(69 + 12 * Math.log2(hz / 440)) : -1;
    if (midi === candidate) frames++; else { candidate = midi; frames = 1; }
    if (midi < 0 && frames > 6) lastFired = -1;
    if (midi >= 0 && frames === 4 && midi !== lastFired) { lastFired = midi; onNote(midi); }
    onPitch?.(midi >= 0 ? midi : null);
    raf = requestAnimationFrame(loop);
  };
  loop();

  return {
    stop() {
      cancelAnimationFrame(raf);
      source.disconnect();
      stream.getTracks().forEach(t => t.stop());
    },
  };
}
