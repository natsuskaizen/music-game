# M6: Timer & results

**Goal**: optional time pressure and a view of your progress.

## Scope
- Timer setting (off by default): a sprint, with one countdown bar for the whole session. Easy 60 s, Medium 75 s, Hard 90 s (design §14).
  When it runs out, the session ends and results show. Pauses when the app is backgrounded.
- Results screen (accuracy, average time, slowest notes). Stats screen: per-note heat-map on a staff.

## Acceptance criteria
- M6-AC1 Sprint length matches the difficulty (unit).
- M6-AC2 A sprint ends at the time limit, the unfinished question isn't counted as a miss, and results show (unit with a fake clock + e2e).
- M6-AC3 The timer pauses on `visibilitychange` (unit).
- M6-AC4 The heat-map colors match stored accuracy (e2e).

Refs: design §8.3, §9, §7.4, §14.

## Summary (fill in at completion)

_Not started._ What shipped, decisions made, deviations from plan, follow-ups.
