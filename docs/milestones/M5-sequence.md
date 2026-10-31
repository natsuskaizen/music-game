# M5: Sequence mode

**Goal**: read several notes in a row, playing them in order.

## Scope
- `makeSequence` using the M4 ordering, sized by difficulty and grouped into 4/4 measures with barlines (design §14).
  Rhythm (quarters and eighths) is visual only.
- Multi-note staff with active/right/wrong states. The same retry → reveal → Continue flow per note.

## Acceptance criteria
- M5-AC1 Sequences match the difficulty table (Easy 4 notes in 1 measure; Medium 1–2 measures, ≤ 10; Hard 3 measures, 10–16) and the clef (unit).
- M5-AC2 The cursor advances only on a correct answer or after Continue (unit + e2e).
- M5-AC3 Each note in a sequence records its own attempt (unit).
- M5-AC4 Renders 16 notes in 3 measures including ledger notes without overlap on an iPhone viewport (e2e screenshot).

Refs: design §8.2, §8.4, §14.

## Summary (fill in at completion)

_Not started._ What shipped, decisions made, deviations from plan, follow-ups.
