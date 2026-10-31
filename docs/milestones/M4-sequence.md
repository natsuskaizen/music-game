# M4: Sequence mode

**Goal**: read several notes in a row, tapping letters in order.

## Working session with Stan first (before any issues are written)
Note selection and ordering get designed together with Stan in a live session. Starting ideas from Stan:
- **Difficulty tiers by register**: Easy = around C4, Medium = around C3 and C5, Hard = around C2 and C6.
- **Less random ordering**: options for how notes follow each other, e.g. staying within one register group,
  stepwise or patterned movement, gradual widening. Not a uniform shuffle.
The outcome updates design §7 and this doc's scope and ACs. The weighting in §7.3 is a starting point only.

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
