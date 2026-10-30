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
7. **Polished, game-like graphics**, with **Phaser 4** as the candidate framework.

Non-goals for v1: MIDI input, accidentals/key signatures, accounts or sync.
Section 13 has these as open questions.

---

## 2. Recommendation at a glance

| Concern | Choice | Why |
|---|---|---|
| Build | **Vite + TypeScript** | Fast, static output, first-class PWA plugin, official Phaser templates use it |
| Game / quiz screens | **Phaser 4** (4.2.1 on npm) | Tweens, particles, scene management, and touch input for the "pretty" part |
| Notation | **Custom staff drawn in Phaser** with the **Bravura** SMuFL font | Each note is its own game object, so it can slide, glow, and burst; VexFlow is the fallback |
| Menus, settings, stats | **Plain DOM overlay** (Preact or vanilla TS) | Forms, sliders, and scrolling lists are painful inside a canvas |
| Audio | **Phaser sound manager** (Web Audio) + pitch-shifted **piano samples** | Already in Phaser, handles the iOS audio unlock, works offline once precached |
| State | **Zustand vanilla store** | One store readable from both Phaser scenes and DOM screens |
| Offline | **vite-plugin-pwa** (Workbox `generateSW`, precache everything) | One config block gives a service worker and manifest |
| Storage | **IndexedDB via Dexie 4** + JSON export/import | Durable, queryable attempt log; backup guards against iOS storage loss |
| Tests | **Vitest** for the pure core | Selection/scoring logic is pure TS, like a Python domain layer |
| Hosting | **GitHub Pages** (or any static HTTPS host) | Service workers require HTTPS; repo already on GitHub |

If you've worked on Python projects, the shape will look familiar. `src/core/` is a pure domain
package with no DOM (think `domain/` + `services/`), `src/storage/` is the repository
layer, and Phaser plus the DOM screens are thin presentation layers on top. Phaser
never decides which note comes next; it only draws what the core hands it.

---

## 3. Framework & notation rendering

### 3.1 Phaser 4: verdict

**Use it for the quiz screens, not for the whole app.** Verified on npm:
`phaser@4.2.1` is current, ships an ESM build (`dist/phaser.esm.min.js`, about 1.4 MB
minified, roughly 350 KB gzipped), and keeps both WebGL and Canvas renderers.

| Phaser gives you | Watch out for |
|---|---|
| Tweens, particles, camera shake, scene transitions, which is the "pretty" part | No music notation, so you draw the staff yourself (3.2) |
| Pointer/touch input on game objects with no 300ms delay | Text inputs, sliders, and scrolling lists in a canvas are painful, so keep Settings/Stats in the DOM |
| Sound manager on Web Audio, including the iOS "unlock on first touch" dance | Text is rasterized, so set `resolution: devicePixelRatio` or it blurs on Retina |
| `Scale.RESIZE` / `FIT` for iPad rotation and iPhone sizes | ~350 KB gz is fine once precached, but first load is heavier than a DOM-only app |
| Same asset loader works with the service worker cache | Phaser 4 is newer than Phaser 3, so some community examples/plugins still target v3 |

Shape of the hybrid: one `<canvas>` for Phaser (Home, Quiz, Results scenes) plus a
DOM overlay `<div>` for Settings and Stats. Both read and write the same Zustand vanilla
store, and Phaser pauses its scene while an overlay is open.

```ts
// src/game/main.ts
import Phaser from 'phaser';
import { QuizScene } from './scenes/QuizScene';

export function startGame(parent: HTMLElement) {
  return new Phaser.Game({
    type: Phaser.AUTO,                 // WebGL, falls back to Canvas
    parent,
    backgroundColor: '#fdfaf3',
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
    audio: { disableWebAudio: false },
    scene: [BootScene, HomeScene, QuizScene, ResultsScene],
  });
}
```

### 3.2 Notation inside Phaser: custom staff + Bravura glyphs (recommended)

Drill notes don't need stems, beams, or rhythm, so draw **whole notes**. That
removes most of what a notation engine is for. What's left is:

- 5 staff lines and the ledger lines (Phaser `Graphics`), positioned with the pitch math in section 6.
- Clefs, brace, and noteheads as **SMuFL glyphs** from the Bravura font (SIL Open Font License),
  bundled as a `.woff2` and precached: `gClef` U+E050, `fClef` U+E062, `brace` U+E000, `noteheadWhole` U+E0A2.

Every note is then an ordinary game object you can tween, tint, or explode into particles.

```ts
// src/game/staff/StaffView.ts
import Phaser from 'phaser';
import { staffPos, ledgerLines, type Pitch, type Clef } from '../../core/pitch';

const GLYPH = { gClef: '', fClef: '', noteWhole: '' };

export class StaffView extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number,
              private clef: Clef, private width: number, private space = 18) {
    super(scene, x, y);
    const g = scene.add.graphics().lineStyle(2, 0x222222);
    for (let i = -2; i <= 2; i++) g.lineBetween(0, i * space, width, i * space); // y = 0 is the middle line
    this.add(g);
    const clefGlyph = scene.add.text(8, clef === 'treble' ? space : -space,
      clef === 'treble' ? GLYPH.gClef : GLYPH.fClef, this.font(space * 4)).setOrigin(0, 0.5);
    this.add(clefGlyph);
    scene.add.existing(this);
  }

  /** y offset of a pitch relative to the middle line: each step is half a space. */
  yOf(p: Pitch) { return -staffPos(p, this.clef) * (this.space / 2); }

  addNote(p: Pitch, x: number): Phaser.GameObjects.Container {
    const note = this.scene.add.container(x, this.yOf(p));
    const pos = staffPos(p, this.clef);
    const g = this.scene.add.graphics().lineStyle(2, 0x222222);
    for (let i = 1; i <= ledgerLines(p, this.clef); i++) {
      // ledger lines sit at staff positions ±6, ±8, ±10, drawn relative to the note
      const ledgerPos = Math.sign(pos) * (4 + 2 * i);
      const dy = -(ledgerPos - pos) * (this.space / 2);
      g.lineBetween(-this.space, dy, this.space, dy);
    }
    const head = this.scene.add.text(0, 0, GLYPH.noteWhole, this.font(this.space * 4)).setOrigin(0.5);
    note.add([g, head]);
    this.add(note);
    return note;
  }

  private font(px: number): Phaser.Types.GameObjects.Text.TextStyle {
    return { fontFamily: 'Bravura', fontSize: `${px}px`, color: '#222', resolution: window.devicePixelRatio };
  }
}
```

```ts
// In QuizScene: a new note slides in; a right answer pops, a wrong one shakes red.
const note = staff.addNote(pitch, 180).setAlpha(0).setX(260);
this.tweens.add({ targets: note, x: 180, alpha: 1, duration: 250, ease: 'Back.Out' });

onCorrect: this.tweens.add({ targets: note, scale: 1.4, alpha: 0, duration: 200 });
onWrong:   note.list.forEach(o => (o as any).setTint?.(0xdd3333));
           this.cameras.main.shake(120, 0.004);
```

Load the font before the first scene draws text, or Phaser will rasterize a fallback font:

```ts
// BootScene.preload / or before new Phaser.Game(...)
const bravura = new FontFace('Bravura', `url(${import.meta.env.BASE_URL}fonts/Bravura.woff2)`);
document.fonts.add(await bravura.load());
```

Exact glyph offsets (clef baseline, notehead width) need a little tuning in the spike.
Bravura's `bravura_metadata.json` lists the anchors if eyeballing isn't enough.

### 3.3 Fallback: VexFlow 5 rendered to a texture

If drawing the staff by hand turns out fiddly, VexFlow can produce an SVG string that
Phaser loads as a texture. Verified on npm: `vexflow@5.0.0` has a `vexflow/bravura`
entry that embeds its fonts as JS (no network fetch, offline-safe). The trade-off is that the whole
staff becomes one static image, so per-note animation means re-rendering, and you
must render at `devicePixelRatio` to stay crisp. VexFlow is also the easy choice for
any **non-Phaser** view, such as a stats heat-map on the DOM Stats screen.

```ts
import { Renderer, Stave, StaveNote, Voice, Formatter } from 'vexflow/bravura';

export function staffSvg(clef: 'treble' | 'bass', keys: string[]): string {
  const div = document.createElement('div');
  const r = new Renderer(div, Renderer.Backends.SVG);
  r.resize(320, 200);
  const ctx = r.getContext();
  const stave = new Stave(10, 50, 300).addClef(clef).setContext(ctx).draw();
  const notes = keys.map(k => new StaveNote({ clef, keys: [k], duration: 'w' }));
  const voice = new Voice({ numBeats: 4 * keys.length, beatValue: 4 }).addTickables(notes);
  new Formatter().joinVoices([voice]).format([voice], 220);
  voice.draw(ctx, stave);
  return div.innerHTML;
}
// Phaser: this.textures.addBase64('staff', 'data:image/svg+xml;base64,' + btoa(staffSvg(...)));
```

**abcjs** was also considered. It renders ABC text strings to SVG and has playback, but it fits
the same "static image" bucket as VexFlow with less control, so it isn't recommended here.

---

## 4. Audio: playing the notes

### 4.1 Approach

Use Phaser's sound manager (Web Audio under the hood) with **real piano samples**
at every third semitone, pitch-shifted to the in-between notes using the sound's
`detune` (in cents). Shifting ±1 semitone is inaudible as an artifact.

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
// src/game/audio/piano.ts
const SAMPLE_MIDIS = Array.from({ length: 21 }, (_, i) => 30 + i * 3); // 30, 33, ... 90

export function preloadPiano(scene: Phaser.Scene) {
  for (const m of SAMPLE_MIDIS) scene.load.audio(`p${m}`, [`audio/piano/${m}.m4a`, `audio/piano/${m}.mp3`]);
}

export function playPitch(scene: Phaser.Scene, p: Pitch, volume = 0.8) {
  const target = midi(p);
  const nearest = SAMPLE_MIDIS.reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a));
  scene.sound.play(`p${nearest}`, { detune: (target - nearest) * 100, volume });
}
```

### 4.2 iOS audio gotchas

| Gotcha | Mitigation |
|---|---|
| Audio stays locked until a user gesture | Phaser unlocks on the first touch automatically; the Home screen's "Start" tap covers it |
| On iPhone, the **ring/silent switch mutes Web Audio** by default | Set `navigator.audioSession.type = 'playback'` (Safari 16.4+) when sound is enabled; feature-detect it. Confirm on device in the spike |
| AudioContext gets suspended when the app is backgrounded | Phaser resumes on focus; also resume on `visibilitychange` to be safe |

```ts
// src/pwa/audioSession.ts
export function preferPlaybackSession() {
  const s = (navigator as any).audioSession;
  if (s && 'type' in s) s.type = 'playback'; // play even with the silent switch on
}
```

### 4.3 When to play (setting)

| Option | Behavior | Why you'd pick it |
|---|---|---|
| `off` | Silent | Practicing in public |
| `afterAnswer` (default) | Play the correct note after you answer | Connects the written note to its sound without giving the answer away |
| `onShow` | Play when the note appears | Easier mode; you learn to link sound and position |
| `onWrong` | Play only after a miss | Reinforces mistakes without slowing a fast streak |

In sequence mode, `afterAnswer` plays each note as it's tapped, so a correct run
sounds like the melody, which is a nice reward.

---

## 5. Offline & install on iOS

There's no general way to "download an HTML file and run it" on iOS. The
supported path is a **PWA**: open the site in Safari, then Share, then **Add to Home Screen**.
It launches full-screen, runs offline from the service worker cache, and has its own storage.

### 5.1 Build config

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/music-game/', // GitHub Pages project path
  plugins: [
    VitePWA({
      registerType: 'prompt', // show "Update available" instead of silently swapping mid-quiz
      includeAssets: ['apple-touch-icon.png'],
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2,m4a,mp3}'], // precache everything, incl. font + piano samples
                 maximumFileSizeToCacheInBytes: 3 * 1024 * 1024 }, // headroom: Phaser alone is ~1.4 MB minified, close to the 2 MB default
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
  answered: Letter | null;   // null = timed out
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
- Wrong answer: flash red, show the correct letter (and optionally the note name
  with octave, e.g. "C6"), then continue. Wrong answers are recorded.

### 8.2 Multi-note sequence

- N notes (setting, default 6) on one stave. The current target note is highlighted blue.
- Each tap answers the current note: green if right, red if wrong, then the cursor advances.
  Stats are recorded **per note**, so sequences feed the same table.
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
  | { phase: 'feedback'; items: Candidate[]; cursor: number; last: Attempt }
  | { phase: 'done'; summary: SessionSummary };

type QuizEvent =
  | { type: 'START'; items: Candidate[]; now: number }
  | { type: 'ANSWER'; letter: Letter; now: number }
  | { type: 'TICK'; now: number }           // detects timeout
  | { type: 'NEXT'; now: number };

export function reduce(s: QuizState, e: QuizEvent, settings: Settings): QuizState { /* ... */ }
```

---

## 9. Settings

```ts
// src/core/settings.ts
export interface Settings {
  clef: 'treble' | 'bass' | 'both';
  range: RangeLevel;               // how far beyond the staff, default 'ledger3'
  mode: 'single' | 'sequence';
  sequenceLength: number;          // 4–8
  questionsPerSession: number;     // e.g. 20, or 0 = endless
  timer:
    | { kind: 'off' }
    | { kind: 'perNote'; seconds: number }     // countdown per question; timeout = miss
    | { kind: 'session'; seconds: number };    // sprint: as many as you can in N seconds
  showOctaveOnFeedback: boolean;   // "C6" vs "C"
  ledgerBoost: number;             // exposes WeightConfig.ledgerBoost as a slider
  sound: {
    when: 'off' | 'afterAnswer' | 'onShow' | 'onWrong';   // see 4.3
    volume: number;                                        // 0..1
    ignoreSilentSwitch: boolean;                           // sets navigator.audioSession.type
  };
}

export const DEFAULT_SETTINGS: Settings = {
  clef: 'treble', range: 'ledger3', mode: 'single', sequenceLength: 6,
  questionsPerSession: 20, timer: { kind: 'off' }, showOctaveOnFeedback: true, ledgerBoost: 0.6,
  sound: { when: 'afterAnswer', volume: 0.8, ignoreSilentSwitch: true },
};
```

Settings are small and read synchronously at startup, so they live in
**localStorage** through Zustand's `persist` middleware. Stats and attempts live in IndexedDB.

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
  state/           # Zustand vanilla store shared by Phaser and the DOM overlay
  game/            # Phaser 4
    main.ts
    scenes/        # BootScene, HomeScene, QuizScene, ResultsScene
    staff/         # StaffView, GrandStaffView (Bravura glyphs + Graphics)
    ui/            # LetterPad, TimerBar, particles/feedback
    audio/         # piano sampler (playPitch)
  overlay/         # DOM screens: Settings, Stats (heat-map), InstallHint
  pwa/             # SW registration, update prompt, persistence, audio session
  main.ts
tests/             # Vitest: pitch math, weights, simulation, reducer
public/
  fonts/Bravura.woff2
  audio/piano/*.m4a  # ~20 Salamander samples
  icons, apple-touch-icon
```

## 12. Delivery plan

1. **Spike**: Vite + Phaser 4 draws a treble/bass/grand staff note with Bravura and
   plays a piano sample, on an iPad and iPhone installed to the home screen, in airplane
   mode, with the silent switch on. This retires the biggest risks (glyph layout, offline, iOS audio) first.
2. **Single-note MVP**: core pitch/range, letter pad, uniform random selection, settings overlay, sound setting.
3. **Stats + weighting**: Dexie, `applyAttempt`, `pickNext`, review mode, and the simulation test.
4. **Sequence mode**: multi-note staff with active/right/wrong states and `makeSequence`.
5. **Juice**: tweens, particles, streak effects, scene transitions.
6. **Timer modes, stats heat-map, backup/export, update prompt, GitHub Pages deploy action.**

## 13. Open questions

1. **Accidentals / key signatures**: add later as a setting? (The model extends with
   a chromatic offset; the answer pad would grow sharps/flats.)
2. **Answer precision**: letter only (as requested), or optionally require the octave
   for ledger notes (e.g. a piano-keyboard answer pad)?
3. **Look and feel**: any visual direction for the "pretty graphics" (cozy/paper,
   neon arcade, cartoon)? The Phaser layer is where that lives, so it doesn't affect the core.
4. **Sequence errors**: advance on a wrong tap (proposed), or require the correct
   letter before moving on?
5. **Hosting**: OK to publish on GitHub Pages (public URL), or prefer another host?
