# CLAUDE.md

Sight-reading quiz PWA for iPad/iPhone, hosted on GitHub Pages. Stack: Svelte 5 + SVG (Bravura glyphs) + GSAP, Vite, Dexie, Vitest, Playwright. Owner: Stan (lead engineer, Python background; likes code examples).

## Read first (and only what you need)
- `docs/roadmap.md` for milestones, gates, and status.
- The **one** milestone doc you're working on in `docs/milestones/`.
- `docs/design.md` sections that the milestone doc references. Don't read it end to end.

## Commands (created in M0)
- `npm run check`: types + lint + unit + build + size budget. Run before every push.
- `npm test` for unit tests (Vitest); `npm run e2e` for Playwright (WebKit iPhone/iPad).

## Conventions
- `src/core/` is pure TS (no DOM, no framework): all quiz logic lives here and is unit-tested.
- Test titles start with the AC id from the milestone doc: `test('M2-AC3 ...')`. CI reports per-AC status.
- One milestone = one PR. On completion, fill in the milestone doc's Summary (5–10 lines) and update the roadmap status.
- Never auto-advance after a wrong answer: retry once, reveal, then wait for Continue.
- Keep docs short; link to design sections instead of copying them.
