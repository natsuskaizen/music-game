# M0: Foundation & quality gates

**Goal**: an empty but deployable, installable app with every CI gate in place, so
each later milestone just adds tests and turns them green.

## Scope
- Vite + TypeScript + chosen UI framework ([frameworks.md](../frameworks.md)), ESLint, Prettier, Vitest, Playwright (WebKit iPhone/iPad).
- `npm run check` runs every gate locally; `ci.yml` runs the same on PRs and `main`.
- `scripts/ac-report`: parses Vitest/Playwright JSON and writes the per-AC table to `$GITHUB_STEP_SUMMARY`.
- `deploy.yml`: Pages deploy on `main` after CI passes. `vite-plugin-pwa` shell (manifest, icons, precache).
- `CLAUDE.md` with commands and conventions.

## Acceptance criteria
- M0-AC1 `npm run check` passes locally on a clean clone.
- M0-AC2 CI runs on a PR and shows the AC table in the job summary.
- M0-AC3 A deliberately failing test turns CI red (verified once, then removed).
- M0-AC4 Merge to `main` deploys to `https://natsuskaizen.github.io/music-game/`.
- M0-AC5 Playwright: the page loads offline after first visit (service worker).
- M0-AC6 Manual: it installs to the iPad/iPhone home screen and opens full-screen.

Refs: design §5 (PWA), roadmap "Quality gates".

## Summary (fill in at completion)

_Not started._ What shipped, decisions made, deviations from plan, follow-ups.
