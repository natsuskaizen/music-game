# M7: Polish & PWA hardening

**Goal**: feels finished and stays reliable on iOS.

## Scope
- (The update banner shipped early, outside M7; M7-2 adds its e2e proof.)
- Redesign the mic level bar (Stan, 2026-10-31): the thin "Listening" meter works but needs a proper visual design in
  the chosen theme. Keep its threshold mark (M3-AC10) and its `role="meter"`.
- Add-to-Home-Screen hint and safe-area insets (design §5.2).
- Streak and celebration effects in each theme (`components/feedback.ts`).
- Accessibility: button labels, contrast, reduced-motion support.

## Issues
| Id | Issue | ACs |
|---|---|---|
| M7-1 (#92) | Mic level bar redesign: a themed meter (taller bar, live fill, a clear "loud enough" zone from the threshold mark, tokens only) in its own `MicMeter.svelte`; e2e drives the level through the scripted input | AC6 |
| M7-2 (#93) | Update prompt proof: e2e serves one build, swaps in a new one mid-quiz, the banner shows, the question stays until **Update now**, which reloads into the new build | AC1 |
| M7-3 (#94) | iOS shell: a dismissible "Share → Add to Home Screen" hint on Home only in a Safari tab (pure `core/install.ts` decides; dismissal saved), and `env(safe-area-inset-*)` padding on the app shell | AC2, AC7 |
| M7-4 (#95) | Streak and celebration: pure `core/streak.ts` names the streaks worth celebrating (5, 10, 20, then every 10); each theme's `Feedback` gets a `celebrate` effect and the quiz shows the streak count pulse | AC8 |
| M7-5 (#96) | Reduced motion: under `prefers-reduced-motion` the feedback and celebration effects skip their motion (state still changes at once, the Continue rule is untouched), CSS transitions off | AC3 |
| M7-6 (#97) | Accessibility pass: labels for icon-only and key buttons, theme contrast fixes, `@axe-core/playwright` scan of every screen in e2e; M7 Summary | AC4 |

## Acceptance criteria
- M7-AC1 A new deploy shows the update prompt and never swaps mid-quiz (e2e). The banner exists; this AC adds the e2e proof.
- M7-AC2 The install hint shows only in the Safari tab, never in standalone mode, and stays away once dismissed (unit + e2e).
- M7-AC3 `prefers-reduced-motion` disables non-essential animation (e2e).
- M7-AC4 Home, Settings, the quiz, results and stats have no axe accessibility violations (WCAG 2 AA) in e2e.
  Changed at kick-off from "Lighthouse PWA/accessibility checks": Lighthouse 12 removed the PWA category, and its
  accessibility audit is axe on one page, so axe on every screen covers more. Installability stays covered by M0-AC5.
- M7-AC5 A waiting new version shows an "Update now" button, and tapping it applies the update (unit; shipped early with the banner).
- M7-AC6 The mic meter keeps `role="meter"`, its live value and its threshold mark, shows when the level is loud enough, and uses theme tokens only (e2e).
- M7-AC7 On iPhone and iPad, portrait and landscape, nothing sits under the notch or home indicator (manual).
- M7-AC8 A celebration fires exactly at the celebrated streaks and never on a miss or a retry (unit).

Refs: design §5.2, §4.4, §8.4.

## Summary (fill in at completion)

_Not started._ What shipped, decisions made, deviations from plan, follow-ups.
