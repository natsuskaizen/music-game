# M6: Timer & results

**Goal**: optional time pressure and a view of your progress.

## Scope
- Timer setting (off by default): a countdown bar for the whole screen. Seconds = difficulty base (Easy 6, Medium 5, Hard 4)
  + 1 per 3 notes on screen (design §14). Timeout = miss on the current note, then reveal. Pauses when the app is backgrounded.
- Results screen (accuracy, average time, slowest notes). Stats screen: per-note heat-map on a staff.

## Acceptance criteria
- M6-AC1 Timer length follows the formula for every difficulty and note count from 1 to 16 (unit).
- M6-AC2 A timeout counts as a miss and goes to reveal, not auto-advance (unit with a fake clock).
- M6-AC3 The timer pauses on `visibilitychange` (unit).
- M6-AC4 The heat-map colors match stored accuracy (e2e).

Refs: design §8.3, §9, §7.4, §14.

## Summary (fill in at completion)

_Not started._ What shipped, decisions made, deviations from plan, follow-ups.
