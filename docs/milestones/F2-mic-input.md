# F2: Play on a real piano (mic input)

**Goal**: answer by playing the note on your piano. The app hears it through the microphone.

## Scope
- `answerInput: 'mic'`. `getUserMedia` with echo cancellation, noise suppression, and auto-gain off. One shared `AudioContext` for playback and listening.
- Pitch detection with `pitchy` (McLeod method), `fftSize` 4096. A note is accepted after it holds stable for N frames with clarity > 0.9.
- Octave handling: letters-only mode ignores octave; exact-octave modes use a majority vote over frames.
- Note playback is muted while listening. The heard key is highlighted on the on-screen keyboard (from M5).
- Single notes and sequences only (no chords). MIDI over USB/Bluetooth is out: iOS Safari has no Web MIDI.

## Acceptance criteria
- F2-AC1 Hz → MIDI → note mapping is correct across G1–F6, including ±30 cents tolerance (unit).
- F2-AC2 The stability filter rejects single-frame blips and accepts a held note (unit, with recorded sample buffers).
- F2-AC3 Detection of recorded piano samples for every note in range: ≥ 95% letter-correct, ≥ 90% octave-correct above C2 (unit, offline fixtures).
- F2-AC4 Manual: on your piano, iPad and iPhone, normal room, a played note registers in under 0.3 s.

Refs: design §4.4 (mic), §3.3 (grader), M5 (keyboard). Prototype: `prototypes/compare/src/shared/mic.ts`.

## Summary (fill in at completion)

_Not started._
