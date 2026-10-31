# M0: Foundation & quality gates

**Goal**: an empty but deployable, installable app with every gate in place, plus the
project guidance Claude reads, so each later issue just adds code and tests and turns them green.

## Scope
- Vite + TypeScript + Svelte 5, Prettier, Vitest, Playwright (WebKit iPhone/iPad).
- **Quality gates** (roadmap "Quality gates"): types, lint, unit, e2e, build budget, PWA, AC report,
  **static code quality** (strict ESLint profile, `jscpd`, `knip`), and the **AI code review**.
- `npm run check` runs every non-AI gate locally; `ci.yml` runs them on PRs and `main`.
- `review.yml`: `anthropics/claude-code-action` with `claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}`
  (subscription, no API billing) runs `.claude/agents/code-reviewer.md` on the PR diff, posts findings, and
  fails the check on a `fail` verdict. It triggers on `opened`/`synchronize` and skips docs-only changes.
- `deploy.yml`: Pages deploy on `main` after all checks pass. `vite-plugin-pwa` shell.
- **Claude guidance files**:
  - `CLAUDE.md` (repo root) is read automatically by Claude Code at the start of every session.
    It explains the project, Stan's goals, the workflow, commands, and code standards.
  - `.claude/agents/code-reviewer.md` is a Claude Code subagent definition: the review checklist and verdict format.
    Claude runs it locally before each PR, and CI runs the same file.
- `.github/pull_request_template.md` (issue link, ACs, "STATUS.md updated" checkbox) and an issue template.
- Status-file gate: a CI step fails a PR that changes `src/` without changing `docs/STATUS.md`.
- Create this milestone's issues from the docs. (GitHub milestone objects were dropped: no tool creates them, and each issue body names its milestone.)

## Issues
| Id | Issue | ACs |
|---|---|---|
| M0-1 | Scaffold: Vite + Svelte 5 + TS, Prettier, `src/` layout from design §11 | AC1 |
| M0-2 | Test harness: Vitest + Playwright WebKit, AC-tagged sample tests | AC1, AC3 |
| M0-3 | Static quality gate: strict ESLint profile, `jscpd`, `knip`, `svelte-check` | AC7 |
| M0-4 | CI workflow + AC status report in the job summary + status-file check | AC2, AC3, AC10 |
| M0-5 | AI review gate: finalize the code-reviewer agent + `review.yml` | AC8, AC11 |
| M0-6 | PWA shell + GitHub Pages deploy | AC4, AC5, AC6 |
| M0-7 | Finalize CLAUDE.md, PR and issue templates; create milestones and issues | AC9 |

## Acceptance criteria
- M0-AC1 `npm run check` passes locally on a clean clone.
- [x] M0-AC2 CI runs on a PR and shows the AC table in the job summary. ([run](https://github.com/natsuskaizen/music-game/actions/runs/41165518171), 2026-10-31)
- [x] M0-AC3 A deliberately failing test turns CI red (verified once, then removed). ([run](https://github.com/natsuskaizen/music-game/actions/runs/41165646526), 2026-10-31)
- [x] M0-AC4 Merge to `main` deploys to `https://natsuskaizen.github.io/music-game/`. ([deploy run](https://github.com/natsuskaizen/music-game/actions/runs/41169387631), commit 908d8c5, 2026-10-31)
- M0-AC5 Playwright: the page loads offline after first visit (service worker).
- [x] M0-AC6 Manual: it installs to the iPad/iPhone home screen and opens full-screen. (iPhone, iPad, 2026-10-31)
- [x] M0-AC7 A seeded violation of each static rule (complex function, duplicated block, unused export) fails CI. ([complex](https://github.com/natsuskaizen/music-game/actions/runs/41165719488), [duplicate](https://github.com/natsuskaizen/music-game/actions/runs/41165842359), [unused](https://github.com/natsuskaizen/music-game/actions/runs/41165947254), 2026-10-31)
- [x] M0-AC8 A seeded PR with a needlessly repeated, undocumented function gets a `fail` verdict; the clean version passes. ([fail](https://github.com/natsuskaizen/music-game/actions/runs/41167653514), [pass](https://github.com/natsuskaizen/music-game/actions/runs/41167730502), 2026-10-31)
- [x] M0-AC9 A new session reading only `CLAUDE.md` (with STATUS.md auto-loaded) can state the project goal, current state, workflow, and commands. (fresh M0-7 session, 2026-10-31)
- [x] M0-AC10 A PR that changes `src/` but not `docs/STATUS.md` fails CI. ([run](https://github.com/natsuskaizen/music-game/actions/runs/41165646526), 2026-10-31)
- [x] M0-AC11 Every new push re-runs the review; a docs-only PR skips it. (push re-runs: [seed](https://github.com/natsuskaizen/music-game/actions/runs/41167653514), [revert](https://github.com/natsuskaizen/music-game/actions/runs/41167730502); docs-only skip: `M0-AC11` unit tests, 2026-10-31)

## Setup Stan does once
- ✓ `CLAUDE_CODE_OAUTH_TOKEN` repo secret (done 2026-10-31).
- ✓ Branch protection on `main`: require the CI and review checks (done 2026-10-31).
- ✓ Settings → Pages → Source: GitHub Actions (done 2026-10-31).

Refs: design §5 (PWA), §11 (layout), roadmap "Workflow" and "Quality gates".

## Summary (fill in at completion)

- Shipped: Vite 7 + Svelte 5 + strict TS scaffold; `npm run check` (format, svelte-check, ESLint strict + sonarjs + jsdoc, `jscpd`, `knip`, Vitest ≥ 90% core coverage, build, 250 KB gz budget).
- CI (`ci.yml`): check, WebKit e2e, per-AC table in the job summary, STATUS.md-updated gate. `review.yml` runs the code-reviewer agent on every push; `deploy.yml` publishes to Pages after CI passes on `main`.
- PWA shell with prompt-to-update service worker, offline e2e test, placeholder icons.
- Guidance: `CLAUDE.md` + auto-loaded `docs/STATUS.md`, PR and issue templates, autonomous one-issue-per-thread loop with auto-merge.
- Every gate was proven by a seeded failing run (links in the ACs above).
- Deviations: no GitHub milestone objects (issue bodies name the milestone); cloud sessions run e2e on Chromium, CI is the WebKit source of truth; #12 merged on a seed commit, fixed by #13.
- Follow-ups: icons and theme at the M1 pick; iOS mic and silent-switch checks in M1.
