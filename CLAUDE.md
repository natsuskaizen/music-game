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
- After the final push, post the reviewer's JSON verdict as a PR comment. On `pass`, add the `review-passed` label (CI requires it; any new push removes it).
- A PR merges only when all CI gates pass.
- **Every PR updates `docs/STATUS.md`**: Now, Recent (one line), and new decisions or known issues.
- When a milestone's last issue closes: fill in its Summary (5–10 lines), update the roadmap status, and refresh all of STATUS.md (trim Recent to the last ~5 lines).

## Commands (created in M0)
- `npm run check`: types, lint, quality rules, unit, build, size budget. Run before every push.
- `npm test` runs unit tests (Vitest); `npm run e2e` runs Playwright (WebKit iPhone/iPad).

## Code standards (enforced by gates; see roadmap "Code-quality standards")
- `src/core/` is pure TS (no DOM, no framework). All quiz logic lives there and is unit-tested.
- Small functions, one job each. No duplicated logic: extract it once and reuse it.
- Every exported function or type gets a one- or two-line doc comment saying *what* and *why*. No `@param` boilerplate, and no comments that narrate the code.
- Names over comments. No dead code, no speculative abstractions.
- Test titles start with the AC id: `test('M2-AC3 ...')`.
- Keep docs short; link to design sections instead of copying them.
