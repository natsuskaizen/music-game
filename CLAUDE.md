# CLAUDE.md

## What we're building
A sight-reading trainer for piano, for Stan. It's an offline web app (PWA) installed on his iPad and iPhone from GitHub Pages.
- **Modes**: single note (treble, bass, or both on a grand staff) and multi-note sequences.
- **Answering**: pluggable inputs (letter pad, on-screen piano, mic listening to a real piano, more later).
- **Learning**: tracks every answer and brings weak notes back more often. Ledger-line notes up to an octave beyond the staff are weighted higher.
- **Settings**: clef, range, timer (off / per note / sprint), sound, which inputs, whether the octave must match.
- **Feedback rule**: never auto-advance after a miss. Retry once, then reveal, then wait for Continue.

Stan is a lead engineer with a Python background who learns codebases through code examples. He wants
clean, readable code and low token use.

## Stack
Svelte 5 + SVG (Bravura glyphs) + GSAP, Vite, TypeScript, Dexie (IndexedDB), Web Audio + pitchy, Vitest, Playwright (WebKit).

## Current state (auto-loaded)
@docs/STATUS.md

## Read first (and only what you need)
- `docs/STATUS.md` (above) tells you where things stand. Start from it, not from old chat history.
- `docs/roadmap.md`: milestones, workflow, gates.
- The **one** milestone doc you're working on in `docs/milestones/`, and its issue.
- Only the `docs/design.md` sections that the milestone doc references. Don't read it end to end.

## Workflow
- Milestone → issues → **one branch and one PR per issue** (branch `m2-3-short-name`). The PR body links the issue and its ACs.
- At a milestone's start, write its issue list in the milestone doc, then create the GitHub issues.
- Before opening a PR: run `npm run check`, then run the **code-reviewer** agent (`.claude/agents/code-reviewer.md`) on the diff and fix every blocking finding.
- A PR merges only when all CI gates pass, including the AI review in `review.yml` (same agent, runs on Stan's subscription).
- **Every PR updates `docs/STATUS.md`**: Now, Recent (one line), and new decisions or known issues.
- When a milestone's last issue closes: fill in its Summary (5–10 lines), update the roadmap status, and refresh all of STATUS.md (trim Recent to the last ~5 lines).

## Autonomous mode (authorized by Stan, 2026-10-31)
Each issue gets its own fresh thread, so context stays small. A run does **one issue**. When its PR merges, it asks the coordinator for a new thread for the next issue, unless the next item is a stop point. A scheduled task every 2 hours is the backup if the chain stalls.
1. Read STATUS.md. If a PR from the loop is still open, check it: fix red CI or review findings (max 2 attempts per issue), then stop.
2. If a **stop point** is next, update STATUS.md "Blocked on Stan", notify, and stop. Stop points: a milestone's end, any "working session" item, M1 device checks or theme pick, a gate failing twice on the same issue, or anything needing a repo setting or secret.
3. Otherwise take the next issue: branch, build, test, `npm run check`, run the code-reviewer agent, fix blocking findings, update STATUS.md (Now, Recent, handoff notes), and open the PR. After it merges, ask the coordinator for the next issue's thread.
4. Merging: once branch protection requires the CI and review checks (after M0-4/M0-5), enable **auto-merge**, and GitHub merges only when every check is green. Before that, leave the PR for Stan to merge.
Never merge by hand, never use `review-override`, and never change gates to make a PR pass.

## Commands (created in M0)
- `npm run check`: types, lint, quality rules, unit, build, size budget. Run before every push.
- `npm test` runs unit tests with coverage (Vitest); `npm run e2e` builds, serves, and runs Playwright (WebKit iPhone/iPad).

## Code standards (enforced by gates; see roadmap "Code-quality standards")
- `src/core/` is pure TS (no DOM, no framework). All quiz logic lives there and is unit-tested.
- Small functions, one job each. No duplicated logic: extract it once and reuse it.
- Every exported function or type gets a one- or two-line doc comment saying *what* and *why*. No `@param` boilerplate, and no comments that narrate the code.
- Names over comments. No dead code, no speculative abstractions.
- Test titles start with the AC id: `test('M2-AC3 ...')`.
- Keep docs short; link to design sections instead of copying them.
