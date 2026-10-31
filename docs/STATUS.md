# Project status

The living summary of where the project stands. It's auto-loaded into every Claude session via
`CLAUDE.md`, so a new session starts here instead of from old chat history.
**Update it in every PR** (the "Now" and "Recent" sections), and refresh all of it when a milestone closes.
Keep it under ~60 lines: link to docs, don't copy them.

## Now
- **Phase**: M0 (foundation & quality gates) in progress. M0 issues are #2–#8.
- **Next issue**: M0-4 CI workflow (#5), after the M0-3 static-gate PR merges.
- **Blocked on Stan**: merge M0 PRs until branch protection is on (M0-4/M0-5). Later in M0: branch protection on `main` and Settings → Pages → Source: GitHub Actions. GitHub milestones weren't created (no tool for it); create "M0 Foundation" in the UI or leave it to M0-7.

## Decisions so far
| Topic | Decision | Where |
|---|---|---|
| Framework | Svelte 5 + SVG (Bravura) + GSAP; Phaser 4 evaluated, not chosen | `docs/frameworks.md` |
| Hosting | GitHub Pages, deploy only when all gates are green | roadmap |
| Inputs | Pluggable `InputMethod` registry: letters, on-screen piano, mic (F2), more later; several at once | design §3.4 |
| Wrong answers | Retry once, reveal, wait for Continue (never auto-advance) | design §8.4 |
| Answer precision | `exactOctave` setting for octave-aware inputs | design §9 |
| Note selection | Weighted: ledger lines, weakness, slowness, staleness | design §7.3 |
| Workflow | Milestone → issues → one PR per issue; code-reviewer agent + static quality gates on every PR | roadmap |
| Later | Accidentals/key signatures (F1), mic input (F2) | roadmap |

## Milestones
M0 ✱ · M1 ○ · M2 ○ · M3 ○ · M4 ○ · M5 ○ · M6 ○ · M7 ○ · F1 backlog · F2 after M5
(✓ done, ✱ in progress, ○ not started)

## Recent
- 2026-10-31: Research, design, framework comparison, Svelte keyboard mock-up (`prototypes/compare/`), roadmap and gates. All in PR #1.
- 2026-10-31: M0-1 scaffold: Vite 7 + Svelte 5 + TS (strict), Prettier; `npm run check` = format, svelte-check, build. `src/` folders from design §11 are created with their first file, not as empty placeholders.
- 2026-10-31: M0-2 test harness: Vitest (coverage ≥ 90% on `src/core`, part of `npm run check`) and Playwright on WebKit iPhone 15 / iPad gen 11 (`npm run e2e`). CI must run `npx playwright install --with-deps webkit` (M0-4). Each issue now runs in a fresh thread, chained by the coordinator; the 2-hour scheduled task is the backup.
- 2026-10-31: M0-3 static gate: ESLint 10 (typescript-eslint strict type-checked, sonarjs, jsdoc, svelte), `jscpd` (≤ 1%), `knip`, all in `npm run check`. Seeded complex function, duplicate block, and unused export each fail locally (M0-AC7); CI proof comes with M0-4.

## Known issues / open questions
- The `CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token` expires after about a year. If the AI review starts failing to authenticate, regenerate it.
- **Home screen** (before a game starts) gets a working session with Stan at the start of M2, with 2–3 mock-ups to react to. See the M2 doc.
- **Note selection and ordering**: hold a working session with Stan at the start of M3 (difficulty tiers by register around C4 / C3–C5 / C2–C6, less random ordering). See M3 and M4 docs.
- Look and feel is open until the M1 spike (3 themes to try on device).
- iOS: mic permission may re-prompt per launch; silent switch handling must be confirmed on device (M1).
