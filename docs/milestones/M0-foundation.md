# M0: Foundation & quality gates

**Goal**: an empty but deployable, installable app with every gate in place, plus the
project guidance Claude reads, so each later issue just adds code and tests and turns them green.

## Scope
- Vite + TypeScript + Svelte 5, Prettier, Vitest, Playwright (WebKit iPhone/iPad).
- **Quality gates** (roadmap "Quality gates"): types, lint, unit, e2e, build budget, PWA, AC report,
  **static code quality** (strict ESLint profile, `jscpd`, `knip`), and the **AI code review**.
- `npm run check` runs every non-AI gate locally; `ci.yml` runs them on PRs and `main`.
- Review gate without API costs: the session that builds an issue runs `.claude/agents/code-reviewer.md` on the
  final diff, posts the JSON verdict as a PR comment, and adds the `review-passed` label on `pass`.
  `review-gate.yml` fails unless the label is present, and removes it on every new push (`synchronize`).
- `deploy.yml`: Pages deploy on `main` after all checks pass. `vite-plugin-pwa` shell.
- **Claude guidance files**:
  - `CLAUDE.md` (repo root) is read automatically by Claude Code at the start of every session.
    It explains the project, Stan's goals, the workflow, commands, and code standards.
  - `.claude/agents/code-reviewer.md` is a Claude Code subagent definition: the review checklist and verdict format.
    Claude runs it locally before each PR, and CI runs the same file.
- `.github/pull_request_template.md` (issue link, ACs, "STATUS.md updated" checkbox) and an issue template.
- Status-file gate: a CI step fails a PR that changes `src/` without changing `docs/STATUS.md`.
- Create the GitHub milestones and this milestone's issues from the docs.

## Issues
| Id | Issue | ACs |
|---|---|---|
| M0-1 | Scaffold: Vite + Svelte 5 + TS, Prettier, `src/` layout from design §11 | AC1 |
| M0-2 | Test harness: Vitest + Playwright WebKit, AC-tagged sample tests | AC1, AC3 |
| M0-3 | Static quality gate: strict ESLint profile, `jscpd`, `knip`, `svelte-check` | AC7 |
| M0-4 | CI workflow + AC status report in the job summary + status-file check | AC2, AC3, AC10 |
| M0-5 | AI review gate: finalize the code-reviewer agent, `review-passed` label, `review-gate.yml` | AC8, AC11 |
| M0-6 | PWA shell + GitHub Pages deploy | AC4, AC5, AC6 |
| M0-7 | Finalize CLAUDE.md, PR and issue templates; create milestones and issues | AC9 |

## Acceptance criteria
- M0-AC1 `npm run check` passes locally on a clean clone.
- M0-AC2 CI runs on a PR and shows the AC table in the job summary.
- M0-AC3 A deliberately failing test turns CI red (verified once, then removed).
- M0-AC4 Merge to `main` deploys to `https://natsuskaizen.github.io/music-game/`.
- M0-AC5 Playwright: the page loads offline after first visit (service worker).
- M0-AC6 Manual: it installs to the iPad/iPhone home screen and opens full-screen.
- M0-AC7 A seeded violation of each static rule (complex function, duplicated block, unused export) fails CI.
- M0-AC8 A seeded PR with a needlessly repeated, undocumented function gets a `fail` verdict; the clean version passes.
- M0-AC9 A new session reading only `CLAUDE.md` (with STATUS.md auto-loaded) can state the project goal, current state, workflow, and commands.
- M0-AC10 A PR that changes `src/` but not `docs/STATUS.md` fails CI.
- M0-AC11 Pushing a new commit after review removes `review-passed`, and the review check goes red until re-reviewed.

## Setup Stan does once
- Branch protection on `main`: require the CI and review checks.
- Settings → Pages → Source: GitHub Actions.

Refs: design §5 (PWA), §11 (layout), roadmap "Workflow" and "Quality gates".

## Summary (fill in at completion)

_Not started._ What shipped, decisions made, deviations from plan, follow-ups.
