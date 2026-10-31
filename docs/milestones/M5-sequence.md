# M5: Sequence mode

**Goal**: read several notes in a row, playing them in order.

## Scope
- `makeSequence` using the M4 ordering, sized by difficulty and grouped into 4/4 measures with barlines (design §14).
  Rhythm (quarters and eighths) is visual only.
- Multi-note staff with active/right/wrong states. The same retry → reveal → Continue flow per note.

## Issues
| Id | Issue | ACs |
|---|---|---|
| M5-1 (#72) | Sequence generation: `core/sequence.ts` sizes a sequence by difficulty (§14), chains the M4 `Picker`, and gives each note a quarter or eighth so measures fill 4/4 | AC1 |
| M5-2 (#73) | Session cursor (§8.3, §8.4): retry → reveal → Continue per note, cursor moves on right or Continue, one attempt per note, single note is a sequence of one | AC2 (unit), AC3 |
| M5-3 (#74) | Multi-note staff: pure layout (x positions, barlines, stems, flags/beams, ledgers) fitted to the width; `Staff.svelte` per-note states; gallery entry | AC4 |
| M5-4 (#75) | Sequence mode in the quiz: Single / Sequence switch on Home (saved in Settings), `Quiz` runs sequences with any input (with a listening input, `answerContinues(run.session, …)` moves the cursor on, so the player can keep playing through misses), review stays single-note; M5 Summary | AC2 (e2e) |

## Acceptance criteria
- M5-AC1 Sequences match the difficulty table (Easy 4 notes in 1 measure; Medium 1–2 measures, ≤ 10; Hard 3 measures, 10–16) and the clef (unit).
- M5-AC2 The cursor advances only on a correct answer or after Continue (unit + e2e).
- M5-AC3 Each note in a sequence records its own attempt (unit).
- M5-AC4 Renders 16 notes in 3 measures including ledger notes without overlap on an iPhone viewport (e2e screenshot).

Refs: design §8.2, §8.4, §14.

## Summary
Sequence mode shipped in four issues (#72–#75).
- `core/sequence.ts` builds a sequence sized by difficulty (Hard's 3 measures need 12–16 notes, not design's 10) and chains the M4 picker.
- `core/cursor.ts` reuses the single-note `reduce`, so retry → reveal → Continue and one attempt per note are unchanged; a single note is a run of one.
- `core/sequence-layout.ts` and `Staff` draw measures, barlines, stems, beams and per-note states without overlap on an iPhone viewport.
- `Settings.mode` (Single / Sequence, chosen on Home) makes `Quiz` run a sequence with any input. A right note moves on at once; a listening input plays the revealed note to continue, and a miss never blocks, so the player can play on through mistakes. Review stays single-note.
- Deviation: the e2e proof of M5-AC2 goes through reveal → Continue, since a test can't read the notes of a sequence from the page; right-answer advance is covered by the cursor unit tests.
- Follow-up: none; rhythm stays visual only.
