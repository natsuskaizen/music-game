// GSAP right/wrong feedback, one style per theme (M1 spike). Paper & ink stays subtle; Storybook bounces and sparkles;
// Neon arcade flickers on, glitches on a miss, and bursts on a hit.
import { gsap } from 'gsap';
import type { Theme } from '../core/theme';

/** The animations a quiz plays on the staff's note group. `right` resolves when the quiz may move on. */
export interface Feedback {
  enter(note: SVGGElement): void;
  wrong(note: SVGGElement): void;
  right(note: SVGGElement): Promise<void>;
  /** A pulse on the streak count when it reaches a celebrated length (`core/streak.ts`). */
  celebrate(count: HTMLElement): void;
}

const ORIGIN = { transformOrigin: '50% 50%' };

// A clef change can start the next note while the last right-answer tween is still queued; stop it first.
function restart(note: SVGGElement) {
  gsap.killTweensOf(note);
  return note;
}

const paper: Feedback = {
  enter(note) {
    gsap.fromTo(
      restart(note),
      { opacity: 0, x: 12, scale: 1 },
      { opacity: 1, x: 0, duration: 0.3, ...ORIGIN },
    );
  },
  wrong(note) {
    gsap.fromTo(note, { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.5)' });
  },
  async right(note) {
    await gsap.to(note, { opacity: 0, duration: 0.35, delay: 0.35 });
  },
  celebrate(count) {
    gsap.fromTo(count, { scale: 1.4 }, { scale: 1, duration: 0.5, ease: 'power2.out' });
  },
};

const storybook: Feedback = {
  enter(note) {
    gsap.fromTo(
      restart(note),
      { opacity: 0, y: -40, scale: 1 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'bounce.out', ...ORIGIN },
    );
  },
  wrong(note) {
    gsap.fromTo(
      note,
      { rotation: -14 },
      { rotation: 0, duration: 0.6, ease: 'elastic.out(1.2, 0.25)', ...ORIGIN },
    );
  },
  async right(note) {
    sparkle(note);
    await gsap
      .timeline()
      .to(note, { scale: 1.4, duration: 0.2, ease: 'back.out(3)', ...ORIGIN })
      .to(note, { scale: 0, opacity: 0, duration: 0.3, delay: 0.25, ease: 'back.in(2)', ...ORIGIN });
  },
  celebrate(count) {
    gsap.fromTo(
      count,
      { scale: 2, rotation: -15 },
      { scale: 1, rotation: 0, duration: 0.8, ease: 'elastic.out(1.2, 0.35)' },
    );
  },
};

const arcade: Feedback = {
  enter(note) {
    gsap.fromTo(
      note,
      { opacity: 0, x: 0, scale: 1.8 },
      {
        keyframes: { opacity: [0, 1, 0.2, 1, 0.5, 1] },
        scale: 1,
        duration: 0.4,
        ease: 'power3.out',
        ...ORIGIN,
      },
    );
  },
  wrong(note) {
    gsap.fromTo(note, { x: 0 }, { keyframes: { x: [-9, 7, -5, 3, 0] }, duration: 0.3, ease: 'none' });
  },
  async right(note) {
    sparkle(note);
    await gsap
      .timeline()
      .to(note, { scale: 1.3, duration: 0.12, ease: 'steps(3)', ...ORIGIN })
      .to(note, { keyframes: { opacity: [1, 0, 1, 0] }, scale: 2, duration: 0.35, delay: 0.25, ...ORIGIN });
  },
  celebrate(count) {
    gsap.fromTo(
      count,
      { scale: 2.2 },
      { keyframes: { opacity: [0, 1, 0.3, 1] }, scale: 1, duration: 0.5, ease: 'steps(4)' },
    );
  },
};

const SPARKS = 14;

// A ring of dots flying out from the note; they remove themselves when done.
function sparkle(note: SVGGElement) {
  const svg = note.ownerSVGElement;
  if (!svg) return;
  const box = note.getBBox();
  const [cx, cy] = [box.x + box.width / 2, box.y + box.height / 2];
  for (let i = 0; i < SPARKS; i++) {
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('class', i % 2 ? 'spark' : 'spark alt');
    Object.entries({ cx, cy, r: 3 + (i % 3) }).forEach(([k, v]) => {
      dot.setAttribute(k, String(v));
    });
    svg.appendChild(dot);
    const angle = (i / SPARKS) * 2 * Math.PI;
    gsap.to(dot, {
      attr: { cx: cx + Math.cos(angle) * 70, cy: cy + Math.sin(angle) * 70 },
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      onComplete: () => {
        dot.remove();
      },
    });
  }
}

/** The feedback style for a theme. */
export const FEEDBACK: Record<Theme, Feedback> = { paper, storybook, arcade };
