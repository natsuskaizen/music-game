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

## Issues
| Id | Issue | ACs |
|---|---|---|
| M3-1 (#45) | Piano samples: build script, nearest-sample/detune math in `core`, `audio/piano.ts` `playPitch`, shared `AudioContext` module, CC-BY credit | AC1, AC6 (sound), AC7 |
| M3-2 (#46) | Sound settings (§14 group); pure `core` rule for when a note plays, replacing `toneAfter` | AC2 |
| M3-3 (#47) | Pitch-to-note filter in `core`: Hz → MIDI ±30 cents, stability over N frames, octave majority, re-fire rule | AC3, AC4 |
| M3-4 (#48) | `pitchy` + recorded-piano fixtures for G1–F6; accuracy test, tune frames and window | AC5 |
| M3-5 (#49) | `mic` input: `getUserMedia` (raw), analyser on the shared context, contract suite, ask permission only when chosen | AC6 (latency) |
| M3-6 (#50) | Mute playback while listening, highlight the heard key; delete `prototypes/`; M3 Summary | AC8 |

## Acceptance criteria
- M3-AC1 `midi()`/nearest-sample/detune math is correct across G1–F6 (unit).
- M3-AC2 Each sound setting triggers playback at the right moment, and "off" plays nothing (e2e with a stubbed audio player).
- M3-AC3 Hz → MIDI → note mapping is correct across G1–F6, including ±30 cents tolerance (unit).
- M3-AC4 The stability filter rejects single-frame blips and accepts a held note (unit, with recorded sample buffers).
- M3-AC5 Detection of recorded piano samples for every note in range: ≥ 95% letter-correct, ≥ 90% octave-correct above C2 (unit, offline fixtures).
- M3-AC6 Manual: on your piano, iPad and iPhone, normal room, a played note registers in under 0.3 s, and samples sound right.
- M3-AC7 Manual: the answer sound plays in airplane mode after install, on iPhone and iPad (#39).
- M3-AC8 While the mic listens, no note plays, and the heard key is highlighted on the on-screen keyboard (e2e with a stubbed mic).

Refs: design §3.3, §3.4, §4, §14. Prototypes: `prototypes/compare/keyboard.html`, `prototypes/compare/src/shared/mic.ts`.

## Summary (fill in at completion)

Piano samples and sound settings shipped (M3-1, M3-2), then the mic: a pure pitch-to-note filter (`core/listen.ts`),
59 recorded-piano fixtures proving 100% letter and octave accuracy with the first-guess tuning (no tuning needed), and
the `mic` input on the shared `AudioContext` (M3-3..5). M3-6 mutes playback while a listening input is active
(`HeadlessInput.listens`) and shows the sounding note on the keyboard (`heard` key mark, fed by `HeadlessInput.start`'s
second callback and `heardNote`). A headless input now shows the on-screen keyboard beside "Listening", so taps still work.
`prototypes/` is deleted. Open for Stan: M3-AC6 (latency on a real piano) and M3-AC7 (airplane mode), so M3 is "Built, device checks open"
on the roadmap until he ticks them.
