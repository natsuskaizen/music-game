# M7: Polish & PWA hardening

**Goal**: feels finished and stays reliable on iOS.

## Scope
- (The update banner shipped early, outside M7.) Add-to-Home-Screen hint, safe-area insets, streak and celebration effects in the chosen theme.
- Redesign the mic level bar (Stan, 2026-10-31): the thin "Listening" meter works but needs a proper visual design in
  the chosen theme. Keep its threshold mark (M3-AC10) and its `role="meter"`.
- Accessibility: button labels, contrast, reduced-motion support.

## Acceptance criteria
- M7-AC1 A new deploy shows the update prompt and never swaps mid-quiz (e2e). The banner exists; this AC adds the e2e proof.
- M7-AC2 The install hint shows only in the Safari tab, never in standalone mode (e2e).
- M7-AC3 `prefers-reduced-motion` disables non-essential animation (e2e).
- M7-AC4 Lighthouse PWA/accessibility checks pass in CI.
- M7-AC5 A waiting new version shows an "Update now" button, and tapping it applies the update (unit; shipped early with the banner).

Refs: design §5.2.

## Summary (fill in at completion)

_Not started._ What shipped, decisions made, deviations from plan, follow-ups.
