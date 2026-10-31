# M1: Look & feel spike

**Goal**: see real options on your devices before building features, and retire the
technical risks early.

## Scope
- Built in Svelte from `prototypes/compare/keyboard.html`. One demo page, `?theme=` switch, with **2 themes** drawing the same screen (staff, a note,
  on-screen piano for answering, right/wrong feedback animation):
  1. *Paper & ink*: warm cream paper, engraved look, subtle motion.
  2. *Storybook*: rounded, colorful, playful character feedback (SVG + CSS + GSAP; no extra framework).
- Risk checks on device: Bravura glyph alignment incl. 3 ledger lines and grand staff;
  piano sample plays with the **silent switch on**; works offline after install.
- Spike code is throwaway except the theme tokens and the staff component.
- If the silent switch blocks sound, document it and show a "turn the ringer on for sound" hint (design §14).
- If no theme is picked within a day of the demo going live, M2 starts on *Paper & ink*; theme tokens make a later re-skin cheap.

## Acceptance criteria
- M1-AC1 Both themes render the treble, bass, and grand staff with ledger notes (Playwright screenshots attached to CI).
- M1-AC2 Manual (iPhone + iPad): sound plays with the silent switch on, or the limitation is documented.
- M1-AC3 Manual: works in airplane mode after install.
- M1-AC4 You pick a theme (or a mix); the choice is recorded in the Summary.

Refs: design §3 (rendering), §4 (audio), §14, [frameworks.md](../frameworks.md).

## Summary (fill in at completion)

_Not started._ What shipped, decisions made, deviations from plan, follow-ups.
