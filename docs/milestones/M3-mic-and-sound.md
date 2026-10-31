# M3: Play on a real piano & piano sound

**Goal**: answer by playing the note on your piano (the app hears it through the mic), and hear the notes.

## Scope
- Piano samples (~20 trimmed Salamander clips, a committed script builds them). `playPitch` with detune.
- Sound settings (design §14): master on/off; when on, the note always plays after the answer; optional
  "when the note appears" and "after a wrong try"; volume; play with the silent switch on. iOS audio session = playback.
- Registers a `mic` input (design §3.4, §4.4); can run alongside `piano`. `getUserMedia` with echo cancellation, noise suppression, and auto-gain off. One shared `AudioContext` for playback and listening.
- Pitch detection with `pitchy` (McLeod method), `fftSize` 4096. A note is accepted after it holds stable for N frames with clarity > 0.9. Octave by majority vote over frames.
- Playback is muted while listening. The heard key is highlighted on the on-screen keyboard.
- Single notes and sequences only (no chords). MIDI is out: iOS Safari has no Web MIDI.

## Acceptance criteria
- M3-AC1 `midi()`/nearest-sample/detune math is correct across G1–F6 (unit).
- M3-AC2 Each sound setting triggers playback at the right moment, and "off" plays nothing (e2e with a stubbed audio player).
- M3-AC3 Hz → MIDI → note mapping is correct across G1–F6, including ±30 cents tolerance (unit).
- M3-AC4 The stability filter rejects single-frame blips and accepts a held note (unit, with recorded sample buffers).
- M3-AC5 Detection of recorded piano samples for every note in range: ≥ 95% letter-correct, ≥ 90% octave-correct above C2 (unit, offline fixtures).
- M3-AC6 Manual: on your piano, iPad and iPhone, normal room, a played note registers in under 0.3 s, and samples sound right.
- M3-AC7 Manual: the answer sound plays in airplane mode after install, on iPhone and iPad (#39).

Refs: design §3.3, §3.4, §4, §14. Prototypes: `prototypes/compare/keyboard.html`, `prototypes/compare/src/shared/mic.ts`.

## Summary (fill in at completion)

_Not started._ What shipped, decisions made, deviations from plan, follow-ups.
