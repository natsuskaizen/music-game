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
_Written when the milestone starts._ Known so far: #36 (Neon arcade note position, M8-AC2).

## Summary (fill in at completion)

_Not started._ What shipped, decisions made, deviations from plan, follow-ups.
