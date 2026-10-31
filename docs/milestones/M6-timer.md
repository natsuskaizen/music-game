# M6: Timer & results

**Goal**: optional time pressure and a view of your progress.

## Scope
- Timer setting (off by default): a sprint, with one countdown bar for the whole session. Easy 60 s, Medium 50 s, Hard 40 s (design §14).
  When it runs out, the session ends and results show. Pauses when the app is backgrounded.
- Results screen (accuracy, average time, slowest notes). Stats screen: per-note heat-map on a staff.

## Issues
| Id | Issue | ACs |
|---|---|---|
| M6-1 (#83) | Sprint clock: pure `core/sprint.ts` (length by difficulty, pausable clock with `remaining(now)`); `Settings.timer` (off by default) and its toggle in Settings | AC1, AC3 |
| M6-2 (#84) | Sprint in the quiz: countdown bar (single and sequence; review has no timer), a `timeUp` event ends the session without recording the unfinished question, pauses on `visibilitychange` | AC2 |
| M6-3 (#85) | Results screen: pure `core/results.ts` (first-try accuracy, average time, three slowest notes); `Results` replaces the inline done block, with Again and Home | AC5 |
| M6-4 (#86) | Stats screen: every pool note on a grand staff colored by `ewmaAcc` (unseen neutral, theme tokens) with average time, button on Home; M6 Summary | AC4 |

## Acceptance criteria
- M6-AC1 Sprint length matches the difficulty (unit).
- M6-AC2 A sprint ends at the time limit, the unfinished question isn't counted as a miss, and results show (unit with a fake clock + e2e).
- M6-AC3 The timer pauses on `visibilitychange` (unit).
- M6-AC4 The heat-map colors match stored accuracy (e2e).
- M6-AC5 Results show first-try accuracy, average answer time and the three slowest notes of the session (unit).

Refs: design §8.3, §9, §7.4, §14.

## Summary (fill in at completion)

_Not started._ What shipped, decisions made, deviations from plan, follow-ups.
