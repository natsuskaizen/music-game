# M10: Quiz fixes from device use

**Goal**: fix what Stan found while using M9 on his devices, and change how a missed note works: no Continue button, you keep trying until you get it or skip.
Decisions: design §8.4 (feedback), §14; the rule changes in M10-6 are written back there.

## Scope
- **Letter inputs**: handwriting reads G correctly; a letter answer must include ♯/♭ when the note has one; speech input is removed.
- **Settings**: the key signature picker lists keys ("G major / E minor (1♯)"); a new, separate setting writes accidentals on the note itself.
- **Mic**: more sensitive, so even Soft catches quiet playing.
- **Feedback**: Skip replaces Continue in single and sequence mode; right/wrong keyboard highlights fade; a sequence moves on only when the current note is hit; the current note is marked on the staff.

## Acceptance criteria
- M10-AC1 Handwritten G strokes read as G, not C, on the fixtures at ≥ 90% overall (unit).
- M10-AC2 A letter answer is right only when letter and accidental both match the note's sounding spelling; F for F♯ is wrong; the handwriting pad has ♯ and ♭ controls (unit + e2e).
- M10-AC3 The key picker lists each key by name with its relative minor and signature, e.g. "G major / E minor (1♯)"; stored `Settings.key` values are unchanged (unit + e2e).
- M10-AC4 No speech input exists: not in the registry, the source, the tests or the docs' feature list (unit).
- M10-AC5 At every mic level the threshold is lower, and a quiet piano fixture is detected on Soft (unit); Stan's piano check (manual).
- M10-AC6 There is no Continue button in single or sequence mode. A wrong answer leaves the question open for more tries; Skip records a miss, sounds the note and moves on (unit + e2e).
- M10-AC7 Right and wrong highlights on the on-screen keyboard fade out shortly after the hit and don't stay; the staff is unchanged (unit + e2e).
- M10-AC8 In sequence mode only the right note advances; a wrong note does not; Skip moves past the current note (unit + e2e).
- M10-AC9 The current note in a sequence has a subtle marker (arrow or highlight) in a colour distinct from the wrong-note colour, in every theme, passing contrast (unit + e2e).
- M10-AC10 A separate setting (off by default) draws each altered note's accidental beside the note instead of in a key signature; it is independent of the key picker (unit + e2e).

## Issues
| Id | Issue | ACs |
|---|---|---|
| M10-1 | Handwriting: a written G is read as G, not C | AC1 |
| M10-2 | Letter answers need the accidental, and the handwriting pad gets ♯/♭ | AC2 |
| M10-3 | Key signature picker lists keys with their relative minor | AC3 |
| M10-4 | Remove the speech input | AC4 |
| M10-5 | Mic: more sensitive, Soft catches quiet playing | AC5 |
| M10-6 | Skip replaces Continue (single and sequence): keep trying until right, or skip | AC6 |
| M10-7 | Keyboard right/wrong highlights fade out | AC7 |
| M10-8 | Sequence advances only on the right note | AC8 |
| M10-9 | Current-note marker on the staff | AC9 |
| M10-10 | Setting: accidentals written on the note | AC10 |

AC5 (piano check) is a manual device check for Stan; it stays open and doesn't block building.
M10-4 retires M9-AC6 and M9-AC8 (speech); M10-2 reverses M9-AC5 (letters ignored accidentals).

## Summary (fill in at completion)

- **Shipped**: handwriting reads G (AC1) and letter answers need the right ♯/♭, with ♯/♭ toggles on the pad (AC2). The key picker names each key with its relative minor (AC3). Speech input is gone (AC4).
- **Quiz feel**: Skip replaces Continue in both modes, so a miss keeps the question open until it is right or skipped (AC6). Keyboard highlights fade (AC7). A sequence advances only on the right note or Skip (AC8), and the current note has a halo in the new `--current` colour (AC9).
- **Settings**: `Settings.accidentalsOnNote` (off by default, independent of the key picker) hides the key signature and writes every sharp or flat beside its note (AC10). Grading and stat keys don't change.
- **Mic**: levels and detector floor lowered (AC5 unit).
- **Open**: M10-AC5's piano check is Stan's manual device check. M9-AC7's finger check still applies to the handwriting changes.
