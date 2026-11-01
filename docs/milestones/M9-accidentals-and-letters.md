# M9: Accidentals, key signatures & letter answers

**Goal**: Stan can read sharps, flats and key signatures, and can answer by writing or saying the letter.
Scheduled from the F1 and F3 backlog sketches ([F1](F1-accidentals.md), [F3](F3-letter-inputs.md)); design §3.4, §14.

## Scope
- **Accidentals**: `Pitch` gets `accidental: -1 | 0 | 1` beside the diatonic position (drawing) and the chromatic value (answers, sound).
  Stats key by spelled pitch (`treble:F#5`), so F♯ and G♭ are tracked apart.
- **Settings**: include accidentals (off by default, so existing play is unchanged); key signature (none, chosen, or random).
- **Letter inputs**: handwriting and speech, both letter-only (A–G, no octave check), as `InputMethod`s.

## Acceptance criteria
- M9-AC1 A spelled pitch keeps its letter, accidental and octave; midi, staff position and stat key all derive from it (unit).
- M9-AC2 The staff draws accidentals and a key signature on both clefs, in every theme (unit on layout, e2e screenshot).
- M9-AC3 With accidentals off, note pools and stats are identical to before; old stored stats still load (unit).
- M9-AC4 With a key signature, notes in the key are graded by their sounding pitch (F in G major is F♯), and the piano and mic accept it (unit + e2e).
- M9-AC5 A letter answer is right when its letter matches, whatever the octave; stats still credit the note (unit).
- M9-AC6 The speech input turns "see", "bee", "gee" etc. into letters, and is hidden when recognition is unavailable (unit).
- M9-AC7 The handwriting input recognizes A–G strokes from fixtures at ≥ 90% (unit); it works with finger on iPad and iPhone (manual).
- M9-AC8 Speech recognition works on Stan's iPhone and iPad (manual).

## Issues
| Id | Issue | ACs |
|---|---|---|
| M9-1 | Spelled pitch in core: `accidental` on `Pitch`, `statKey` with accidentals, midi/staff derivation, old stats still load | AC1, AC3 |
| M9-2 | Draw accidentals and key signatures on the staff (glyphs in the Bravura subset; sequence layout makes room) | AC2 |
| M9-3 | Settings and note pool: accidentals toggle, key signature choice or random; quiz, review and sequences use the spelled pool | AC3, AC4 |
| M9-4 | Letter answers: `Answer` gains `{ kind: 'letter' }`, `gradeAnswer` ignores octave, stats credit it | AC5 |
| M9-5 | Speech input: on-device recognition where iOS Safari allows it, mapping spoken letters | AC6, AC8 |
| M9-6 | Handwriting input: canvas strokes and an A–G recognizer; M9 Summary | AC7 |

AC7 (finger part) and AC8 are manual device checks for Stan; they stay open and don't block building.

## Summary (fill in at completion)

- **Shipped**: `Pitch` carries an accidental, and stats key by spelled pitch (`treble:F#5`), with old stats unchanged (AC1, AC3).
  The staff draws sharps, flats, naturals and key signatures on both clefs (AC2). Settings add an accidentals toggle and a
  key signature (chosen or random per session); notes in the key are graded by sounding pitch on piano and mic (AC4).
- **Letter answers**: `Answer` can be a letter, right whatever the octave (AC5). Two letter inputs: speech (`lettersIn`,
  hidden without a recognizer, AC6) and handwriting (a $P point-cloud recognizer for capital A–G, 95% on the fixtures, AC7).
  Inputs that don't use the keyboard set the quiz's question (`ask`).
- **Open**: AC7's finger check and AC8 (speech) are Stan's manual device checks. The handwriting fixtures are synthetic,
  so the device check is the real accuracy test.
- **Follow-ups**: the Stats heat rows show the natural pool only; lowercase handwriting isn't recognized.
