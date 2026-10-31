# Project status

The living summary of where the project stands. It's auto-loaded into every Claude session via
`CLAUDE.md`, so a new session starts here instead of from old chat history.
**Update it in every PR** (the "Now" and "Recent" sections), and refresh all of it when a milestone closes.
Keep it under ~60 lines: link to docs, don't copy them.

## Now
- **Phase**: M2 single-note MVP in progress (`docs/milestones/M2-single-note.md`, issues #30–#34). M1 stays in progress until Stan's device checks and theme pick.
- **Next issue**: M2-2 (#31) session reducer + `gradeAnswer`, replacing `core/quiz.ts`. Build on Paper & ink unless Stan picks another theme.
- **Blocked on Stan** (not stop points; steps in the M1 doc "Device checks and theme pick"): M1-AC2 silent switch and M1-AC3 airplane mode on iPhone and iPad; M1-AC4 theme pick, which defaults to Paper & ink on 2026-11-01. Issue #23 stays open until these are ticked.

## Decisions so far
| Topic | Decision | Where |
|---|---|---|
| Framework | Svelte 5 + SVG (Bravura) + GSAP; Phaser 4 evaluated, not chosen | `docs/frameworks.md` |
| Hosting | GitHub Pages, deploy only when all gates are green | roadmap |
| Inputs | Pluggable `InputMethod` registry: on-screen piano (M2), mic (M3); letter pad dropped; default in Settings, switchable mid-quiz | design §3.4, §14 |
| Wrong answers | Retry once, reveal, wait for Continue (never auto-advance) | design §8.4 |
| Answer precision | `exactOctave` setting for octave-aware inputs | design §9 |
| Note selection | Weighted: ledger lines, weakness, slowness, staleness | design §7.3 |
| Workflow | Milestone → issues → one PR per issue; code-reviewer agent + static quality gates on every PR | roadmap |
| AC report | Failing AC turns CI red; an AC with no test or `- [x]` check yet is *pending*, and a milestone can't close with any pending | roadmap |
| Build budget | `npm run size`: all gzipped JS in `dist/` (incl. service worker) ≤ 250 KB, part of `npm run check` | M0-6 |
| Gate proofs | Seeded-violation commits go on a **draft** PR and are reverted before it's marked ready | M0-4 |
| GitHub milestones | Not used; each issue body names its milestone (`.github/ISSUE_TEMPLATE/roadmap-issue.md`) | M0-7 |
| Difficulty | Easy / Medium / Hard sets range, ledger weighting, sequence size, timer; ledger counts never shown | design §14 |
| Ordering | Mostly within a third, ~10% jumps (clef, octave) | design §14 |
| Sound / timer | Note always plays after answer (master off switch); timer is a sprint (one bar per session, 60/50/40 s by difficulty) | design §14 |
| Themes | Paper & ink (default), Storybook and Neon arcade (`?theme=arcade`, back by Stan's call); a theme switch in Settings is M8 | design §14, M8 doc |
| Staff | `src/core/pitch.ts` + `staff-layout.ts` (pure geometry), `components/Staff.svelte` draws it; Bravura subset inlined by Vite (offline from first paint); grand staff middle lines 10 spaces apart | M1-1 |
| Theme tokens | `src/themes.css` CSS variables; Paper & ink on `:root`, Storybook overrides via `data-theme`; `?theme=` read by `core/theme.ts`; components use only tokens | M1-2 |
| Demo quiz | `core/quiz.ts` reducer (ask → retry → reveal, exact octave) and `core/keyboard.ts` layout; `Piano`/`Quiz` components; GSAP styles per theme in `components/feedback.ts`. Spike: M2 replaces it with the `InputMethod` registry and §8.3 session | M1-3 |
| Answer sound | `audio/tone.ts`: one shared `AudioContext` made on the first tap, `audioSession.type = 'playback'`, a triangle tone with a 1.2 s decay; `core/quiz.ts` `toneAfter` plays the correct note on right or reveal (not on the first miss). Without `audioSession` a touch device shows a ringer hint. Added M1-AC5 for the automated part; AC2 stays manual | M1-4 |
| Icons | Paper & ink icons and theme color (default pick); `npm run icons` renders the PNGs from `public/icon.svg` via Playwright | M1-5 |
| Note pool | `core/ranges.ts` `notePool(mode, difficulty)` from the §14 table (bounds written as pitches); `core/selector.ts` `pickNote` is uniform and never repeats, until M4's weighted ordering. The demo quiz uses Medium | M2-1 |
| Later | Accidentals/key signatures (F1), write or say the letter (F3) | roadmap |

## Milestones
M0 ✓ · M1 ✱ · M2 ✱ · M3 ○ · M4 ○ · M5 ○ · M6 ○ · M7 ○ · F1, F3 backlog
(✓ done, ✱ in progress, ○ not started)

## Recent
- 2026-10-31: M8 Themes in Settings added to the roadmap (near the end): theme switch in Settings, Paper & ink default, and the arcade note-position bug (#36).
- 2026-10-31: Neon arcade theme (#29, `?theme=arcade`, not a roadmap issue): dark CRT page, glow tokens (`--page-art`, `--text-glow`, `--mark-glow`, `none` elsewhere; no CSS filter on the staff SVG, it made WebKit repaint too slowly for the GSAP feedback), flicker/glitch/burst GSAP feedback with unit tests (GSAP on a stand-in object); e2e and screenshots cover it.
- 2026-10-31: M2 started: issue list in the M2 doc, issues #30–#34. M2-1 (#30): difficulty note pools (`core/ranges.ts`), uniform `pickNote` (`core/selector.ts`), full-range staff position and ledger tests (M2-AC1, AC2); the demo quiz now asks Medium-range notes.
- 2026-10-31: M1-5 (#23): device-check steps for Stan, Paper & ink app icons + `npm run icons`, M1 Summary. AC2–AC4 pending on Stan; M2 starts.
- 2026-10-31: M1-4 (#22): the correct note plays (synthesized tone) once a question is settled; `audioSession` set to `playback` for the silent switch; ringer hint when it's unsupported on a touch device. New M1-AC5 (unit + e2e); M1-AC2 waits for the device check.
- 2026-10-31: M1-3 (#21): demo quiz above the staff gallery: on-screen piano (scrolls a revealed key into view), retry → reveal → Continue, GSAP feedback (Paper & ink: subtle slide/shake; Storybook: bounce, wobble, sparkles); e2e for both themes with reveal screenshots.
- 2026-10-31: M1-2 (#20): theme tokens for Paper & ink and Storybook, `?theme=` switch with nav links; CI uploads per-theme staff screenshots as the `theme-screenshots` artifact (M1-AC1).
- 2026-10-31: M1 started: issue list in the M1 doc, issues #19–#23. M1-1 (#19): pitch math, staff geometry and the `Staff` component (treble, bass, grand staff with ledger notes); the home page shows all three (M1-AC1 e2e with a screenshot).
- 2026-10-31: Q&A with Stan replaces the working sessions: design §14; roadmap reordered (mic + sound to M3, tracking + ordering M4, sequence M5); letter pad dropped (F3 later).
- 2026-10-31: M0-4 CI (#12, #13): `ci.yml` runs `npm run check`, WebKit e2e and `scripts/ac-report` (per-AC table in the job summary) on PRs and `main`; a `STATUS.md updated` job fails PRs that touch `src/` without this file. AC2, AC3, AC7, AC10 proven by seeded CI runs (links in the M0 doc). #12 merged on a seed commit; #13 removed it.
- 2026-10-31: M0-5 AI review (#14): `review.yml` runs the code-reviewer agent (Sonnet, read-only tools, JSON-schema verdict) on every PR push; findings are inline annotations plus one PR comment (edited on each push), and blocking ones fail the check. Docs-only PRs and the `review-override` label pass without calling Claude. AC8, AC11 proven by seeded runs.
- 2026-10-31: M0-6 PWA + deploy (#7): `vite-plugin-pwa` (prompt-to-update, precaches everything), manifest + apple-touch icon, offline e2e test (M0-AC5), `deploy.yml` publishes to Pages after CI passes on `main` (M0-AC4), and the 250 KB gz JS budget in `npm run check`.
- 2026-10-31: M0-7 guidance: PR and issue templates, CLAUDE.md workflow points to them, M0-AC4 and M0-AC9 recorded, M0 Summary filled in.
- 2026-10-31: M0-AC6 passed on iPhone and iPad (installs, opens full-screen). M0 done; M1 is the active milestone.

## Known issues / open questions
- Neon arcade draws the quiz note off its pitch after a few answers (leftover GSAP transform); tests read the `aria-label`, so they missed it. Fix and a drawn-position e2e check in M8 (#36).
- `review.yml` re-runs the AI review on any `labeled` event, not just `review-override`: skipping it would leave a passing "skipped" check that hides a failed review. Labels are rare, so the extra run is accepted.
- WebKit can't be downloaded in the cloud sessions, so e2e runs there on Chromium as a smoke test; CI is the WebKit source of truth.
- The `CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token` expires after about a year. If the AI review starts failing to authenticate, regenerate it.
- Theme pick (M1-AC4) is open until 2026-11-01; Paper & ink is the default.
- iOS: mic permission may re-prompt per launch (M3); silent switch handling waits on the M1-AC2 device check.
