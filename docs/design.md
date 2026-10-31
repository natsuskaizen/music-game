# Sight-Reading Quiz: Research & Design

Status: **proposal, no code yet**. This document picks a stack, explains the
offline/iPad story, and sketches the core algorithms with code so the first
implementation PR is mostly typing.

## 1. Goals (from the request)

1. A web SPA that installs on iPad/iPhone and works **fully offline**.
2. **Single-note mode**: show one note on treble, bass, or either (grand staff); answer with its letter.
3. **Multi-note mode**: show a short sequence; tap the letters in order.
4. **Track per-note accuracy** and bring weak notes back more often (review).
5. **Settings**: clef choice (treble / bass / both), timer (off or customizable),
   and **play notes audibly** (on/off and when).
6. Notes an octave above/below the staff (ledger lines) are harder and should
   appear **more frequently**.
7. **Polished, game-like graphics**. Phaser 4 was evaluated; Svelte 5 + SVG + GSAP was chosen (section 2).
8. **Answer on a piano**: an on-screen keyboard, or by playing a real piano into the mic.

Non-goals for v1: MIDI input, accidentals/key signatures, accounts or sync.
Accidentals/key signatures are planned as a later feature (see the roadmap).

---

## 2. Recommendation at a glance

**Decided: Svelte 5 + SVG + GSAP.** Phaser 4 and three other alternatives were compared in
[frameworks.md](frameworks.md). Svelte won on crisp notation, a native-feeling scrollable keyboard,
one shared audio setup for playback and mic, testability, and bundle size (~40 KB vs ~374 KB gz,
measured in `prototypes/compare`).

| Concern | Choice | Why |
|---|---|---|
| Build | **Vite + TypeScript** | Fast, static output, first-class PWA plugin |
| UI | **Svelte 5** (runes) | Little boilerplate, reads like HTML, compiles away to small JS |
| Notation | **SVG staff** with the **Bravura** SMuFL font (3 KB subset) | Vector, sharp at any zoom; VexFlow 5 is the fallback for complex engraving |
| Animation | **GSAP 3** | Tweens, elastic shakes, spark bursts; free including plugins |
| Answer input | **Pluggable inputs**: letter pad, on-screen piano, mic, more later | One `InputMethod` interface and registry; all feed `gradeAnswer()` (3.4) |
| Audio | **Web Audio**: one `AudioContext` for piano-sample playback and mic listening | Works offline once precached; one place to enforce "mute while listening" |
| Pitch detection | **pitchy** (McLeod method) | Small, accurate for single piano notes |
| State | **Svelte stores** | Built in; settings persisted to localStorage |
| Offline | **vite-plugin-pwa** (Workbox `generateSW`, precache everything) | One config block gives a service worker and manifest |
| Storage | **IndexedDB via Dexie 4** + JSON export/import | Durable, queryable attempt log; backup guards against iOS storage loss |
| Tests | **Vitest** (core) + **Playwright WebKit** (UI) | DOM buttons and keys are directly testable by role and name |
| Hosting | **GitHub Pages** | Service workers require HTTPS; deploys only when gates are green |

If you've worked on Python projects, the shape will look familiar. `src/core/` is a pure domain
package with no DOM (think `domain/` + `services/`), `src/storage/` is the repository
layer, and Svelte components are a thin presentation layer on top. Components never decide
which note comes next; they render what the core hands them and report taps back.

---

## 3. Rendering & input

Working prototypes of everything in this section are in `prototypes/compare/`
(`npm run dev`, then open `/keyboard.html`).

### 3.1 Staff as SVG + Bravura glyphs

Drill notes don't need stems, beams, or rhythm, so draw **whole notes**. The staff is
5 SVG lines, and the ledger lines come from the pitch math in section 6. Clefs and
noteheads are SMuFL glyphs from Bravura (SIL OFL), subset to 5 glyphs (about 3 KB):
`gClef` U+E050, `fClef` U+E062, `brace` U+E000, `noteheadWhole` U+E0A2, `noteheadBlack` U+E0A4.

SMuFL fonts are designed so 1 em = 4 staff spaces and each glyph's baseline sits on its
reference line. That makes positioning plain arithmetic:

```svelte
<!-- Staff.svelte (trimmed from prototypes/compare/src/svelte/KeyboardQuiz.svelte) -->
<svg viewBox="0 0 640 248">
  {#each [-4, -2, 0, 2, 4] as p}<line x1={LEFT} x2={RIGHT} y1={yOf(p)} y2={yOf(p)} />{/each}
  <!-- G clef baseline on the G4 line, F clef on the F3 line -->
  <text class="smufl" x={LEFT + 12} y={clefY(note.clef)} font-size={4 * S}>{clefGlyph(note.clef)}</text>
  <g bind:this={noteEl} class="note {phase}">
    {#each ledgerPositions(pos) as p}<line x1={NOTE_X - S * 1.35} x2={NOTE_X + S * 1.35} y1={yOf(p)} y2={yOf(p)} />{/each}
    <text class="smufl" x={NOTE_X} y={yOf(pos)} text-anchor="middle" font-size={4 * S}>{''}</text>
  </g>
</svg>
```

```ts
// yOf: staff position (0 = middle line, +1 per line/space) → SVG y
export const yOf = (pos: number) => MID_Y - pos * (S / 2);
```

Feedback animation is GSAP on the note's `<g>`: slide in, elastic shake on a miss, scale-and-fade
plus a spark burst on a hit. Each one is a single `gsap.fromTo` call.

**Fallback**: VexFlow 5 (`vexflow/bravura` entry, fonts embedded, offline-safe) renders SVG
natively into the same DOM if we later need real engraving (accidentals spacing, key signatures in F1).

### 3.2 On-screen piano keyboard

Each key is a real `<button>` with `aria-label="C4"`. Keys are absolutely positioned: white
keys side by side, black keys centered on the boundary after their white key.

- **Range follows the clef setting**: treble E3–F6, bass G1–A4, both G1–F6.
- **Sizing**: key width is `clamp(38px, available / whiteKeys, 60px)`. The treble range fits an
  iPad in landscape. On iPhone the keyboard scrolls sideways with `overflow-x: auto`, so iOS supplies the
  momentum and rubber-banding.
- **Taps use `click`, not `pointerdown`**, so a swipe to scroll never registers as a key press.
  `touch-action: manipulation` removes the double-tap zoom delay.
- **Landmarks**: C keys are always labeled (C3, C4…) and middle C has a dot. A "Key names" setting labels every key.
- **State is a CSS class per key**: `wrong` (red), `right` (green), `heard` (teal, the note the mic is hearing).

```svelte
<!-- Piano.svelte (trimmed) -->
<div class="scroller" bind:clientWidth={viewW}>             <!-- overflow-x: auto -->
  <div class="bed" style:width="{nWhite * W}px">
    {#each keys as k (k.m)}
      <button class="key {k.black ? 'black' : 'white'} {marks.get(k.m) ?? ''}"
              style:left="{k.black ? k.wi * W - BW / 2 : k.wi * W}px"
              aria-label={nameOf(k.m)} onclick={() => onpress(k.m)}></button>
    {/each}
  </div>
</div>
```

Playwright can then drive it exactly like a person: `page.getByRole('button', { name: 'C4', exact: true }).click()`.

### 3.3 One grader for every input

Letter pad, keyboard, and mic all end in the same pure function, `gradeAnswer()` (3.4). The
retry → reveal → Continue flow and the stats therefore work identically whatever you answer with.

### 3.4 Pluggable answer inputs

Inputs will keep growing, so each one is a **plug-in** behind one small interface. The quiz
core never knows which input produced an answer. Adding an input means adding one file
and one `register()` call, with no change to `src/core/`.

```ts
// src/inputs/types.ts
/** What an input reports. Letter-only inputs can't know the octave; pitch inputs can. */
export type Answer =
  | { kind: 'letter'; letter: Letter }
  | { kind: 'pitch'; midi: number };

/** Contract every answer input implements. */
export interface InputMethod {
  id: string;                         // stored in settings, e.g. 'piano'
  label: string;                      // shown in Settings
  octaveAware: boolean;               // decides whether "Octave must match" applies
  /** Feature check, e.g. mic needs getUserMedia. Unavailable inputs are hidden. */
  isAvailable(): boolean;
  /** On-screen UI, or null for headless inputs (mic, hardware keyboard). */
  component: Component<InputProps> | null;
  /** Headless inputs start here and return a stop function. */
  start?(emit: (a: Answer) => void): Promise<() => void>;
}
```

```ts
// src/inputs/registry.ts
const inputs = new Map<string, InputMethod>();
export const register = (m: InputMethod) => void inputs.set(m.id, m);
export const available = () => [...inputs.values()].filter(m => m.isAvailable());

// src/inputs/index.ts — the only place that lists inputs
register(letterPad); register(pianoKeys); register(micListener); register(hardwareKeys);
```

The grader takes an `Answer`, so every input shares the retry → reveal → Continue flow and the stats:

```ts
// src/core/quiz.ts
export function gradeAnswer(s: QuizState, a: Answer, exactOctave: boolean): QuizState {
  if (a.kind === 'letter') return grade(s, a.letter === s.note.letter);
  const diff = a.midi - midiOf(s.note);
  return grade(s, exactOctave ? diff === 0 : ((diff % 12) + 12) % 12 === 0);
}
```

**Several inputs can be on at once**, e.g. the on-screen piano plus the mic, so you can either tap or play.
`settings.inputs` is a list of ids. The first answer from any input counts.

| Input | Kind | Status |
|---|---|---|
| Letter pad (A–G) | letter | M2 |
| On-screen piano | pitch | M5 |
| Mic (real piano) | pitch | M3 |
| Hardware keyboard (A–G keys on an iPad keyboard) | letter | Cheap add-on, any milestone |
| Letter + octave picker | pitch | M5 |
| Solfège pad (Do Re Mi) | letter | Idea |
| USB/Bluetooth MIDI piano | pitch | Desktop/Android only (no Web MIDI on iOS) |

**Contract test**: one shared Vitest suite runs against every registered input with a fake
`emit` (it registers, reports availability, and emits well-formed answers). A new input passes the same
tests with no extra wiring.

---

## 4. Audio: playing the notes

### 4.1 Approach

Use Web Audio directly with **real piano samples** at every third semitone,
pitch-shifted to the in-between notes using `AudioBufferSourceNode.detune` (in cents). Shifting ±1 semitone is inaudible as an artifact.

- The playable range is G1 to F6 (MIDI 31 to 89), so about 20 samples are needed.
- Source: the **Salamander Grand Piano** samples (CC-BY 3.0, credit in an About screen).
  Trim each to about 1.5 s and encode to **AAC `.m4a`** or `.mp3`. Both play on iOS. That's roughly 20 × 25 KB, about 500 KB.
- Precached by the service worker like any other asset, so sound works offline.
- **Zero-asset fallback**: an `OscillatorNode` with a quick decay envelope. It sounds like
  a beep, not a piano, but it's handy before samples are wired up.

```ts
// src/core/pitch.ts (addition)
const SEMITONE: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export const midi = (p: Pitch) => (p.octave + 1) * 12 + SEMITONE[p.letter]; // C4 = 60
export const hz = (p: Pitch) => 440 * 2 ** ((midi(p) - 69) / 12);
```

```ts
// src/audio/piano.ts
const SAMPLE_MIDIS = Array.from({ length: 21 }, (_, i) => 30 + i * 3); // 30, 33, ... 90
const buffers = new Map<number, AudioBuffer>();

export async function loadPiano(ctx: AudioContext) {
  await Promise.all(SAMPLE_MIDIS.map(async m => {
    const res = await fetch(`${import.meta.env.BASE_URL}audio/piano/${m}.m4a`); // served from SW precache offline
    buffers.set(m, await ctx.decodeAudioData(await res.arrayBuffer()));
  }));
}

export function playPitch(ctx: AudioContext, p: Pitch, volume = 0.8) {
  const target = midi(p);
  const nearest = SAMPLE_MIDIS.reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a));
  const src = new AudioBufferSourceNode(ctx, { buffer: buffers.get(nearest)!, detune: (target - nearest) * 100 });
  src.connect(new GainNode(ctx, { gain: volume })).connect(ctx.destination);
  src.start();
}
```

### 4.2 iOS audio gotchas

| Gotcha | Mitigation |
|---|---|
| Audio stays locked until a user gesture | Create/resume the shared `AudioContext` inside the Home screen's "Start" tap handler |
| On iPhone, the **ring/silent switch mutes Web Audio** by default | Set `navigator.audioSession.type = 'playback'` (Safari 16.4+) when sound is enabled; feature-detect it. Confirm on device in the spike |
| AudioContext gets suspended when the app is backgrounded | `ctx.resume()` on `visibilitychange` and on the next tap |

```ts
// src/pwa/audioSession.ts
export function preferPlaybackSession() {
  const s = (navigator as any).audioSession;
  if (s && 'type' in s) s.type = 'playback'; // play even with the silent switch on
}
```

### 4.3 When to play (setting)

Superseded by §14: the note always plays after the answer when sound is on, and "on show" and "on wrong" are extra toggles.

| Option | Behavior | Why you'd pick it |
|---|---|---|
| `off` | Silent | Practicing in public |
| `afterAnswer` (default) | Play the correct note after you answer | Connects the written note to its sound without giving the answer away |
| `onShow` | Play when the note appears | Easier mode; you learn to link sound and position |
| `onWrong` | Play only after a miss | Reinforces mistakes without slowing a fast streak |

In sequence mode, `afterAnswer` plays each note as it's tapped, so a correct run
sounds like the melody, which is a nice reward. **While the mic is listening, playback is
always muted** so the app never hears itself.

### 4.4 Listening to a real piano (mic input, roadmap M3)

The mic shares the playback `AudioContext`. An `AnalyserNode` feeds `pitchy` about 60 times
a second. A note counts once it holds for 4 frames (~65 ms) with clarity > 0.9. The same
note can fire again only after a short silence or a different note. The resulting MIDI number goes
through `gradeAnswer()` like a tap. A working version is in `prototypes/compare/src/shared/mic.ts`.

```ts
const stream = await navigator.mediaDevices.getUserMedia({
  audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, // keep the raw piano tone
});
const analyser = ctx.createAnalyser();
analyser.fftSize = 4096;                         // ~85 ms window, enough for low bass notes
ctx.createMediaStreamSource(stream).connect(analyser);
const detector = PitchDetector.forFloat32Array(analyser.fftSize);

// per animation frame:
const [hz, clarity] = detector.findPitch(buf, ctx.sampleRate);
const midi = clarity > 0.9 ? Math.round(69 + 12 * Math.log2(hz / 440)) : -1;
if (stableFor(midi, 4)) emit({ kind: 'pitch', midi }); // → gradeAnswer(state, answer, exactOctave)
```

| Limitation | Handling |
|---|---|
| Octave errors from piano overtones | Letters-only mode ignores octave. Exact mode takes a majority over frames |
| Lowest notes (around G1) are slow and less reliable | Larger window for bass-heavy ranges; documented, not hidden |
| Single notes only | Fine for both modes. Chords would need an ML model (out of scope) |
| iOS may re-ask mic permission per launch of the home-screen app | Ask only when "Listen" is tapped; remember the choice in settings |
| Digital piano over USB/Bluetooth MIDI | Not possible in iOS Safari (no Web MIDI). The mic works with any piano |

---

## 5. Offline & install on iOS

There's no general way to "download an HTML file and run it" on iOS. The
supported path is a **PWA**: open the site in Safari, then Share, then **Add to Home Screen**.
It launches full-screen, runs offline from the service worker cache, and has its own storage.

### 5.1 Build config

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/music-game/', // GitHub Pages project path
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'prompt', // show "Update available" instead of silently swapping mid-quiz
      includeAssets: ['apple-touch-icon.png'],
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2,m4a,mp3}'] }, // precache everything, incl. font + piano samples
      manifest: {
        name: 'Sight Reading Trainer',
        short_name: 'SightRead',
        display: 'standalone',
        orientation: 'any',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
```

### 5.2 iOS Safari gotchas (and the mitigation for each)

| Gotcha | Mitigation |
|---|---|
| No `beforeinstallprompt`, so there's no install button API | Show a one-time "Share → Add to Home Screen" hint when `!navigator.standalone` |
| Icons come from `apple-touch-icon`, not the manifest | Add `<link rel="apple-touch-icon" href="/apple-touch-icon.png">` (180×180) |
| **Safari tab and home-screen app have separate storage** | Tell the user to practice from the installed app; provide export/import |
| Safari may evict script-written storage for sites unused for 7 days; home-screen apps are exempt | Install as PWA, call `navigator.storage.persist()`, and keep JSON backup as a safety net |
| Double-tap zoom and 300ms delays on fast tapping | `touch-action: manipulation` on buttons; `user-scalable=no` is ignored, so don't rely on it |
| Notch / home indicator | `viewport-fit=cover` + `env(safe-area-inset-*)` padding |
| Timer drift when app is backgrounded | Use timestamps (`performance.now()`), and pause on `visibilitychange` |
| Web MIDI isn't supported on iOS | Out of scope; on-screen buttons only |

```ts
// src/pwa/persist.ts
export async function requestPersistence() {
  if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
    await navigator.storage.persist(); // best effort; iOS may grant silently or not
  }
}
```

### 5.3 Escape hatch

If the PWA ever feels limiting, the same build can be wrapped with **Capacitor**
into a native iOS app. That needs Xcode and an Apple developer account for anything beyond
personal sideloading, so it isn't worth it now.

---

## 6. Music model (pure, no DOM)

Use a **diatonic index** (letters only, no accidentals in v1) so staff
positions and ledger lines become plain arithmetic.

```ts
// src/core/pitch.ts
export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export type Letter = (typeof LETTERS)[number];
export type Clef = 'treble' | 'bass';
export interface Pitch { letter: Letter; octave: number } // scientific: C4 = middle C

export const diatonic = (p: Pitch) => p.octave * 7 + LETTERS.indexOf(p.letter);
export const fromDiatonic = (d: number): Pitch =>
  ({ letter: LETTERS[((d % 7) + 7) % 7], octave: Math.floor(d / 7) });

const MIDDLE_LINE: Record<Clef, Pitch> = {
  treble: { letter: 'B', octave: 4 },
  bass:   { letter: 'D', octave: 3 },
};

/** 0 = middle line; +1 per line/space upward. Staff lines are at -4..+4 (even numbers). */
export const staffPos = (p: Pitch, clef: Clef) => diatonic(p) - diatonic(MIDDLE_LINE[clef]);

export const ledgerLines = (p: Pitch, clef: Clef) =>
  Math.max(0, Math.floor((Math.abs(staffPos(p, clef)) - 4) / 2));

export const toVexKey = (p: Pitch) => `${p.letter.toLowerCase()}/${p.octave}`;
export const statKey = (p: Pitch, clef: Clef) => `${clef}:${p.letter}${p.octave}`; // "treble:C6"
```

### 6.1 Ranges ("an octave above or below")

| Clef | On the staff | Range with 3 ledger lines (≈ an octave beyond) |
|---|---|---|
| Treble | E4 – F5 | **E3 – F6** |
| Bass | G2 – A3 | **G1 – A4** |

Checks: treble F6 has staffPos 11, so `floor(7/2)` = 3 ledger lines (A5, C6, E6). Bass G1
has staffPos −11, so 3 ledger lines (E2, C2, A1). Each clef is 26 notes, 52 items total.

```ts
// src/core/ranges.ts
export type RangeLevel = 'staff' | 'ledger1' | 'ledger2' | 'ledger3';
const MAX_LEDGER: Record<RangeLevel, number> = { staff: 0, ledger1: 1, ledger2: 2, ledger3: 3 };

export function notePool(clef: Clef, level: RangeLevel): Pitch[] {
  const mid = diatonic(MIDDLE_LINE[clef]);
  const out: Pitch[] = [];
  for (let d = mid - 11; d <= mid + 11; d++) {
    const p = fromDiatonic(d);
    if (ledgerLines(p, clef) <= MAX_LEDGER[level]) out.push(p);
  }
  return out;
}
```

**Stats are keyed by clef + pitch**, so `treble:C4` and `bass:C4` are tracked
separately. Reading middle C off the bottom of the treble staff is a different
skill from reading it off the top of the bass staff.

---

## 7. Tracking & weighted selection

### 7.1 Why not plain SM-2/Anki scheduling?

Classic spaced repetition schedules *when* an item is due across days. Here the
deck is tiny (≤52 items) and a session is a rapid-fire drill, so what's needed is
"**which note next?**", sampled with bias toward weak and hard notes. The proposal is a
**weighted random sampler**, with a light Leitner-style "mastery box" layered on top
for a dedicated *Review* mode and for the stats screen.

### 7.2 Stored data

```ts
// src/core/types.ts
export interface NoteStat {
  key: string;          // "treble:C6"
  attempts: number;
  correct: number;
  ewmaAcc: number;      // exponentially weighted accuracy, recent answers count more (0..1)
  ewmaMs: number;       // exponentially weighted response time
  streak: number;       // consecutive correct
  box: 0 | 1 | 2 | 3 | 4; // Leitner box: 0 = struggling, 4 = mastered
  lastSeen: number;     // epoch ms
}

export interface Attempt {   // append-only log, for history charts and re-deriving stats
  id?: number;
  ts: number;
  key: string;
  mode: 'single' | 'sequence';
  input: string;             // InputMethod id (3.4): letter-only answers are easier than exact keys
  exactOctave: boolean;      // so stats can be filtered by how strict the answer was
  answer: Answer | null;     // null = timed out
  tries: 1 | 2;
  correct: boolean;
  ms: number;
}
```

Updating after each answer:

```ts
// src/core/scoring.ts
const ALPHA = 0.3; // weight of the newest answer in the EWMA

export function applyAttempt(s: NoteStat, a: Attempt): NoteStat {
  const hit = a.correct ? 1 : 0;
  return {
    ...s,
    attempts: s.attempts + 1,
    correct: s.correct + hit,
    ewmaAcc: s.attempts === 0 ? hit : ALPHA * hit + (1 - ALPHA) * s.ewmaAcc,
    ewmaMs: s.attempts === 0 ? a.ms : ALPHA * a.ms + (1 - ALPHA) * s.ewmaMs,
    streak: a.correct ? s.streak + 1 : 0,
    box: (a.correct ? Math.min(4, s.box + 1) : 0) as NoteStat['box'], // miss drops to box 0
    lastSeen: a.ts,
  };
}

export const newStat = (key: string): NoteStat =>
  ({ key, attempts: 0, correct: 0, ewmaAcc: 0.5, ewmaMs: 0, streak: 0, box: 0, lastSeen: 0 });
```

### 7.3 The weight function

Each candidate note's weight is a product of independent factors, so each knob is
easy to reason about and tune:

```
weight = difficulty × weakness × slowness × staleness
```

```ts
// src/core/selector.ts
export interface WeightConfig {
  ledgerBoost: number;   // per ledger line; 0.6 means 3 ledger lines ≈ 2.8× an on-staff note
  weaknessGain: number;  // 3: a note at 0% accuracy is 4× a note at 100%
  targetMs: number;      // "fast enough" response time
  exploration: number;   // 0.15: share of picks that ignore stats (keeps coverage)
}

export const DEFAULT_WEIGHTS: WeightConfig =
  { ledgerBoost: 0.6, weaknessGain: 3, targetMs: 2500, exploration: 0.15 };

export function weight(p: Pitch, clef: Clef, s: NoteStat | undefined, cfg: WeightConfig, now: number) {
  const difficulty = 1 + cfg.ledgerBoost * ledgerLines(p, clef);
  if (!s || s.attempts === 0) return difficulty * 2;            // unseen: show soon

  const weakness  = 1 + cfg.weaknessGain * (1 - s.ewmaAcc);
  const slowness  = clamp(s.ewmaMs / cfg.targetMs, 0.75, 2);
  const days      = (now - s.lastSeen) / 86_400_000;
  const staleness = 1 + 0.5 * Math.min(days / 7, 1);            // up to +50% after a week
  return difficulty * weakness * slowness * staleness;
}

export function pickNext(
  pool: { p: Pitch; clef: Clef }[],
  stats: Map<string, NoteStat>,
  recent: string[],           // last 2-3 keys, so the same note isn't repeated back-to-back
  cfg = DEFAULT_WEIGHTS,
  rnd = Math.random,          // injectable for deterministic tests
) {
  const candidates = pool.filter(c => !recent.includes(statKey(c.p, c.clef)));
  if (rnd() < cfg.exploration) return candidates[Math.floor(rnd() * candidates.length)];

  const now = Date.now();
  const ws = candidates.map(c => weight(c.p, c.clef, stats.get(statKey(c.p, c.clef)), cfg, now));
  let r = rnd() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < candidates.length; i++) if ((r -= ws[i]) <= 0) return candidates[i];
  return candidates[candidates.length - 1];
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
```

For comparison, here's the same sampler in Python, which is also handy for simulating tuning offline:

```python
import random

def pick_next(candidates, weights, exploration=0.15, rng=random):
    if rng.random() < exploration:
        return rng.choice(candidates)
    return rng.choices(candidates, weights=weights, k=1)[0]
```

Worked example with default config:

| Note | Ledger lines | Accuracy | Speed | Weight |
|---|---|---|---|---|
| treble:G4 (on staff, known) | 0 | 0.95 | 1.5s | 1 × 1.15 × 0.75 ≈ **0.86** |
| treble:C6 (2 ledger, shaky) | 2 | 0.60 | 4.0s | 2.2 × 2.2 × 1.6 ≈ **7.7** |
| bass:A1 (3 ledger, unseen) | 3 | n/a | n/a | 2.8 × 2 ≈ **5.6** |

So a shaky high C comes up about 9× as often as a solid G4, which is the behavior you asked for.

### 7.4 Modes built on top of the sampler

- **Practice**: pool = everything allowed by settings; weighted sampling as above.
- **Review weak notes**: pool = notes with `box <= 1` or `ewmaAcc < 0.7`. Ends when the pool is empty.
- **Stats screen**: heat-map of every note on a staff, colored by `ewmaAcc`, plus
  response time. This doubles as a way to sanity-check the weighting.

### 7.5 Tuning by simulation

Because `pickNext` takes an injectable `rnd`, a Vitest test (or a quick Python
script) can simulate a "player" with known weak spots for 500 questions and assert
that weak notes get at least N× the exposure. That gives cheap regression protection when tweaking constants.

---

## 8. Game modes

### 8.1 Single note

```
┌───────────────────────────────┐
│  ⏱ 3.2s          12/20  ✓ 10  │
│                               │
│     𝄞 ─────────────────       │
│       ─────────────────       │
│       ──────●──────────       │
│       ─────────────────       │
│       ─────────────────       │
│                               │
│  [C] [D] [E] [F] [G] [A] [B]  │  ← large tap targets, ≥ 44pt
└───────────────────────────────┘
```

- Clef setting `treble` / `bass` / `both`. With `both`, each question picks a
  clef (weighted too), and a **grand staff** is shown with the note on one stave so the
  eye also learns to pick the right stave.
- Wrong answer: same **retry-then-reveal** flow as sequences (8.4).

### 8.2 Multi-note sequence

- N notes (setting, default 6) on one stave. The current target note is highlighted blue.
- A correct tap turns the note green and moves the cursor on. A wrong tap follows the
  **retry-then-reveal** flow (8.4). Stats are recorded **per note**, so sequences feed the same table.
- Generation: sample each note with `pickNext`, but constrain the interval
  from the previous note (≤ an octave by default) so it reads like a melodic
  line instead of random jumps. This is a setting ("Leaps: small / any").

```ts
export function makeSequence(n: number, pool: Candidate[], stats: Map<string, NoteStat>, maxLeap = 7) {
  const seq: Candidate[] = [];
  for (let i = 0; i < n; i++) {
    const prev = seq[i - 1];
    const allowed = prev
      ? pool.filter(c => c.clef === prev.clef && Math.abs(diatonic(c.p) - diatonic(prev.p)) <= maxLeap)
      : pool;
    seq.push(pickNext(allowed, stats, seq.slice(-1).map(c => statKey(c.p, c.clef))));
  }
  return seq;
}
```

### 8.3 Session state machine

Keeping the quiz loop as an explicit reducer makes timers and feedback testable
without a browser:

```ts
type QuizState =
  | { phase: 'idle' }
  | { phase: 'asking'; items: Candidate[]; cursor: number; startedAt: number; deadline?: number }
  | { phase: 'retry'; items: Candidate[]; cursor: number; startedAt: number }   // 1st miss
  | { phase: 'reveal'; items: Candidate[]; cursor: number; last: Attempt }      // waits for CONTINUE
  | { phase: 'done'; summary: SessionSummary };

type QuizEvent =
  | { type: 'START'; items: Candidate[]; now: number }
  | { type: 'ANSWER'; answer: Answer; input: string; now: number }
  | { type: 'TICK'; now: number }           // detects timeout
  | { type: 'CONTINUE'; now: number };     // only a user tap leaves 'reveal'; never automatic

export function reduce(s: QuizState, e: QuizEvent, settings: Settings): QuizState { /* ... */ }
```

---

### 8.4 Wrong answers: retry, then reveal, then confirm (decided)

Applies to both modes.

1. **First miss**: the note shakes red and you get a **second try**. The timer, if on, doesn't restart.
2. **Second miss or timeout**: the correct answer is **revealed**. The note is labeled
   (e.g. "C6"), and the sound plays if enabled.
3. The quiz **waits** until you tap **Continue**. It never advances automatically.

Scoring for the stats: a first-try hit is 1.0, a second-try hit is 0.5, and a miss is 0.
`ewmaAcc` uses that credit instead of a plain boolean, and the Leitner `box` only goes
up on a first-try hit.

```ts
export const credit = (tries: 1 | 2, correct: boolean) => (!correct ? 0 : tries === 1 ? 1 : 0.5);
```

## 9. Settings

Updated by §14 (difficulty, single input, sound toggles, timer).

```ts
// src/core/settings.ts
export interface Settings {
  clef: 'treble' | 'bass' | 'both';
  difficulty: 'easy' | 'medium' | 'hard';   // sets range, ledger weighting, sequence length, timer (§14)
  mode: 'single' | 'sequence';
  questionsPerSession: number;     // e.g. 20, or 0 = endless
  timer: boolean;                  // sprint: one countdown bar per session, length from difficulty (§14)
  input: string;                   // default input id from the registry (3.4); switchable mid-quiz
  showKeyNames: boolean;           // label every key, not just the Cs
  showOctaveOnFeedback: boolean;   // "C6" vs "C"
  sound: {
    on: boolean;                   // when on, the note always plays after the answer
    onShow: boolean;               // also play when the note appears
    onWrong: boolean;              // also play after a wrong try
    volume: number;                                        // 0..1
    ignoreSilentSwitch: boolean;                           // sets navigator.audioSession.type
  };
}

export const DEFAULT_SETTINGS: Settings = {
  clef: 'treble', difficulty: 'medium', mode: 'single', questionsPerSession: 20, timer: false,
  input: 'piano', showKeyNames: false, showOctaveOnFeedback: true,
  sound: { on: true, onShow: false, onWrong: false, volume: 0.8, ignoreSilentSwitch: true },
};
```

Settings are small and read synchronously at startup, so they live in **localStorage** through a
persisted Svelte store. Stats and attempts live in IndexedDB.

**Versioning**: settings carry `v: number`, and a `migrateSettings()` function fills new fields with defaults,
so an app update never breaks saved settings. Dexie schema changes use `this.version(n).upgrade(...)`.
Exported backups carry `v` as well.

Response time is **always recorded**, even with the timer off, so "slow" still counts as weak.

---

## 10. Persistence

```ts
// src/storage/db.ts
import Dexie, { type Table } from 'dexie';

class QuizDB extends Dexie {
  stats!: Table<NoteStat, string>;     // pk = key
  attempts!: Table<Attempt, number>;   // ++id
  constructor() {
    super('sight-reading');
    this.version(1).stores({
      stats: 'key, box, lastSeen',
      attempts: '++id, ts, key',
    });
  }
}
export const db = new QuizDB();

export async function recordAttempt(a: Attempt) {
  await db.transaction('rw', db.stats, db.attempts, async () => {
    const prev = (await db.stats.get(a.key)) ?? newStat(a.key);
    await db.stats.put(applyAttempt(prev, a));
    await db.attempts.add(a);
  });
}

export async function exportBackup(): Promise<Blob> {
  const data = { v: 1, stats: await db.stats.toArray(), attempts: await db.attempts.toArray() };
  return new Blob([JSON.stringify(data)], { type: 'application/json' });
  // UI: navigator.share({ files: [...] }) on iOS lets you save to Files/iCloud
}
```

Size check: about 100 bytes per attempt, so 20,000 answers is about 2 MB. That's far below quotas.
`stats` is a cache that can always be rebuilt from `attempts`, much like a
materialized view, which makes it safe to change the scoring formula later.

---

## 11. Proposed project layout

```
src/
  core/            # pure TS, 100% unit-testable (your "domain" package)
    pitch.ts  ranges.ts  scoring.ts  selector.ts  quiz.ts  settings.ts  types.ts
  storage/         # Dexie DB, repositories, backup/import
  inputs/          # InputMethod registry + one file per input (letters, piano, mic, hardware keys)
  audio/           # shared AudioContext, piano sampler, pitch detection (pitchy)
  lib/             # Svelte stores (settings, session), GSAP helpers
  components/      # Staff, GrandStaff, Note, LetterPad, Piano, TimerBar, Sparks
  screens/         # Home, Quiz, Results, Stats (heat-map), Settings
  pwa/             # SW registration, update prompt, persistence, audio session
  App.svelte  main.ts
tests/             # Vitest: pitch math, grading, weights, simulation, mic stability filter
e2e/               # Playwright WebKit iPhone/iPad: AC-tagged flows
public/
  fonts/bravura-subset.woff2
  audio/piano/*.m4a  # ~20 Salamander samples
  icons, apple-touch-icon
```

## 12. Delivery plan

See [docs/roadmap.md](roadmap.md) for the milestones, one doc each, and the quality gates.

## 13. Decisions (from review)

| Question | Decision |
|---|---|
| Hosting | GitHub Pages, deployed by GitHub Actions only when all gates are green |
| Sequence errors | Retry once, then reveal, then wait for Continue; applies to both modes (8.4) |
| Look and feel | Early spike (M1) shows two themes on device (§14); pick one there |
| Answer precision | Configurable per input via `exactOctave` (sections 3.4, 9) |
| Answer input | Pluggable (3.4): on-screen piano, then mic from a real piano (M3); letter pad dropped (§14) |
| Framework | Svelte 5 + SVG + GSAP ([frameworks.md](frameworks.md)); Phaser 4 evaluated and not chosen |
| Accidentals / key signatures | A later feature (F1 in the roadmap) |

## 14. Decisions from the Q&A with Stan (2026-10-31)

These replace the M2–M4 working sessions and override earlier sections where they differ.

**Difficulty** (a setting, never automatic) replaces the ledger-line range. The UI never shows ledger-line counts.

| Difficulty | Treble | Bass | Ledger notes |
|---|---|---|---|
| Easy | C4 – C5 | C3 – C4 | none beyond these |
| Medium | ≤ 1 ledger line (B3 – B5) | ≤ 1 ledger line (D2 – D4) | normal weight |
| Hard | ≤ 3 ledger lines (E3 – F6, §6.1) | ≤ 3 ledger lines (G1 – A4) | weighted up (§7.3 `ledgerBoost`) |

With `both`, each stave uses its own column.

**Ordering**: the next note is usually within a third, meaning 1, 2 or 3 steps up or down from the current note.
About 10% of the time it jumps: to the other clef (on a grand staff), an octave away, or an octave ± 1–2 steps.
Weakness weighting (§7.3) still applies within the candidates.

**Sequences** (length set by difficulty; notes are grouped into 4/4 measures with barlines; rhythm is visual only and isn't graded):

| Difficulty | Measures | Notes |
|---|---|---|
| Easy | 1 | 4 |
| Medium | 1–2 | ≤ 10 |
| Hard | 3 | 10–16 |

**Inputs**: priority is the on-screen piano, then the mic (real piano). The letter pad is dropped. Writing or saying
a letter may come later (F3). The default input is set in Settings, and the quiz screen has a switcher for changing
input mid-quiz. The octave must always match.

**Sound**: a master on/off switch. When sound is on, the correct note **always plays after the answer**, and two optional
toggles add "when the note appears" and "after a wrong try". Volume and "play with the silent switch on" sit in the same group.

**Timer**: off by default. When on, it's a **sprint**: one countdown bar for the whole session, answering as many
notes (or sequences) as you can. Length by difficulty: Easy 60 s, Medium 50 s, Hard 40 s. There's no per-note timer.
When the bar runs out, the current question ends without counting as a miss, and results show.

**Home**: mode (single / sequence), clef (treble / bass / both), Review weak notes (once M4 lands), a Settings button,
and **Start at the bottom**, which starts with the last settings. No progress glance. Everything else is in Settings.
Session length: 20 by default (10 / 20 / 50 / endless).

**Look**: two themes, *Paper & ink* and *Storybook* (Neon arcade dropped). Both are plain SVG + CSS + GSAP.
