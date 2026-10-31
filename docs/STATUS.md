# Project status

The living summary of where the project stands. It's auto-loaded into every Claude session via
`CLAUDE.md`, so a new session starts here instead of from old chat history.
**Update it in every PR** (the "Now" and "Recent" sections), and refresh all of it when a milestone closes.
Keep it under ~60 lines: link to docs, don't copy them.

## Now
- **Phase**: M4 Tracking, review & ordering (`docs/milestones/M4-tracking.md`, issues #58–#63). M3 is built; its device ACs (AC6, AC7) are open for Stan.
- **Next issue**: M5 kick-off (M4 is built; the roadmap flips M4 and M5 then, since `ac-report` needs one In progress).
- **Blocked on Stan**: nothing.

## Decisions so far
| Topic | Decision | Where |
|---|---|---|
| Framework | Svelte 5 + SVG (Bravura) + GSAP; Phaser 4 evaluated, not chosen | `docs/frameworks.md` |
| Hosting | GitHub Pages, deploy only when all gates are green | roadmap |
| Inputs | Pluggable `InputMethod` registry: on-screen piano (M2), mic (M3); letter pad dropped; default in Settings, switchable mid-quiz | design §3.4, §14 |
| Wrong answers | Retry once, reveal, wait for Continue (never auto-advance) | design §8.4 |
| Answer precision | `exactOctave` setting for octave-aware inputs | design §9 |
| Note selection | Weighted: ledger lines, weakness, slowness, staleness | design §7.3 |
| Workflow | Milestone → issues → one PR per issue; code-reviewer agent (CI only) + static quality gates on every PR | roadmap |
| Token use | Issue threads on Sonnet; one AI review per PR (CI), local self-check instead of a subagent; one PR-link and one result message per thread; backup task every 2 h with an early exit | CLAUDE.md |
| AC report | Failing AC turns CI red; an AC with no test or `- [x]` check yet is *pending*, and a milestone can't close with any pending | roadmap |
| Build budget | `npm run size`: all gzipped JS in `dist/` (incl. service worker) ≤ 250 KB, part of `npm run check` | M0-6 |
| Gate proofs | Seeded-violation commits go on a **draft** PR and are reverted before it's marked ready | M0-4 |
| GitHub milestones | Not used; each issue body names its milestone (`.github/ISSUE_TEMPLATE/roadmap-issue.md`) | M0-7 |
| Difficulty | Easy / Medium / Hard sets range, ledger weighting, sequence size, timer; ledger counts never shown | design §14 |
| Ordering | Mostly within a third, ~10% jumps (clef, octave) | design §14 |
| Sound / timer | Note always plays after answer (master off switch); timer is a sprint (one bar per session, 60/50/40 s by difficulty) | design §14 |
| Themes | Paper & ink (Stan's M1 pick, default), Storybook and Neon arcade (`?theme=arcade`, back by Stan's call); a theme switch in Settings is M8 | design §14, M8 doc |
| Staff | `src/core/pitch.ts` + `staff-layout.ts` (pure geometry), `components/Staff.svelte` draws it; Bravura subset inlined by Vite (offline from first paint); grand staff middle lines 10 spaces apart | M1-1 |
| Theme tokens | `src/themes.css` CSS variables; Paper & ink on `:root`, Storybook overrides via `data-theme`; `?theme=` read by `core/theme.ts`; components use only tokens | M1-2 |
| Demo quiz | `core/keyboard.ts` layout; `Piano`/`Quiz` components; GSAP styles per theme in `components/feedback.ts`. M2-4 replaces it with the quiz screen | M1-3 |
| Answer sound | `audio/tone.ts`: one shared `AudioContext` made on the first tap, `audioSession.type = 'playback'`, a triangle tone with a 1.2 s decay; `core/session.ts` `toneAfter` plays the correct note on right or reveal (not on the first miss). Without `audioSession` a touch device shows a ringer hint. Added M1-AC5 for the automated part; AC2 stays manual | M1-4 |
| Icons | Paper & ink icons and theme color (Stan's pick); `npm run icons` renders the PNGs from `public/icon.svg` via Playwright | M1-5 |
| Note pool | `core/ranges.ts` `notePool(mode, difficulty)` from the §14 table (bounds written as pitches); `core/selector.ts` `pickNote` is uniform and never repeats, until M4's weighted ordering. The demo quiz uses Medium | M2-1 |
| Session | `core/session.ts`: `reduce(session, event, random)` with `answer` / `next` events; phases ask → retry → reveal or right → `next` → done after `questionsPerSession` (undefined = endless). `Answer` is `{ kind: 'pitch', midi }` only (letter answers are F3); `gradeAnswer` is exact pitch. Timer events wait for the sprint timer | M2-2 |
| Inputs (code) | `src/inputs/`: `types.ts` (`InputMethod`: id, label, `isAvailable`, a union of an on-screen input with a `component` taking `InputProps`, or a headless one with `start(emit)`); `registry.ts` (`register` refuses duplicate ids, `inputById` falls back to the first available); `index.ts` is the only list. No `octaveAware`: every input is exact pitch (§14). Contract suite mounts components in happy-dom | M2-3 |
| Quiz screen | `Quiz.svelte` is the quiz screen (the M1 demo is gone; the staff gallery stays for the M1 screenshots). `ActiveInput.svelte` draws an on-screen input or starts a headless one and stops it on a switch; the Input `<select>` (shown with 2+ available inputs) swaps it and the session is untouched, so the question and tries carry over. e2e runs on a `--mode e2e` build into `dist-e2e/` that also registers `inputs/scripted.ts` (a headless input a test drives with a `scripted-answer` event); the shipped build never includes it | M2-4 |
| Settings | `core/settings.ts`: `Settings` (clef, difficulty, input id, `questionsPerSession`, 0 = endless), `migrateSettings` validates each field, `loadSettings`/`saveSettings` on localStorage (errors ignored). `App.svelte` switches Home / Settings / Quiz; clef lives on Home, the quiz has a Home button and a results block when the session is done | M2-5 |
| Piano sound | `core/samples.ts` (21 samples every 3rd semitone, F#1–F#6; `nearestSample`, `detuneCents`); `audio/context.ts` is the one shared `AudioContext` (iOS playback session, ringer hint); `audio/piano.ts` `loadPiano`/`playPitch` (synth `audio/tone.ts` covers the first note until samples decode); `npm run piano-samples` builds `public/audio/piano/*.m4a` (340 KB, precached) from Salamander (CC BY 3.0, credit on Home and `docs/credits.md`) | M3-1 |
| Sound settings | `core/sound.ts`: `SoundSettings` (on, onShow, onWrong, volume 0.4/0.8/1, ignoreSilentSwitch) and the pure `noteToPlay(before, after, sound)` that replaced `toneAfter`: a phase change plays when settled, on a first miss (onWrong) or on a new question (onShow), nothing when `on` is off. Stored under `Settings.sound`; `setIgnoreSilentSwitch` flips the iOS audio session type live | M3-2 |
| Mic filter | `core/listen.ts`: `hzToMidi` (±30 cents), pure `listenStep(state, frame, config)` fires a note after 4 frames of one letter with clarity > 0.9, octave by majority; same note re-fires only after 3 gap frames, a different note fires at once. `DEFAULT_LISTEN` (internal) holds the tunables for M3-4 | M3-3 |
| Detection fixtures | `tests/fixtures/piano/<midi>.wav` (0.4 s, 44.1 kHz mono, nearest Salamander sample pitch-shifted ≤ 1 semitone); `tests/core/listen-accuracy.test.ts` slides a 4096 `PitchDetector` at 735-sample hops through `listenStep`. `DEFAULT_LISTEN` stays as is | M3-4 |
| Mic input | `inputs/mic.ts`: headless `mic` input; `start` calls `getUserMedia` (echo cancellation, noise suppression, auto-gain off) so the permission prompt shows only once it's chosen, runs a `pitchy` detector (fftSize 4096, −45 dB floor) each animation frame on the shared `AudioContext` through `listenStep`, emits pitch answers in A0–C8, and stop releases the tracks. Hidden without `getUserMedia`. Its tests are tagged M3-5, not AC6, so the manual latency AC stays pending | M3-5 |
| Listening UI | `HeadlessInput.listens` mutes `playPitch` in `Quiz`; `start(emit, heard)` reports the sounding note (`heardNote` in `core/listen.ts`) and the keyboard marks it `heard` (answer marks win). A headless input shows the piano beside "Listening". e2e drives it with `scripted-heard`. `prototypes/` deleted | M3-6 |
| Note stats | `core/stats.ts`: `NoteStat`, `Attempt` (ts, key, input, answer, tries, correct, ms; no `exactOctave`/`mode` yet), `statKey` (`treble:C6`), `newStat`, `credit` (1 / 0.5 / 0), `applyAttempt`: EWMA α 0.3 on credit and ms (first attempt replaces the 0.5 start), box +1 only on a first-try hit, 0 on a miss, streak counts first-try hits | M4-1 |
| Weighted pick | `core/selector.ts` `weight` (ledger × weakness × slowness × staleness, unseen ×2) and `pickWeighted(pool, ctx, previous)`: 15% of picks explore uniformly, never repeats. `weightsFor(difficulty)` turns the ledger boost on for Hard only. `weaknessGain` is 6, not design's 3, so 40% vs 95% accuracy gives ≥3× (M4-AC2); design §7.3 updated. Wired in by `learnedPicker` (M4-4) | M4-2 |
| Stepwise order | `core/selector.ts` `candidates(pool, random, previous)`: 90% same clef 1–3 steps away, 10% one jump kind (other clef, octave, octave ± 1–2) chosen uniformly among kinds that fit; falls back to the whole pool. `pickStepwise` picks uniformly among them and drives the session. M4-4 will weight within `candidates` | M4-3 |
| Storage | `storage/db.ts` (Dexie `sight-reading`: `stats` by key, `attempts` log): `recordAttempt` folds the attempt into its stat and appends it in one transaction; `loadStats`; `requestPersistence`. `Session` takes a `Picker` (`selector.ts`) instead of `random`: `learnedPicker` weights within `candidates`, `stepwisePicker` is the stats-free one for tests. `settledAttempt` builds the `Attempt` when a question settles (first miss records nothing). `Quiz` keeps a live stats map, merges stored stats in on mount, and ignores storage errors. | M4-4 |
| Review mode | `core/stats.ts` `isWeak` (seen and `box <= 1` or `ewmaAcc < 0.7`) and `weakNotes(pool, stats)`. `Quiz` with a `review` stats prop starts from the weak notes, refilters after each settled answer (`withPool`), and the session is `done` when the pool is empty; a lone weak note may repeat. Home's "Review weak notes (n)" button is disabled at 0 | M4-5 |
| Backup | `core/backup.ts` (`serializeBackup`, `parseBackup` validates, `rebuildStats` replays attempts); `storage/backup-file.ts` (`exportProgress` share sheet or download, `importProgress`); `db.ts` `replaceAttempts` swaps log and stats in one transaction. File is `{ v: 1, attempts }` | M4-6 |
| Milestone status | A milestone with only manual device ACs left is "Built, device checks open" on the roadmap, so the next one can be the single In progress (`ac-report` needs exactly one) | roadmap |
| Later | Accidentals/key signatures (F1), write or say the letter (F3) | roadmap |

## Milestones
M0 ✓ · M1 ✓ · M2 ✓ · M3 ✓ built (device ACs open) · M4 ✱ built (roadmap flips at M5 kick-off) · M5 ○ · M6 ○ · M7 ○ · F1, F3 backlog
(✓ done, ✱ in progress, ○ not started)

## Recent
- 2026-10-31: M4-6 (#63): JSON export/import in Settings (share sheet or download, validated, replace-on-restore), M4 Summary written (M4-AC6).
- 2026-10-31: M4-5 (#62): Review weak notes: `weakNotes` pool, session ends when empty, Home button (M4-AC5).
- 2026-10-31: M4-4 (#61): Dexie storage, `recordAttempt`, and `learnedPicker` (weighted, stepwise) drive the quiz; stats survive a reload.
- 2026-10-31: Mic fix from Stan's iPhone test (M3-AC9): audio session `play-and-record` while listening (iOS refused the mic under `playback`, so no prompt), error message when the mic is blocked, level meter, context resumes on return to the app. Needs re-test on the iPhone.
- 2026-10-31: M4-3 (#60): `pickStepwise` (steps of 1–3, ~10% jumps of three kinds) now drives the session (M4-AC4); doc nits from the M4-2 review fixed.
- 2026-10-31: M4-2 (#59): `pickWeighted` and `weight` in `core/selector.ts` (M4-AC2, AC3).

## Known issues / open questions
- Neon arcade draws the quiz note off its pitch after a few answers (leftover GSAP transform); tests read the `aria-label`, so they missed it. Fix and a drawn-position e2e check in M8 (#36).
- `review.yml` re-runs the AI review on any `labeled` event, not just `review-override`: skipping it would leave a passing "skipped" check that hides a failed review. Labels are rare, so the extra run is accepted.
- WebKit can't be downloaded in the cloud sessions, so e2e runs there on Chromium as a smoke test; CI is the WebKit source of truth.
- The `CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token` expires after about a year. If the AI review starts failing to authenticate, regenerate it.
- iOS: mic permission may re-prompt per launch (M3). Stan's iPhone test: no mic prompt at all and sound dropped after app switching; fixed in M3-AC9, awaiting re-test. The answer tone is silent in airplane mode (#39, M3-AC7).
