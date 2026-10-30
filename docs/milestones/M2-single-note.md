# M2: Single-note MVP

**Goal**: a usable daily drill. One note at a time, answered with letter buttons.

## Scope
- `src/core`: pitch model, ranges, uniform random selection, quiz state reducer.
- Staff view for treble, bass, and grand staff (`both`), in the M1 theme.
- Letter pad A–G. **Wrong answer**: second try, then reveal (e.g. "C6"), then wait for **Continue**. Never auto-advance.
- Settings: clef (treble/bass/both), range (staff to 3 ledger lines), questions per session. Persisted in localStorage.

## Acceptance criteria
- M2-AC1 `staffPos`/`ledgerLines` are correct for every note in both clefs' full ranges (unit).
- M2-AC2 The note pool respects the clef and range settings (unit).
- M2-AC3 A first wrong answer allows a second try, and the timer/state doesn't advance (unit + e2e).
- M2-AC4 A second wrong answer reveals the answer and waits; only Continue advances (e2e).
- M2-AC5 `both` shows a grand staff, with the note on the correct stave (e2e).
- M2-AC6 Settings persist across reloads (e2e).

Refs: design §6, §8.1, §8.3, §8.4, §9.

## Summary (fill in at completion)

_Not started._ What shipped, decisions made, deviations from plan, follow-ups.
