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

Shipped the optional sprint timer and the progress views.
- `core/sprint.ts` is a pausable clock (60/50/40 s by difficulty); `SprintBar` runs it in the quiz and a `timeUp` event ends the session without counting the unfinished question.
- `core/results.ts` + `Results.svelte`: first-try accuracy, average time and the three slowest notes, with Play again and Home.
- `core/heatmap.ts` + `StatsScreen.svelte` (M6-4): every pool note colored by `ewmaAcc` (unseen grey, under 50% red, under 80% orange, else green) using the existing theme tokens, plus a weakest-first list with accuracy and average time. A Stats button sits on Home.
- Deviation: the heat-map is one single-clef staff row per eight notes (treble rows, then bass), not one grand staff, because a hard pool of 44 notes cannot fit on one system. `Staff` reuses its sequence drawing; `marks` now also takes a heat.
- Follow-ups: none. Stats still ignore `exactOctave`/`mode` (see STATUS).
