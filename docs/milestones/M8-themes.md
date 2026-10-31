# M8: Themes in Settings

**Goal**: Stan can switch themes in Settings, and every theme draws the note in the right place.

## Scope
- A **Theme** setting (Paper & ink, Storybook, Neon arcade), saved with the other settings (design §14). Paper & ink
  is the default. It replaces the `?theme=` demo links; `?theme=` can stay as a test hook.
- Fix the Neon arcade note-position bug (#36): the feedback animations leave a GSAP transform on the note.
- A drawn-position e2e check for every theme, so a theme or animation can't move the note off its pitch unnoticed.
- Comes near the end (after M7): the themes already work through tokens, so this is a settings and polish task.

## Acceptance criteria
- M8-AC1 Choosing a theme in Settings re-skins the app at once and survives a reload; a fresh install shows Paper & ink (e2e).
- M8-AC2 In every theme, after several answers the note group has no leftover transform and the notehead sits on
  its staff position (e2e, test plan in #36).
- M8-AC3 Each theme passes the M1 device checks on iPhone and iPad (manual).

## Issues
| Id | Issue | ACs |
|---|---|---|
| M8-1 (#105) | Note position: drawn-position e2e for every theme first (test plan in #36), then clear the leftover GSAP transform in `components/feedback.ts`. Closes #36 (Neon arcade) and #38 (Storybook) | AC2 |
| M8-2 (#106) | Theme setting: `Settings.theme` (Paper & ink default, migrated), a Theme control in Settings that re-skins at once, Home `?theme=` links removed (`?theme=` stays as a test hook that wins over the setting); M8 Summary | AC1 |

AC3 is a manual device check for Stan; it stays open and doesn't block building.

## Summary (fill in at completion)

- **Shipped**: the leftover GSAP transform is gone (`smoothOrigin: false`), fixing #36 and #38, with a drawn-position e2e in
  every theme (AC2). `Settings.theme` (default Paper & ink, migrated like the other fields) has a Theme control in Settings
  that re-skins the app at once and survives a reload (AC1). The Home theme links are gone.
- **Decision**: `?theme=` stays as a test hook and wins over the saved theme (`activeTheme`); `main.ts` sets `data-theme`
  from the saved setting before the first paint so there is no flash.
- **Open**: AC3 (each theme on iPhone and iPad) is Stan's manual device check.
- **Follow-ups**: F1 (accidentals, key signatures) and F3 (write or say the letter) are in the backlog.
