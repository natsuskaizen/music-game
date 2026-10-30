# Roadmap

Each milestone gets one thread, one PR, and one doc in `milestones/`. A milestone is
**done** when every acceptance criterion (AC) has a passing test or a recorded manual
check, all CI gates are green, and the doc's *Summary* section is filled in.

| # | Milestone | Outcome | Status |
|---|---|---|---|
| M0 | [Foundation & quality gates](milestones/M0-foundation.md) | Scaffold, CI gates, AC status report, Pages deploy, installable PWA shell | Not started |
| M1 | [Look & feel spike](milestones/M1-look-and-feel.md) | 3 themes on device; staff/audio/offline risks retired; theme picked | Not started |
| M2 | [Single-note MVP](milestones/M2-single-note.md) | Playable single-note quiz with letter pad, retry/reveal/continue, clef settings | Not started |
| M3 | [Progress tracking & smart review](milestones/M3-tracking.md) | Stats in IndexedDB, weighted selection, review mode, backup | Not started |
| M4 | [Sequence mode](milestones/M4-sequence.md) | Multi-note quiz | Not started |
| M5 | [Piano input & sound](milestones/M5-piano-and-sound.md) | Piano keyboard input, answer-precision options, piano sound | Not started |
| M6 | [Timer & challenge](milestones/M6-timer.md) | Per-note and sprint timers, results and stats screens | Not started |
| M7 | [Polish & PWA hardening](milestones/M7-polish.md) | Update prompt, install hint, effects, accessibility | Not started |
| F1 | [Accidentals & key signatures](milestones/F1-accidentals.md) | Later feature | Backlog |

Order rationale: gates first, so every later PR reports status. Then the riskiest unknowns
(look, iOS audio, offline) before building features. Then value in the order you'll use it.

## Quality gates (set up in M0, required on every PR)

| Gate | Tool | Blocks merge when |
|---|---|---|
| Types | `tsc --noEmit` / `svelte-check` | any error |
| Lint/format | ESLint + Prettier | any error |
| Unit | Vitest | a test fails, or `src/core` coverage < 90% |
| E2E | Playwright on **WebKit** iPhone + iPad profiles (closest to iOS Safari) | a test fails |
| Build budget | `vite build` + size check | JS > 250 KB gz (raised deliberately if needed) |
| PWA | manifest + service worker present; app loads offline in Playwright | offline load fails |
| **AC status** | `scripts/ac-report` reads test results and writes a per-AC table to the job summary | always runs; red if any AC for the active milestone is failing or missing |

Deploy: `deploy.yml` runs on `main` only after CI passes, then publishes to GitHub Pages.
To make the gates truly blocking, turn on branch protection for `main` with "require
status checks" in the repo settings (a one-time click you do on GitHub).

**AC tagging convention**: a test's title starts with its AC id, e.g.
`test('M2-AC3 wrong answer allows a second try', ...)`. The report matches ids from
the milestone doc to test results, so status is visible without reading logs.

## Working efficiently (token budget)

1. **`CLAUDE.md` is the entry point**: commands, layout, and conventions in under 60 lines.
   A new thread reads that plus *one* milestone doc, not the whole design.
2. **`design.md` is reference only**, linked by section from milestone docs. It isn't re-read end to end.
3. **CI is the status report.** The AC table in the job summary replaces long manual
   verification write-ups; a thread reads the summary, not raw logs.
4. **Pure core + unit tests** (`src/core/`) are verified in seconds without a browser.
   Screenshots only for visual work (M1, M7).
5. **One PR per milestone**, reviewed at the end, instead of many small review loops.
6. **Scripts for repeat chores** (sample trimming, icons, AC report) are committed once and rerun, never redone by hand.
7. **Short docs**: a milestone doc stays about a page; its Summary is 5–10 lines.
