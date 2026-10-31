import Phaser from 'phaser';
import { get } from 'svelte/store';
import { LETTERS, staffPos, ledgerPositions, label, start, answer, next, type Letter, type QuizState } from '../shared/quiz';
import { settings } from '../shared/settings';
import { playNote } from '../shared/sound';
import { S, LEFT, RIGHT, NOTE_X, GLYPH, INK, PAPER, ACCENT, RIGHT_C, WRONG_C, yOf, clefY } from '../shared/staff';

export const W = 640, H = 440;
const DPR = Math.min(window.devicePixelRatio || 1, 3);
const OY = 34; // staff sits below the status line
const PAD_Y = 316, KEY_W = 74, KEY_H = 54, KEY_GAP = 6;
const hex = (c: string) => parseInt(c.slice(1), 16);
const UI_FONT = '"Atkinson Hyperlegible", system-ui, sans-serif';

export class QuizScene extends Phaser.Scene {
  private s!: QuizState;
  private note!: Phaser.GameObjects.Container;
  private clef!: Phaser.GameObjects.Image;
  private keys: { g: Phaser.GameObjects.Graphics; t: Phaser.GameObjects.Text; l: Letter }[] = [];
  private status!: Phaser.GameObjects.Text;
  private msg!: Phaser.GameObjects.Text;
  private go!: Phaser.GameObjects.Container;
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private busy = false;

  constructor() { super('quiz'); }

  create() {
    const cam = this.cameras.main;
    cam.setZoom(DPR).centerOn(W / 2, H / 2).setBackgroundColor(PAPER);

    // Glyph textures rendered at device resolution so they stay sharp.
    this.glyph('gClef', GLYPH.gClef, 'left');
    this.glyph('fClef', GLYPH.fClef, 'left');
    for (const [k, c] of [['head', INK], ['headWrong', WRONG_C], ['headRight', RIGHT_C]] as const) this.glyph(k, GLYPH.noteWhole, 'center', c);
    const dot = this.add.graphics().fillStyle(0xffffff).fillCircle(6, 6, 6);
    dot.generateTexture('dot', 12, 12); dot.destroy();

    const lines = this.add.graphics().lineStyle(1.3, hex(INK));
    for (const p of [-4, -2, 0, 2, 4]) lines.lineBetween(LEFT, OY + yOf(p), RIGHT, OY + yOf(p));
    lines.lineBetween(LEFT, OY + yOf(4), LEFT, OY + yOf(-4));
    this.clef = this.add.image(LEFT + 12, 0, 'gClef').setOrigin(0, 0.5).setScale(1 / DPR);

    this.status = this.text(LEFT, 14, '', 14, '#5b6475').setOrigin(0, 0.5);
    this.msg = this.text(RIGHT, 14, '', 15, INK, '700').setOrigin(1, 0.5);

    this.sparks = this.add.particles(0, 0, 'dot', {
      speed: { min: 90, max: 240 }, lifespan: 650, scale: { start: 0.7, end: 0 },
      tint: [hex(RIGHT_C), hex(ACCENT), 0xf2b134], emitting: false,
    });

    const x0 = (W - (KEY_W * 7 + KEY_GAP * 6)) / 2;
    LETTERS.forEach((l, i) => {
      const x = x0 + i * (KEY_W + KEY_GAP);
      const g = this.add.graphics();
      const t = this.text(x + KEY_W / 2, PAD_Y + KEY_H / 2, l, 22, INK, '700').setOrigin(0.5);
      const zone = this.add.zone(x, PAD_Y, KEY_W, KEY_H).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => { this.tweens.add({ targets: [t], y: t.y + 2, duration: 60, yoyo: true }); this.tap(l); });
      g.setData('x', x);
      this.keys.push({ g, t, l });
    });

    this.go = this.add.container(W / 2, 404);
    const goBg = this.add.graphics().fillStyle(hex(ACCENT)).fillRoundedRect(-80, -22, 160, 44, 22);
    const goT = this.text(0, 0, 'Continue', 17, '#ffffff', '700').setOrigin(0.5);
    const goZone = this.add.zone(0, 0, 160, 44).setInteractive({ useHandCursor: true });
    goZone.on('pointerdown', () => this.newNote());
    this.go.add([goBg, goT, goZone]).setVisible(false);

    this.s = start(get(settings).clef);
    let lastClef = get(settings).clef;
    const unsub = settings.subscribe(v => { if (v.clef !== lastClef) { lastClef = v.clef; this.newNote(); } });
    this.events.once('shutdown', unsub);
    this.drawNote(true);
  }

  private tap(l: Letter) {
    if (this.busy) return;
    const before = this.s.phase;
    this.s = answer(this.s, l);
    if (this.s.phase === before) return;
    if (this.s.phase === 'right') {
      this.busy = true;
      playNote(this.s.note);
      this.drawNote(false);
      this.sparks.explode(26, NOTE_X, OY + yOf(staffPos(this.s.note)));
      this.cameras.main.flash(120, 230, 245, 235);
      this.tweens.add({ targets: this.note, scale: 1.35, alpha: 0, duration: 350, delay: 250,
        onComplete: () => { this.busy = false; this.newNote(); } });
    } else {
      this.drawNote(false);
      this.cameras.main.shake(140, 0.006);
      if (this.s.phase === 'reveal') playNote(this.s.note);
    }
  }

  private newNote() { this.s = next(this.s, get(settings).clef); this.drawNote(true); }

  private drawNote(enter: boolean) {
    const { note, phase } = this.s;
    const pos = staffPos(note);
    this.clef.setTexture(note.clef === 'treble' ? 'gClef' : 'fClef').setY(OY + clefY(note.clef));

    this.note?.destroy();
    const y = OY + yOf(pos);
    this.note = this.add.container(NOTE_X, y);
    const ledgers = this.add.graphics().lineStyle(1.3, hex(INK));
    for (const p of ledgerPositions(pos)) {
      const dy = yOf(p) - yOf(pos);
      ledgers.lineBetween(-S * 1.35, dy, S * 1.35, dy);
    }
    const head = phase === 'right' ? 'headRight' : phase === 'ask' ? 'head' : 'headWrong';
    this.note.add([ledgers, this.add.image(0, 0, head).setScale(1 / DPR)]);
    if (phase === 'reveal') this.note.add(this.text(S * 2.2, 0, label(note), 20, WRONG_C, '700').setOrigin(0, 0.5));
    if (enter) {
      this.note.setAlpha(0).setX(NOTE_X + 48);
      this.tweens.add({ targets: this.note, x: NOTE_X, alpha: 1, duration: 400, ease: 'Back.Out' });
    } else if (phase !== 'right') {
      this.note.setX(NOTE_X - 10);
      this.tweens.add({ targets: this.note, x: NOTE_X, duration: 500, ease: 'Elastic.Out' });
    }

    const acc = this.s.total ? Math.round((100 * this.s.firstTry) / this.s.total) : 0;
    this.status.setText(`Streak ${this.s.streak}    First-try ${acc}%`);
    const msg = { ask: 'Name this note', retry: 'Not quite. One more try.', reveal: `It's ${label(note)}.`, right: `Yes, ${label(note)}!` }[phase];
    this.msg.setText(msg).setColor(phase === 'right' ? RIGHT_C : phase === 'ask' ? INK : WRONG_C);

    for (const k of this.keys) {
      const wrong = this.s.wrong.includes(k.l);
      const ans = (phase === 'reveal' || phase === 'right') && k.l === note.letter;
      const fill = wrong ? WRONG_C : ans ? RIGHT_C : '#f3f5f7';
      k.g.clear().fillStyle(hex(fill)).fillRoundedRect(k.g.getData('x'), PAD_Y, KEY_W, KEY_H, 10)
        .lineStyle(1.5, hex(wrong ? WRONG_C : ans ? RIGHT_C : '#c9ced6')).strokeRoundedRect(k.g.getData('x'), PAD_Y, KEY_W, KEY_H, 10);
      k.t.setColor(wrong || ans ? '#ffffff' : INK);
    }
    this.go.setVisible(phase === 'reveal');
  }

  private text(x: number, y: number, s: string, size: number, color: string, weight = '400') {
    return this.add.text(x, y, s, { fontFamily: UI_FONT, fontSize: `${size}px`, fontStyle: weight === '700' ? 'bold' : 'normal', color, resolution: DPR });
  }

  /** Draw a SMuFL glyph to a canvas texture with its baseline at the image's origin. */
  private glyph(key: string, ch: string, align: 'left' | 'center', color = INK) {
    const px = 4 * S * DPR, w = Math.ceil(px * 1.1), h = Math.ceil(px * 2);
    const tex = this.textures.createCanvas(key, w, h)!;
    const ctx = tex.getContext();
    ctx.font = `${px}px Bravura`; ctx.fillStyle = color; ctx.textBaseline = 'alphabetic'; ctx.textAlign = align;
    ctx.fillText(ch, align === 'left' ? 0 : w / 2, h / 2);
    tex.refresh(); // baseline sits at h/2, so origin y = 0.5 puts it on the staff line
  }
}

export function startPhaser(parent: HTMLElement) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: W * DPR,
    height: H * DPR,
    backgroundColor: PAPER,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
    scene: [QuizScene],
    banner: false,
  });
}
