# M3: Progress tracking & smart review

**Goal**: the quiz learns your weak spots and brings them back more often, with ledger-line notes weighted up.

## Scope
- Dexie DB (`stats`, `attempts`). `applyAttempt` with credit 1 / 0.5 / 0 for first try, second try, and miss.
- Weighted `pickNext` (difficulty × weakness × slowness × staleness, plus exploration and no-repeat).
- *Review weak notes* mode. JSON export/import (iOS share sheet). `navigator.storage.persist()`.

## Acceptance criteria
- M3-AC1 `applyAttempt` updates EWMA, box, and streak per the credit rules (unit).
- M3-AC2 Simulation: over 1,000 picks, a note at 40% accuracy appears ≥3× as often as one at 95% (unit).
- M3-AC3 Simulation: a 3-ledger-line note appears ≥2× as often as an on-staff note with equal stats (unit).
- M3-AC4 Review mode draws only weak notes and ends when none remain (unit + e2e).
- M3-AC5 Stats survive a reload, and export → import round-trips (e2e).

Refs: design §7, §10.

## Summary (fill in at completion)

_Not started._ What shipped, decisions made, deviations from plan, follow-ups.
