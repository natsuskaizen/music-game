# Project status

The living summary of where the project stands. It's auto-loaded into every Claude session via
`CLAUDE.md`, so a new session starts here instead of from old chat history.
**Update it in every PR** (the "Now" and "Recent" sections), and refresh all of it when a milestone closes.
Keep it under ~60 lines: link to docs, don't copy them.

## Now
- **Phase**: M2 single-note MVP in progress (`docs/milestones/M2-single-note.md`, issues #30–#34; #30–#33 done). M1 is done.
- **Next issue**: M2-5 (#34) Home + Settings (`core/settings.ts` with `migrateSettings`, localStorage), M2 Summary, AC6. Settings supplies the quiz's starting input, clef, difficulty and session length (all fixed in `Quiz.svelte` until then).
- **Blocked on Stan**: nothing.

## Decisions so far
| Topic | Decision | Where |
|---|---|---|
| Framework | Svelte 5 + SVG (Bravura) + GSAP; Phaser 4 evaluated, not chosen | `docs/frameworks.md` |
| Hosting | GitHub Pages, deploy only when all gates are green | roadmap |
| Inputs | Pluggable `InputMethod` registry: on-screen piano (M2), mic (M3); letter pad dropped; default in Settings, switchable mid-quiz | design §3.4, §14 |
| Wrong answers | Retry once, reveal, wait for Continue (never auto-advance) | design §8.4 |
| Answer precision | `exactOctave` setting for octave-aware inputs | design §9 |
| Note selection | Weighted: ledger lines, weakness, slowness, staleness | design §7.3 |
| Workflow | Milestone → issues → one PR per issue; code-reviewer agent (CI only) + static quality gates on every PR | roadmap |
| Token use | Issue threads on Sonnet; one AI review per PR (CI), local self-check instead of a subagent; one PR-link and one result message per thread; backup task every 2 h with an early exit | CLAUDE.md |
| AC report | Failing AC turns CI red; an AC with no test or `- [x]` check yet is *pending*, and a milestone can't close with any pending | roadmap |
| Build budget | `npm run size`: all gzipped JS in `dist/` (incl. service worker) ≤ 250 KB, part of `npm run check` | M0-6 |
| Gate proofs | Seeded-violation commits go on a **draft** PR and are reverted before it's marked ready | M0-4 |
| GitHub milestones | Not used; each issue body names its milestone (`.github/ISSUE_TEMPLATE/roadmap-issue.md`) | M0-7 |
| Difficulty | Easy / Medium / Hard sets range, ledger weighting, sequence size, timer; ledger counts never shown | design §14 |
| Ordering | Mostly within a third, ~10% jumps (clef, octave) | design §14 |
| Sound / timer | Note always plays after answer (master off switch); timer is a sprint (one bar per session, 60/50/40 s by difficulty) | design §14 |
| Themes | Paper & ink (Stan's M1 pick, default), Storybook and Neon arcade (`?theme=arcade`, back by Stan's call); a theme switch in Settings is M8 | design §14, M8 doc |
| Staff | `src/core/pitch.ts` + `staff-layout.ts` (pure geometry), `components/Staff.svelte` draws it; Bravura subset inlined by Vite (offline from first paint); grand staff middle lines 10 spaces apart | M1-1 |
| Theme tokens | `src/themes.css` CSS variables; Paper & ink on `:root`, Storybook overrides via `data-theme`; `?theme=` read by `core/theme.ts`; components use only tokens | M1-2 |
| Demo quiz | `core/keyboard.ts` layout; `Piano`/`Quiz` components; GSAP styles per theme in `components/feedback.ts`. M2-4 replaces it with the quiz screen | M1-3 |
| Answer sound | `audio/tone.ts`: one shared `AudioContext` made on the first tap, `audioSession.type = 'playback'`, a triangle tone with a 1.2 s decay; `core/session.ts` `toneAfter` plays the correct note on right or reveal (not on the first miss). Without `audioSession` a touch device shows a ringer hint. Added M1-AC5 for the automated part; AC2 stays manual | M1-4 |
| Icons | Paper & ink icons and theme color (Stan's pick); `npm run icons` renders the PNGs from `public/icon.svg` via Playwright | M1-5 |
| Note pool | `core/ranges.ts` `notePool(mode, difficulty)` from the §14 table (bounds written as pitches); `core/selector.ts` `pickNote` is uniform and never repeats, until M4's weighted ordering. The demo quiz uses Medium | M2-1 |
| Session | `core/session.ts`: `reduce(session, event, random)` with `answer` / `next` events; phases ask → retry → reveal or right → `next` → done after `questionsPerSession` (undefined = endless). `Answer` is `{ kind: 'pitch', midi }` only (letter answers are F3); `gradeAnswer` is exact pitch. Timer events wait for the sprint timer | M2-2 |
| Inputs (code) | `src/inputs/`: `types.ts` (`InputMethod`: id, label, `isAvailable`, a union of an on-screen input with a `component` taking `InputProps`, or a headless one with `start(emit)`); `registry.ts` (`register` refuses duplicate ids, `inputById` falls back to the first available); `index.ts` is the only list. No `octaveAware`: every input is exact pitch (§14). Contract suite mounts components in happy-dom | M2-3 |
| Quiz screen | `Quiz.svelte` is the quiz screen (the M1 demo is gone; the staff gallery stays for the M1 screenshots). `ActiveInput.svelte` draws an on-screen input or starts a headless one and stops it on a switch; the Input `<select>` (shown with 2+ available inputs) swaps it and the session is untouched, so the question and tries carry over. e2e runs on a `--mode e2e` build into `dist-e2e/` that also registers `inputs/scripted.ts` (a headless input a test drives with a `scripted-answer` event); the shipped build never includes it | M2-4 |
| Later | Accidentals/key signatures (F1), write or say the letter (F3) | roadmap |

## Milestones
M0 ✓ · M1 ✓ · M2 ✱ · M3 ○ · M4 ○ · M5 ○ · M6 ○ · M7 ○ · F1, F3 backlog
(✓ done, ✱ in progress, ○ not started)

## Recent
- 2026-10-31: M2-4 (#33): quiz screen with the input switcher and `ActiveInput`; e2e for retry, reveal and Continue, grand staff stave placement, and switching input mid-quiz (M2-AC3, AC4, AC5, AC8 e2e). The scripted headless input is e2e-build only.
- 2026-10-31: Token savings (not a roadmap issue): CLAUDE.md drops the local reviewer subagent for a self-check, adds the backup-run early exit and a two-message rule, and says issue threads run on Sonnet.
- 2026-10-31: M2-3 (#32): input plug-ins (`src/inputs/`), the on-screen piano is the first input and emits `Answer`; the demo quiz renders the registered input. Contract suite runs on every registered input plus a headless fake (M2-AC7), and answers from two inputs share one question's attempts (M2-AC8 unit).
- 2026-10-31: M2-2 (#31): `core/session.ts` session reducer with `Answer` + exact-pitch `gradeAnswer` and a done phase after the session length, replacing `core/quiz.ts`; the demo quiz runs on it (a clef switch starts a new session). M2-AC3 (unit), M2-AC9.
- 2026-10-31: M1 done: Stan picked Paper & ink (AC4); silent switch OK (AC2); works offline but the tone is silent in airplane mode (AC3, sound moved to M3-AC7, #39); Storybook note alignment logged for M8 (#38).
- 2026-10-31: M8 Themes in Settings added to the roadmap (near the end): theme switch in Settings, Paper & ink default, and the arcade note-position bug (#36).
- 2026-10-31: Neon arcade theme (#29, `?theme=arcade`, not a roadmap issue): dark CRT page, glow tokens (`--page-art`, `--text-glow`, `--mark-glow`, `none` elsewhere; no CSS filter on the staff SVG, it made WebKit repaint too slowly for the GSAP feedback), flicker/glitch/burst GSAP feedback with unit tests (GSAP on a stand-in object); e2e and screenshots cover it.
- 2026-10-31: M2 started: issue list in the M2 doc, issues #30–#34. M2-1 (#30): difficulty note pools (`core/ranges.ts`), uniform `pickNote` (`core/selector.ts`), full-range staff position and ledger tests (M2-AC1, AC2); the demo quiz now asks Medium-range notes.

## Known issues / open questions
- Neon arcade draws the quiz note off its pitch after a few answers (leftover GSAP transform); tests read the `aria-label`, so they missed it. Fix and a drawn-position e2e check in M8 (#36).
- `review.yml` re-runs the AI review on any `labeled` event, not just `review-override`: skipping it would leave a passing "skipped" check that hides a failed review. Labels are rare, so the extra run is accepted.
- WebKit can't be downloaded in the cloud sessions, so e2e runs there on Chromium as a smoke test; CI is the WebKit source of truth.
- The `CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token` expires after about a year. If the AI review starts failing to authenticate, regenerate it.
- iOS: mic permission may re-prompt per launch (M3). The answer tone is silent in airplane mode (#39, M3-AC7).
