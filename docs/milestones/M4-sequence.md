# M4: Sequence mode

**Goal**: read several notes in a row, tapping letters in order.

## Scope
- `makeSequence` (weighted, with a max-leap setting). Multi-note staff with active/right/wrong states.
- The same retry → reveal → Continue flow per note. Sequence length setting (4–8).

## Acceptance criteria
- M4-AC1 Sequences respect length, clef, and max leap (unit).
- M4-AC2 The cursor advances only on a correct answer or after Continue (unit + e2e).
- M4-AC3 Each note in a sequence records its own attempt (unit).
- M4-AC4 Renders 8 notes including ledger notes without overlap on an iPhone viewport (e2e screenshot).

Refs: design §8.2, §8.4.

## Summary (fill in at completion)

_Not started._ What shipped, decisions made, deviations from plan, follow-ups.
