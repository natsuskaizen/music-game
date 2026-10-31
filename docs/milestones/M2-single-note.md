# M2: Single-note MVP

**Goal**: a usable daily drill. One note at a time, answered with letter buttons.

## Working session with Stan first (home screen)
The home screen, which you see before a game starts, needs refinement with Stan before its issue is written.
Questions to settle:
- What's on it: mode picker, quick-start with last settings, review weak notes, progress glance, settings entry.
- How much is configured here versus in Settings.
- How it looks in the M1 theme.
Bring 2–3 quick mock-ups (Svelte, like `prototypes/compare/`) to react to. The outcome updates this scope and its ACs.

## Scope
- `src/core`: pitch model, ranges, uniform random selection, quiz state reducer.
- Staff view for treble, bass, and grand staff (`both`), in the M1 theme.
- Input plug-in system (design §3.4): `InputMethod`, registry, `gradeAnswer()`, with the letter pad as the first input. Letter pad A–G. **Wrong answer**: second try, then reveal (e.g. "C6"), then wait for **Continue**. Never auto-advance.
- App shell: Home (pick mode, Start), Quiz, Settings, with simple navigation. Results and Stats come in M6.
- Settings: clef (treble/bass/both), range (staff to 3 ledger lines), questions per session. Persisted in localStorage.

## Acceptance criteria
- M2-AC1 `staffPos`/`ledgerLines` are correct for every note in both clefs' full ranges (unit).
- M2-AC2 The note pool respects the clef and range settings (unit).
- M2-AC3 A first wrong answer allows a second try, and the timer/state doesn't advance (unit + e2e).
- M2-AC4 A second wrong answer reveals the answer and waits; only Continue advances (e2e).
- M2-AC5 `both` shows a grand staff, with the note on the correct stave (e2e).
- M2-AC6 Settings persist across reloads (e2e).
- M2-AC7 Input contract suite passes for every registered input; a fake test input works with no core changes (unit).

Refs: design §3.4, §6, §8.1, §8.3, §8.4, §9.

## Summary (fill in at completion)

_Not started._ What shipped, decisions made, deviations from plan, follow-ups.
