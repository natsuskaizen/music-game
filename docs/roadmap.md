# Roadmap

Each milestone has one doc in `milestones/` and is split into **issues** (small, reviewable
features). A milestone is **done** when all its issues are closed, every acceptance criterion
(AC) has a passing test or a recorded manual check, and the doc's *Summary* is filled in.

## Workflow: milestone → issues → one PR each

```
Milestone doc (scope + ACs + issue list)
  └─ GitHub milestone "M2 Single-note MVP"
       ├─ Issue M2-1 "Pitch model and ranges"      → branch m2-1-pitch-model → PR → gates → merge
       ├─ Issue M2-2 "Staff component"             → branch m2-2-staff       → PR → gates → merge
       └─ ...
```

1. At the start of a milestone, its issue list becomes GitHub issues under a GitHub milestone.
   Each issue names the ACs it satisfies.
2. **One issue = one branch = one PR** into `main`. PRs stay small, so reviews and fixes stay cheap.
3. Before opening the PR, Claude runs the **code-reviewer agent** locally on the diff and fixes what it finds.
4. On the PR, **every gate below must pass**, including the code-quality and AI review gates. Then it merges and deploys.
5. **Every PR updates [`STATUS.md`](STATUS.md)**, the short living summary that `CLAUDE.md` auto-loads into each new session.
   When the last issue closes: fill in the milestone Summary, update the status table here, and refresh STATUS.md in full.

| # | Milestone | Outcome | Status |
|---|---|---|---|
| M0 | [Foundation & quality gates](milestones/M0-foundation.md) | Scaffold, CI gates, AC status report, Pages deploy, installable PWA shell | In progress |
| M1 | [Look & feel spike](milestones/M1-look-and-feel.md) | 3 themes on device; staff/audio/offline risks retired; theme picked | Not started |
| M2 | [Single-note MVP](milestones/M2-single-note.md) | Playable single-note quiz with letter pad, retry/reveal/continue, clef settings | Not started |
| M3 | [Progress tracking & smart review](milestones/M3-tracking.md) | Stats in IndexedDB, weighted selection, review mode, backup | Not started |
| M4 | [Sequence mode](milestones/M4-sequence.md) | Multi-note quiz | Not started |
| M5 | [Piano input & sound](milestones/M5-piano-and-sound.md) | Piano keyboard input, answer-precision options, piano sound | Not started |
| M6 | [Timer & challenge](milestones/M6-timer.md) | Per-note and sprint timers, results and stats screens | Not started |
| M7 | [Polish & PWA hardening](milestones/M7-polish.md) | Update prompt, install hint, effects, accessibility | Not started |
| F1 | [Accidentals & key signatures](milestones/F1-accidentals.md) | Later feature | Backlog |
| F2 | [Play on a real piano](milestones/F2-mic-input.md) | Answer by playing the note; the app hears it through the mic | After M5 |

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
| Status file | PRs that change `src/` must also change `docs/STATUS.md` | file not updated |
| **Code quality (static)** | ESLint strict profile (below), `jscpd` duplicate detection, `knip` unused code | any violation |
| **Code review (AI)** | `review.yml`: `anthropics/claude-code-action` runs the [code-reviewer agent](../.claude/agents/code-reviewer.md) on the PR diff on every push, authenticated with the `CLAUDE_CODE_OAUTH_TOKEN` secret (Stan's subscription) | verdict `fail` (any blocking finding) |
| **AC status** | `scripts/ac-report` reads test results and writes a per-AC table to the job summary | always runs; red if any AC for the active milestone is failing or missing |

Deploy: `deploy.yml` runs on `main` only after CI passes, then publishes to GitHub Pages.
To make the gates truly blocking, turn on branch protection for `main` with "require
status checks" in the repo settings (a one-time click you do on GitHub).

### Code-quality standards (what the two quality gates enforce)

| Standard | Enforced by |
|---|---|
| Small, simple functions | ESLint `complexity` ≤ 8, `sonarjs/cognitive-complexity` ≤ 10, `max-lines-per-function` 40, `max-depth` 3, `max-params` 3 (use an options object) |
| Don't repeat yourself | `jscpd` fails on > 1% duplicated lines; `sonarjs/no-identical-functions`, `sonarjs/no-duplicate-string` |
| Concise, accurate doc comments | `jsdoc/require-jsdoc` on exported functions/classes; `jsdoc/require-description`; no `@param`/`@returns` boilerplate (TypeScript has the types). The AI review checks accuracy |
| No dead code | `knip` (unused files, exports, dependencies); `@typescript-eslint/no-unused-vars` |
| Consistent formatting | Prettier |
| Well structured, readable, simple | AI review: naming, single responsibility, layering (`core` stays pure), needless abstraction, comments that lie or narrate |

Static rules catch what is mechanical and cost nothing per run. The AI review covers what
rules can't judge. It runs in CI on Stan's subscription through the `CLAUDE_CODE_OAUTH_TOKEN` secret, so there is **no API billing**.
To keep usage low, it reads only the PR diff, uses Sonnet, and skips docs-only PRs (`paths` filter). The same agent
also runs locally before each PR, so CI usually confirms rather than finds problems. The agent file is the single source of the review checklist, used both
locally by Claude and in CI.

**Gate mechanics**
- Every required workflow runs on every PR. Docs-only PRs exit early with *success* instead of using a `paths`
  filter, because a required check that never runs stays "waiting" and blocks the merge.
- AI review escape hatch: if the reviewer is wrong, Stan can add the `review-override` label. The check then
  passes and the override is logged in the PR. Only Stan uses it.
- Manual ACs (device checks) are recorded in the milestone doc as `- [x] M1-AC2 (iPad, 2026-11-02)`. The AC report reads them.
- `prototypes/` is excluded from lint, `jscpd`, `knip`, and coverage. It's reference code and is deleted after M1.

**AC tagging convention**: a test's title starts with its AC id, e.g.
`test('M2-AC3 wrong answer allows a second try', ...)`. The report matches ids from
the milestone doc to test results, so status is visible without reading logs.

## Working efficiently (token budget)

1. **`CLAUDE.md` + `STATUS.md` are the entry point.** Claude Code loads both automatically. A new session
   starts from that summary plus *one* milestone doc, never from the old chat or the whole design.
2. **`design.md` is reference only**, linked by section from milestone docs. It isn't re-read end to end.
3. **CI is the status report.** The AC table in the job summary replaces long manual
   verification write-ups; a thread reads the summary, not raw logs.
4. **Pure core + unit tests** (`src/core/`) are verified in seconds without a browser.
   Screenshots only for visual work (M1, M7).
5. **Small PRs, one per issue.** The AI reviewer reads a short diff rather than a whole milestone, so each review is cheap and focused.
6. **Scripts for repeat chores** (sample trimming, icons, AC report) are committed once and rerun, never redone by hand.
7. **Short docs**: a milestone doc stays about a page; its Summary is 5–10 lines.
