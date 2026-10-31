# Project status

The living summary of where the project stands. It's auto-loaded into every Claude session via
`CLAUDE.md`, so a new session starts here instead of from old chat history.
**Update it in every PR** (the "Now" and "Recent" sections), and refresh all of it when a milestone closes.
Keep it under ~60 lines: link to docs, don't copy them.

## Now
- **Phase**: planning done; design PR #1 open. Next: merge it, then start **M0** (foundation & quality gates).
- **Next issue**: M0-1 Scaffold (see `docs/milestones/M0-foundation.md`).
- **Blocked on Stan**: merge PR #1. During M0, a one-time setup (branch protection, Pages source). The AI review needs no secret: it runs in-session on the subscription.

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
M0 ○ · M1 ○ · M2 ○ · M3 ○ · M4 ○ · M5 ○ · M6 ○ · M7 ○ · F1 backlog · F2 after M5
(✓ done, ✱ in progress, ○ not started)

## Recent
- 2026-10-31: Research, design, framework comparison, Svelte keyboard mock-up (`prototypes/compare/`), roadmap and gates. All in PR #1.

## Known issues / open questions
- Look and feel is open until the M1 spike (3 themes to try on device).
- iOS: mic permission may re-prompt per launch; silent switch handling must be confirmed on device (M1).
