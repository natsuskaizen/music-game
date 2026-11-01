// Handwritten letters (design §3.4, M9-6): reads finger strokes as one of A–G with the $P point-cloud recognizer
// (Vatavu, Anthony & Wobbrock 2012). It ignores stroke order, direction and count, which vary most between writers.
import type { Letter } from './pitch';

/** A point on the writing pad, in screen pixels. */
export interface Point {
  x: number;
  y: number;
}

/** One finger stroke, from touch down to lift. */
export type Stroke = Point[];

/** Points every drawing is resampled to; $P's paper finds 32 enough for letters. */
const CLOUD_SIZE = 32;

/** Ink smaller than this many pixels each way is a slip of the finger, not a letter. */
const MIN_SIZE = 20;

/** A pair of numbers: a point, an ellipse's radii, or an arc's start and end angles. */
type Pair = [number, number];

/** A stroke through the given points; letter shapes (and test fixtures) are built from these and arcs. */
export function path(...points: Pair[]): Stroke {
  return points.map(([x, y]) => ({ x, y }));
}

/** An elliptical arc between two angles in degrees (0 is right, 90 is down, as on screen). */
export function arc([cx, cy]: Pair, [rx, ry]: Pair, [from, to]: Pair): Stroke {
  const steps = 16;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const angle = ((from + ((to - from) * i) / steps) * Math.PI) / 180;
    return { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) };
  });
}

/** Capital letters as people write them, in a 100-unit box; a letter with two common forms has both. */
const SHAPES: [Letter, Stroke[]][] = [
  ['A', [path([0, 100], [50, 0]), path([50, 0], [100, 100]), path([25, 60], [75, 60])]],
  ['B', [path([0, 0], [0, 100]), arc([0, 25], [55, 25], [-90, 90]), arc([0, 75], [65, 25], [-90, 90])]],
  ['C', [arc([50, 50], [50, 50], [-45, -315])]],
  ['C', [arc([50, 50], [35, 50], [-50, -310])]],
  ['C', [arc([50, 50], [50, 50], [-30, -330])]],
  ['D', [path([0, 0], [0, 100]), arc([0, 50], [70, 50], [-90, 90])]],
  ['E', [path([0, 0], [0, 100]), path([0, 0], [70, 0]), path([0, 50], [55, 50]), path([0, 100], [70, 100])]],
  ['F', [path([0, 0], [0, 100]), path([0, 0], [70, 0]), path([0, 50], [55, 50])]],
  ['G', [arc([50, 50], [50, 50], [-45, -360]), path([100, 50], [60, 50])]],
  ['G', [arc([50, 50], [50, 50], [-45, -360]), path([100, 50], [100, 100]), path([100, 55], [60, 55])]],
  ['G', [arc([50, 50], [50, 50], [-40, -350]), path([95, 50], [75, 50])]],
  ['G', [arc([50, 50], [50, 50], [-45, -330]), path([95, 62], [60, 62])]],
  ['G', [arc([50, 50], [50, 50], [-45, -330]), path([100, 50], [100, 80]), path([100, 50], [70, 50])]],
];

const TEMPLATES = SHAPES.map(([letter, strokes]) => ({ letter, cloud: normalize(strokes) }));

/** The letter the strokes look most like, at any size or place, or `undefined` for an empty pad, a tap or a slip. */
export function recognizeLetter(strokes: Stroke[]): Letter | undefined {
  if (!isBigEnough(strokes)) return undefined;
  const cloud = normalize(strokes);
  let best: { letter: Letter; distance: number } | undefined;
  for (const { letter, cloud: template } of TEMPLATES) {
    const distance = cloudDistance(cloud, template);
    if (!best || distance < best.distance) best = { letter, distance };
  }
  return best?.letter;
}

function isBigEnough(strokes: Stroke[]): boolean {
  const { width, height } = bounds(strokes.flat());
  return Math.max(width, height) >= MIN_SIZE;
}

function bounds(points: Point[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { minX, minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
}

/** $P's normal form: evenly spaced points, scaled to a unit box (keeping proportions) and centred on the origin. */
function normalize(strokes: Stroke[]): Point[] {
  const points = resample(strokes);
  const { minX, minY, width, height } = bounds(points);
  const size = Math.max(width, height);
  const scaled = points.map((p) => ({ x: (p.x - minX) / size, y: (p.y - minY) / size }));
  const cx = scaled.reduce((sum, p) => sum + p.x, 0) / scaled.length;
  const cy = scaled.reduce((sum, p) => sum + p.y, 0) / scaled.length;
  return scaled.map((p) => ({ x: p.x - cx, y: p.y - cy }));
}

/** `CLOUD_SIZE` points spread evenly along the ink, never across the gap between two strokes. */
function resample(strokes: Stroke[]): Point[] {
  const segments = strokes.flatMap((stroke) =>
    stroke.flatMap((end, i) => {
      const start = stroke[i - 1];
      return start ? [[start, end] as const] : [];
    }),
  );
  const length = segments.reduce((sum, [a, b]) => sum + distance(a, b), 0);
  const spacing = length / (CLOUD_SIZE - 1);
  const points: Point[] = [];
  let carried = spacing; // ink since the last point; starting at `spacing` puts a point at the very start
  for (const [a, b] of segments) {
    const span = distance(a, b);
    for (let at = spacing - carried; at <= span; at += spacing) points.push(lerp(a, b, at / span));
    carried = (carried + span) % spacing;
  }
  while (points.length < CLOUD_SIZE) points.push(segments.at(-1)?.[1] ?? { x: 0, y: 0 });
  return points.slice(0, CLOUD_SIZE);
}

function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** $P's greedy match, tried from several start points and both ways round; lower is more alike. */
function cloudDistance(a: Point[], b: Point[]): number {
  const step = Math.floor(Math.sqrt(CLOUD_SIZE));
  let min = Infinity;
  for (let start = 0; start < CLOUD_SIZE; start += step) {
    min = Math.min(min, greedyMatch(a, b, start), greedyMatch(b, a, start));
  }
  return min;
}

/** Pairs each point of `a` (from `start` on) with its nearest unmatched point of `b`; early pairs weigh more. */
function greedyMatch(a: Point[], b: Point[], start: number): number {
  const matched = new Array<boolean>(CLOUD_SIZE).fill(false);
  let sum = 0;
  [...a.slice(start), ...a.slice(0, start)].forEach((point, k) => {
    let nearest = -1;
    let nearestDistance = Infinity;
    b.forEach((candidate, j) => {
      const d = distance(point, candidate);
      if (!matched[j] && d < nearestDistance) [nearest, nearestDistance] = [j, d];
    });
    matched[nearest] = true;
    sum += (1 - k / CLOUD_SIZE) * nearestDistance;
  });
  return sum;
}
