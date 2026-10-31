# M0: Foundation & quality gates

**Goal**: an empty but deployable, installable app with every gate in place, plus the
project guidance Claude reads, so each later issue just adds code and tests and turns them green.

## Scope
- Vite + TypeScript + Svelte 5, Prettier, Vitest, Playwright (WebKit iPhone/iPad).
- **Quality gates** (roadmap "Quality gates"): types, lint, unit, e2e, build budget, PWA, AC report,
  **static code quality** (strict ESLint profile, `jscpd`, `knip`), and the **AI code review**.
- `npm run check` runs every non-AI gate locally; `ci.yml` runs them on PRs and `main`.
- `review.yml`: Claude Code GitHub Action runs `.claude/agents/code-reviewer.md` on the PR diff and
  fails the check on a `fail` verdict. It needs one repo secret (see Setup below).
- `deploy.yml`: Pages deploy on `main` after all checks pass. `vite-plugin-pwa` shell.
- **Claude guidance files**:
  - `CLAUDE.md` (repo root) is read automatically by Claude Code at the start of every session.
    It explains the project, Stan's goals, the workflow, commands, and code standards.
  - `.claude/agents/code-reviewer.md` is a Claude Code subagent definition: the review checklist and verdict format.
    Claude runs it locally before each PR, and CI runs the same file.
- `.github/pull_request_template.md` (issue link, ACs, checklist) and an issue template.
- Create the GitHub milestones and this milestone's issues from the docs.

## Issues
| Id | Issue | ACs |
|---|---|---|
| M0-1 | Scaffold: Vite + Svelte 5 + TS, Prettier, `src/` layout from design §11 | AC1 |
| M0-2 | Test harness: Vitest + Playwright WebKit, AC-tagged sample tests | AC1, AC3 |
| M0-3 | Static quality gate: strict ESLint profile, `jscpd`, `knip`, `svelte-check` | AC7 |
| M0-4 | CI workflow + AC status report in the job summary | AC2, AC3 |
| M0-5 | AI review gate: finalize the code-reviewer agent + `review.yml` | AC8 |
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
- M0-AC9 A new session reading only `CLAUDE.md` can state the project goal, workflow, and commands.

## Setup Stan does once
- Branch protection on `main`: require the CI and review checks.
- Repo secret for the AI review: run `/install-github-app` in Claude Code (adds `CLAUDE_CODE_OAUTH_TOKEN`), or add an `ANTHROPIC_API_KEY`.
- Settings → Pages → Source: GitHub Actions.

Refs: design §5 (PWA), §11 (layout), roadmap "Workflow" and "Quality gates".

## Summary (fill in at completion)

_Not started._ What shipped, decisions made, deviations from plan, follow-ups.
