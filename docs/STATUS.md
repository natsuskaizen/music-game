# Project status

The living summary of where the project stands. It's auto-loaded into every Claude session via
`CLAUDE.md`, so a new session starts here instead of from old chat history.
**Update it in every PR** (the "Now" and "Recent" sections), and refresh all of it when a milestone closes.
Keep it under ~60 lines: link to docs, don't copy them.

## Now
- **Phase**: M0 (foundation & quality gates) is done. M1 look & feel spike (`docs/milestones/M1-look-and-feel.md`) is the active milestone in the roadmap, so the AC report tracks its ACs.
- **Next issue**: M1 start: write its issue list in the M1 doc and create the GitHub issues, then M1-1.
- **Blocked on Stan**: nothing. Q&A answers are recorded in design §14; milestone ends and pending device checks no longer stop the loop (CLAUDE.md).

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
| Sound / timer | Note always plays after answer (master off switch); timer is a sprint (one bar per session, 60/75/90 s by difficulty) | design §14 |
| Themes | Paper & ink and Storybook (Neon arcade dropped) | M1 doc |
| Later | Accidentals/key signatures (F1), write or say the letter (F3) | roadmap |

## Milestones
M0 ✓ · M1 ✱ · M2 ○ · M3 ○ · M4 ○ · M5 ○ · M6 ○ · M7 ○ · F1, F3 backlog
(✓ done, ✱ in progress, ○ not started)

## Recent
- 2026-10-31: Q&A with Stan replaces the working sessions: design §14; roadmap reordered (mic + sound to M3, tracking + ordering M4, sequence M5); letter pad dropped (F3 later).
- 2026-10-31: M0-4 CI (#12, #13): `ci.yml` runs `npm run check`, WebKit e2e and `scripts/ac-report` (per-AC table in the job summary) on PRs and `main`; a `STATUS.md updated` job fails PRs that touch `src/` without this file. AC2, AC3, AC7, AC10 proven by seeded CI runs (links in the M0 doc). #12 merged on a seed commit; #13 removed it.
- 2026-10-31: M0-5 AI review (#14): `review.yml` runs the code-reviewer agent (Sonnet, read-only tools, JSON-schema verdict) on every PR push; findings are inline annotations plus one PR comment (edited on each push), and blocking ones fail the check. Docs-only PRs and the `review-override` label pass without calling Claude. AC8, AC11 proven by seeded runs.
- 2026-10-31: M0-6 PWA + deploy (#7): `vite-plugin-pwa` (prompt-to-update, precaches everything), manifest + apple-touch icon, offline e2e test (M0-AC5), `deploy.yml` publishes to Pages after CI passes on `main` (M0-AC4), and the 250 KB gz JS budget in `npm run check`.
- 2026-10-31: M0-7 guidance: PR and issue templates, CLAUDE.md workflow points to them, M0-AC4 and M0-AC9 recorded, M0 Summary filled in.
- 2026-10-31: M0-AC6 passed on iPhone and iPad (installs, opens full-screen). M0 done; M1 is the active milestone.

## Known issues / open questions
- `review.yml` re-runs the AI review on any `labeled` event, not just `review-override`: skipping it would leave a passing "skipped" check that hides a failed review. Labels are rare, so the extra run is accepted.
- WebKit can't be downloaded in the cloud sessions, so e2e runs there on Chromium as a smoke test; CI is the WebKit source of truth.
- App icons (`public/icon*.png`, rendered from `public/icon.svg`) are placeholders until the M1 theme pick.
- The `CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token` expires after about a year. If the AI review starts failing to authenticate, regenerate it.
- Look and feel is open until the M1 spike (2 themes to try on device).
- iOS: mic permission may re-prompt per launch; silent switch handling must be confirmed on device (M1).
