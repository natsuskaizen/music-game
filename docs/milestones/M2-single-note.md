# M2: Single-note MVP

**Goal**: a usable daily drill. One note at a time, answered on the on-screen piano.

## Scope
- `src/core`: pitch model, difficulty ranges (design §14), uniform random selection, quiz state reducer.
- Staff view for treble, bass, and grand staff (`both`), in the M1 theme.
- Input plug-in system (design §3.4): `InputMethod`, registry, `gradeAnswer()`, with the **on-screen piano** as the first input
  (design §3.2, octave must match). An input switcher on the quiz screen changes input mid-quiz.
  **Wrong answer**: second try, then reveal (e.g. "C6"), then wait for **Continue**. Never auto-advance.
- Home (design §14): mode, clef (treble / bass / both), Settings button, **Start at the bottom** using the last settings.
- Settings: difficulty (easy / medium / hard), default input, questions per session (10 / 20 / 50 / endless). Persisted in localStorage.

## Acceptance criteria
- M2-AC1 `staffPos`/`ledgerLines` are correct for every note in both clefs' full ranges (unit).
- M2-AC2 The note pool matches the clef and difficulty table in design §14 (unit).
- M2-AC3 A first wrong answer allows a second try, and the state doesn't advance (unit + e2e).
- M2-AC4 A second wrong answer reveals the answer and waits; only Continue advances (e2e).
- M2-AC5 `both` shows a grand staff, with the note on the correct stave (e2e).
- M2-AC6 Settings persist across reloads (e2e).
- M2-AC7 Input contract suite passes for every registered input; a fake test input works with no core changes (unit).
- M2-AC8 Switching input mid-quiz keeps the current question and its attempt state (unit + e2e).
- M2-AC9 Piano answers are graded by exact pitch: C5 is wrong for C6 (unit).

Refs: design §3.2, §3.4, §6, §8.1, §8.3, §8.4, §9, §14.

## Summary (fill in at completion)

_Not started._ What shipped, decisions made, deviations from plan, follow-ups.
