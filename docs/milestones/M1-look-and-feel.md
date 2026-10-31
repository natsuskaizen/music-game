# M1: Look & feel spike

**Goal**: see real options on your devices before building features, and retire the
technical risks early.

## Scope
- Built in Svelte from `prototypes/compare/keyboard.html`. One demo page, `?theme=` switch, with **2 themes** drawing the same screen (staff, a note,
  on-screen piano for answering, right/wrong feedback animation):
  1. *Paper & ink*: warm cream paper, engraved look, subtle motion.
  2. *Storybook*: rounded, colorful, playful character feedback (SVG + CSS + GSAP; no extra framework).
  3. *Neon arcade* (added by Stan, PR #29): dark CRT page, neon glow, flicker/glitch/burst feedback.
- Risk checks on device: Bravura glyph alignment incl. 3 ledger lines and grand staff;
  piano sample plays with the **silent switch on**; works offline after install.
- Spike code is throwaway except the theme tokens and the staff component.
- If the silent switch blocks sound, document it and show a "turn the ringer on for sound" hint (design §14).
- If no theme is picked within a day of the demo going live, M2 starts on *Paper & ink*; theme tokens make a later re-skin cheap.

## Issues
| Id | Issue | ACs |
|---|---|---|
| M1-1 (#19) | Pitch math (`src/core`) + `Staff` component: treble, bass, grand staff with ledger notes; Bravura subset | AC1 |
| M1-2 (#20) | Theme tokens + `?theme=` switch: *Paper & ink* and *Storybook*; CI screenshots of both themes × 3 staffs | AC1 |
| M1-3 (#21) | Demo quiz: on-screen piano answers, retry → reveal → Continue, GSAP right/wrong feedback per theme | AC1 |
| M1-4 (#22) | Sound: a tone after each answer, `audioSession` playback for the silent switch, ringer hint fallback | AC2, AC5 |
| M1-5 (#23) | Device checks + theme pick: AC2/AC3 on iPhone and iPad, record the pick, icons in the picked theme, Summary | AC2, AC3, AC4 |

M1-4 uses a synthesized tone: the silent-switch behavior is the same for any Web Audio output, and piano samples land in M3.

## Acceptance criteria
- M1-AC1 Both themes render the treble, bass, and grand staff with ledger notes (Playwright screenshots attached to CI).
- [x] M1-AC2 Manual (iPhone + iPad): sound plays with the silent switch on, or the limitation is documented. (Stan, 2026-10-31)
- [x] M1-AC3 Manual: works in airplane mode after install. (Stan, 2026-10-31: the quiz works; the tone is silent offline, moved to M3-AC7, #39)
- [ ] M1-AC4 You pick a theme (or a mix); the choice is recorded in the Summary.
- M1-AC5 The correct note sounds once a question is settled (right, or revealed), with the audio session set to `playback`; without `audioSession`, a touch device shows a "turn the ringer on for sound" hint.

Refs: design §3 (rendering), §4 (audio), §14, [frameworks.md](../frameworks.md).

## Device checks and theme pick (Stan)
Open https://natsuskaizen.github.io/music-game/ from the home-screen icon. On each device, tick the AC above
with the device and date, e.g. `- [x] M1-AC2 ... (iPhone, iPad, 2026-11-01)`, or tell Claude the result.
- **M1-AC2 silent switch**: flip the ringer switch to silent (iPad: Control Center bell), volume up. Answer a
  note right: the tone should play. If it's silent, note it; the app then relies on the ringer hint (design §14).
- **M1-AC3 airplane mode**: open the app once online, close it fully, turn on airplane mode, reopen it. The
  staff, piano and sound should all work.
- **M1-AC4 theme**: compare `?theme=paper` and `?theme=storybook` and `?theme=arcade`. Without a
  pick by 2026-11-01 (a day after the demo went live), M2 uses Paper & ink. The app icons and theme color are
  already Paper & ink (`npm run icons` re-renders them from `public/icon.svg`).

## Summary
- Shipped: pitch math and staff geometry in `src/core`, the `Staff` component (Bravura subset inlined, so it
  renders offline from first paint), theme tokens for Paper & ink and Storybook with `?theme=`, a demo quiz
  (on-screen piano, retry → reveal → Continue, GSAP feedback per theme), and a tone after each settled answer.
- Kept for M2: `core/pitch.ts`, `core/staff-layout.ts`, `Staff.svelte`, `themes.css`, `audio/tone.ts`.
  Throwaway: the demo `Quiz`/`Piano` and `core/quiz.ts`, which M2 replaces with the `InputMethod` registry.
- Decisions: synthesized tone instead of piano samples (samples move to M3); `audioSession = 'playback'` for the
  silent switch with a ringer hint fallback (new M1-AC5); Neon arcade came back as a third theme (#29); a theme
  switch in Settings and its note-position bug (#36) are M8.
- Icons and theme color are Paper & ink, the default pick; a re-skin only means new tokens and `npm run icons`.
- Device checks (2026-10-31): sound plays with the silent switch on; the app works offline but the tone is silent
  in airplane mode (#39, M3-AC7). Storybook sometimes draws the note slightly off its line (#38, M8).
- Open: AC4 (theme pick) keeps M1 in progress while M2 starts.
- Follow-ups: delete `prototypes/` once M1 closes (roadmap); re-render icons if the pick isn't Paper & ink.
