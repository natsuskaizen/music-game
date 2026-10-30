# M1: Look & feel spike

**Goal**: see real options on your devices before building features, and retire the
technical risks early.

## Scope
- One demo page, `?theme=` switch, with **3 themes** drawing the same screen (staff, a note,
  answer pad, right/wrong feedback animation):
  1. *Paper & ink*: warm cream paper, engraved look, subtle motion.
  2. *Neon arcade*: dark background, glowing notes, punchy effects and streak counter.
  3. *Storybook*: rounded, colorful, playful character feedback.
- Risk checks on device: Bravura glyph alignment incl. 3 ledger lines and grand staff;
  piano sample plays with the **silent switch on**; works offline after install.
- Spike code is throwaway except the theme tokens and the staff component.

## Acceptance criteria
- M1-AC1 All 3 themes render the treble, bass, and grand staff with ledger notes (Playwright screenshots attached to CI).
- M1-AC2 Manual (iPhone + iPad): sound plays with the silent switch on, or the limitation is documented.
- M1-AC3 Manual: works in airplane mode after install.
- M1-AC4 You pick a theme (or a mix); the choice is recorded in the Summary.

Refs: design §3 (rendering), §4 (audio), [frameworks.md](../frameworks.md).

## Summary (fill in at completion)

_Not started._ What shipped, decisions made, deviations from plan, follow-ups.
