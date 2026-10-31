# M7: Polish & PWA hardening

**Goal**: feels finished and stays reliable on iOS.

## Scope
- (The update banner shipped early, outside M7.) Add-to-Home-Screen hint, safe-area insets, streak and celebration effects in the chosen theme.
- Accessibility: button labels, contrast, reduced-motion support.

## Acceptance criteria
- M7-AC1 A new deploy shows the update prompt and never swaps mid-quiz (e2e). The banner exists; this AC adds the e2e proof.
- M7-AC2 The install hint shows only in the Safari tab, never in standalone mode (e2e).
- M7-AC3 `prefers-reduced-motion` disables non-essential animation (e2e).
- M7-AC4 Lighthouse PWA/accessibility checks pass in CI.

Refs: design §5.2.

## Summary (fill in at completion)

_Not started._ What shipped, decisions made, deviations from plan, follow-ups.
