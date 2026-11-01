// Handwriting fixtures (M9-AC7): A–G as several writers might draw them, in forms that differ from the
// recognizer's own shapes, each redrawn with seeded slant, shear, width, wobble, stroke order and direction.
import { arc, path, type Point, type Stroke } from '../../src/core/handwriting';
import type { Letter } from '../../src/core/pitch';

/** Two writers' forms per letter, in a 100-unit box. */
const FORMS: [Letter, Stroke[]][] = [
  ['A', [path([10, 100], [45, 0]), path([45, 0], [85, 100]), path([25, 55], [70, 52])]],
  ['A', [path([0, 100], [50, 5], [95, 100]), path([30, 70], [70, 70])]],
  ['B', [path([5, 0], [5, 100]), arc([5, 23], [45, 23], [-90, 90]), arc([5, 73], [58, 27], [-90, 90])]],
  [
    'B',
    [[...path([0, 100], [0, 0]), ...arc([0, 25], [50, 25], [-90, 90]), ...arc([0, 75], [50, 25], [-90, 90])]],
  ],
  ['C', [arc([50, 50], [42, 50], [-60, -300])]],
  ['C', [arc([50, 50], [50, 50], [-30, -330])]],
  ['D', [path([0, 0], [0, 100]), arc([0, 50], [60, 50], [-90, 90])]],
  ['D', [[...path([0, 100], [0, 0]), ...arc([0, 50], [80, 50], [-90, 90])]]],
  ['E', [path([0, 0], [0, 100]), path([0, 0], [60, 0]), path([0, 48], [45, 48]), path([0, 100], [65, 100])]],
  ['E', [path([70, 0], [0, 0], [0, 100], [70, 100]), path([0, 50], [50, 50])]],
  ['F', [path([0, 0], [0, 100]), path([0, 0], [60, 0]), path([0, 45], [45, 45])]],
  ['F', [path([70, 0], [0, 0], [0, 100]), path([0, 55], [50, 55])]],
  ['G', [arc([50, 50], [45, 50], [-40, -360]), path([95, 50], [55, 50])]],
  ['G', [[...arc([50, 50], [50, 50], [-50, -360]), { x: 100, y: 95 }], path([100, 60], [65, 60])]],
];

const VARIANTS = 10;

/** A small seeded generator (an LCG), so the fixtures are the same on every run. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => (state = (state * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32;
}

/** Points about every 3 units along a stroke, so wobble bends lines the way a finger does. */
function densify(stroke: Stroke): Stroke {
  return stroke.flatMap((end, i) => {
    const start = stroke[i - 1];
    if (!start) return [end];
    const steps = Math.max(1, Math.round(Math.hypot(end.x - start.x, end.y - start.y) / 3));
    return Array.from({ length: steps }, (_, s) => ({
      x: start.x + ((end.x - start.x) * (s + 1)) / steps,
      y: start.y + ((end.y - start.y) * (s + 1)) / steps,
    }));
  });
}

/** One redrawing of a form: slanted up to ±12°, sheared, narrowed or widened, wobbly, strokes shuffled and reversed. */
function redraw(strokes: Stroke[], random: () => number): Stroke[] {
  const between = (lo: number, hi: number) => lo + (hi - lo) * random();
  const angle = (between(-12, 12) * Math.PI) / 180;
  const shear = between(-0.2, 0.2);
  const width = between(0.75, 1.25);
  const move = ({ x, y }: Point): Point => {
    const sx = (x + shear * y) * width;
    return {
      x: sx * Math.cos(angle) - y * Math.sin(angle) + between(-2, 2),
      y: sx * Math.sin(angle) + y * Math.cos(angle) + between(-2, 2),
    };
  };
  const drawn = strokes.map((stroke) => {
    const points = densify(stroke).map(move);
    return random() < 0.5 ? points.reverse() : points;
  });
  return drawn.sort(() => random() - 0.5);
}

/** Every fixture: each form redrawn `VARIANTS` times. */
export const HANDWRITTEN: { letter: Letter; strokes: Stroke[] }[] = FORMS.flatMap(([letter, strokes], f) => {
  const random = seeded(f + 1);
  return Array.from({ length: VARIANTS }, () => ({ letter, strokes: redraw(strokes, random) }));
});
