# CLAUDE.md

## What we're building
A sight-reading trainer for piano, for Stan. It's an offline web app (PWA) installed on his iPad and iPhone from GitHub Pages.
- **Modes**: single note (treble, bass, or both on a grand staff) and multi-note sequences.
- **Answering**: pluggable inputs (on-screen piano, mic listening to a real piano; writing or saying the letter later).
- **Learning**: tracks every answer and brings weak notes back more often. Notes mostly move stepwise; difficulty (easy/medium/hard) sets the range and how often ledger notes appear.
- **Settings**: clef, mode, difficulty, timer (off / sprint), sound, default input. Decisions: `docs/design.md` §14.
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
- Milestone → issues → **one branch and one PR per issue** (branch `m2-3-short-name`). The PR body follows `.github/pull_request_template.md`: it links the issue and its ACs.
- At a milestone's start, write its issue list in the milestone doc, then create the GitHub issues from `.github/ISSUE_TEMPLATE/roadmap-issue.md`. The issue body names its milestone (there are no GitHub milestone objects).
- Before opening a PR: run `npm run check`, then check your own diff against the checklist in `.claude/agents/code-reviewer.md` and fix what breaks it. Don't start a reviewer subagent: the CI review is the AI gate, and one review per PR saves tokens.
- A PR merges only when all CI gates pass, including the AI review in `review.yml` (the code-reviewer agent, on Stan's subscription).
- **Every PR updates the status docs**: a new one-line file `docs/recent/<date>-<issue>.md` (never edit old ones, so PRs don't conflict), plus `docs/STATUS.md` Now and new decisions or known issues when they change.
- When a milestone's last issue closes: fill in its Summary (5–10 lines), update the roadmap status, and refresh all of STATUS.md (`docs/recent/` entries stay as history).

## Autonomous mode (authorized by Stan, 2026-10-31)
Each issue gets its own fresh thread, so context stays small. A run does **one issue**. When its PR merges, it asks the coordinator for a new thread for the next issue, unless the next item is a stop point. A scheduled task every 2 hours is the backup if the chain stalls; delete it once the roadmap is complete.
Issue threads should run on Sonnet; Opus is for milestone kick-offs, design questions, and an issue whose gate already failed once.
0. Backup runs check first, before reading any other doc: if a loop PR is open, or any project thread was active in the last 60 minutes, the chain is running, so end the run with one line and no notification.
1. Read STATUS.md and the latest entries (`cat $(ls docs/recent/*.md | sort -r | head -5)`). If a PR from the loop is still open, check it: fix red CI or review findings (max 2 attempts per issue), then stop.
2. If a **stop point** is next, update STATUS.md "Blocked on Stan", notify, and stop. Stop points: a gate failing twice on the same issue, or anything needing a repo setting or secret.
   Not stop points (Stan, 2026-10-31): a milestone's end (fill in the Summary, post a short summary, carry on); a pending manual device AC (leave it open, keep building; the milestone stays not-done until Stan ticks it); the M1 theme pick (if none within a day of the demo, use Paper & ink).
3. Otherwise take the next issue: branch, build, test, `npm run check`, self-check the diff against the code-reviewer checklist, update the status docs (new `docs/recent/` file; STATUS.md Now and handoff notes), and open the PR. After it merges, ask the coordinator for the next issue's thread.
4. Merging: once branch protection requires the CI and review checks (after M0-4/M0-5), enable **auto-merge**, and GitHub merges only when every check is green. Before that, leave the PR for Stan to merge.
5. Messages: post the PR link once and the result once (merged, or blocked). Keep progress on the checklist, since every reply also wakes the coordinator.
Never merge by hand, never use `review-override`, and never change gates to make a PR pass.

## Commands
- `npm run check`: types, lint, quality rules, unit, build, size budget. Run before every push.
- `npm test` runs unit tests with coverage (Vitest); `npm run e2e` builds, serves, and runs Playwright (WebKit iPhone/iPad).

## Code standards (enforced by gates; see roadmap "Code-quality standards")
- `src/core/` is pure TS (no DOM, no framework). All quiz logic lives there and is unit-tested.
- Small functions, one job each. No duplicated logic: extract it once and reuse it.
- Every exported function or type gets a one- or two-line doc comment saying *what* and *why*. No `@param` boilerplate, and no comments that narrate the code.
- Names over comments. No dead code, no speculative abstractions.
- Test titles start with the AC id: `test('M2-AC3 ...')`.
- Keep docs short; link to design sections instead of copying them.
