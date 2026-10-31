# M5: Piano input & sound

**Goal**: answer on a piano keyboard (or keep the simple letter pad), and hear the notes.

## Scope
- Register `piano` and `lettersOctave` inputs (design §3.4); `exactOctave` setting; several inputs can be on at once.
- On-screen piano spanning the active range, scrollable on iPhone, with exact-key checking.
- Piano samples (~20 trimmed Salamander clips, a committed script builds them). `playPitch` with detune.
- Sound setting: off / afterAnswer / onShow / onWrong, plus volume. iOS audio session = playback.

## Acceptance criteria
- M5-AC1 Answer checking is correct for every input mode, e.g. C5 is wrong for C6 in `lettersOctave`/`piano` and right in `letters` (unit).
- M5-AC2 `midi()`/nearest-sample/detune math is correct across G1–F6 (unit).
- M5-AC3 Each sound option triggers playback at the right moment (e2e with a stubbed audio player).
- M5-AC4 Manual: the piano is usable on iPhone (key size ≥ 40 px, scroll) and sounds right on device.

Refs: design §3.2, §3.3, §4, §9. Prototype: `prototypes/compare/keyboard.html`.

## Summary (fill in at completion)

_Not started._ What shipped, decisions made, deviations from plan, follow-ups.
