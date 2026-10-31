# M4: Progress tracking, smart review & note ordering

**Goal**: the quiz learns your weak spots and brings them back more often, and notes follow each other the way music does.

## Scope
- Dexie DB (`stats`, `attempts`). `applyAttempt` with credit 1 / 0.5 / 0 for first try, second try, and miss.
- Ordering (design §14): next note within a third (1–3 steps up or down), with ~10% jumps (other clef, octave, octave ± 1–2 steps).
- Weighted pick among the candidates (design §7.3: weakness × slowness × staleness, ledger boost on Hard, no-repeat).
- *Review weak notes* mode, shown on Home. JSON export/import (iOS share sheet). `navigator.storage.persist()`.

## Acceptance criteria
- M4-AC1 `applyAttempt` updates EWMA, box, and streak per the credit rules (unit).
- M4-AC2 Simulation: over 1,000 picks, a note at 40% accuracy appears ≥3× as often as one at 95% (unit).
- M4-AC3 Simulation: on Hard, a 3-ledger-line note appears ≥2× as often as an on-staff note with equal stats (unit).
- M4-AC4 Simulation: 85–95% of steps are within a third, and jumps cover all three kinds (unit).
- M4-AC5 Review mode draws only weak notes and ends when none remain (unit + e2e).
- M4-AC6 Stats survive a reload, and export → import round-trips (e2e).

Refs: design §7, §10, §14.

## Summary (fill in at completion)

_Not started._ What shipped, decisions made, deviations from plan, follow-ups.
