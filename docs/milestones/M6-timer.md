# M6: Timer & challenge

**Goal**: optional time pressure and a view of your progress.

## Scope
- Timer: off / per-note countdown (timeout = miss, then reveal) / session sprint. Pauses when the app is backgrounded.
- Results screen (accuracy, average time, slowest notes). Stats screen: per-note heat-map on a staff.

## Acceptance criteria
- M6-AC1 A per-note timeout counts as a miss and goes to reveal, not auto-advance (unit with a fake clock).
- M6-AC2 A sprint ends at the time limit and shows results (unit + e2e).
- M6-AC3 The timer pauses on `visibilitychange` (unit).
- M6-AC4 The heat-map colors match stored accuracy (e2e).

Refs: design §8.3, §9, §7.4.

## Summary (fill in at completion)

_Not started._ What shipped, decisions made, deviations from plan, follow-ups.
