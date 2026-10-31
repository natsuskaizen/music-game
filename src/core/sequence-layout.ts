// Multi-note geometry (M5-3, design §3.1, §14): where each notehead, stem, beam and barline of a sequence sits. Pure, so Staff only draws.
import { staffPos } from './pitch';
import type { Measure } from './sequence';
import { SPACE, yOf, type Stave } from './staff-layout';

/** A straight line to draw. */
interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** One placed note: the centre of its notehead, the stave it sits on, its stem, and a flag when it is not beamed. */
interface PlacedNote {
  x: number;
  y: number;
  pos: number;
  stave: Stave;
  stem: Segment;
  flag?: Segment;
}

/** Everything a sequence draws besides the staves: notes in play order, beams over pairs of eighths, and x of each measure's closing barline. */
export interface SequenceLayout {
  notes: PlacedNote[];
  beams: Segment[];
  barlines: number[];
}

/** The horizontal room a sequence is fitted into. */
export interface Span {
  from: number;
  to: number;
}

/** Narrowest slot per duration: wide enough that neighbouring noteheads and their ledger lines never touch. */
const MIN_SLOT = { quarter: 30, eighth: 24 };
const MEASURE_PAD = 7;
const STEM_LENGTH = 3.5 * SPACE;
const HEAD_HALF = 0.59 * SPACE;
const MAX_BEAM_SLOPE = SPACE;
const FLAG = { dx: 0.9 * SPACE, dy: 1.4 * SPACE };

interface Head {
  x: number;
  y: number;
  pos: number;
  stave: Stave;
  eighth: boolean;
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

/** Noteheads left to right, each in a slot sized by its duration; slots are stretched so the measures fill the span. */
function placeHeads(measures: Measure[], staves: Stave[], { from, to }: Span) {
  const minWidth = (measure: Measure) => sum(measure.map((n) => MIN_SLOT[n.duration]));
  const stretch = (to - from - 2 * MEASURE_PAD * measures.length) / sum(measures.map(minWidth));
  let cursor = from;
  const barlines: number[] = [];
  const placed = measures.map((measure) => {
    cursor += MEASURE_PAD;
    const heads = measure.map(({ note, duration }): Head => {
      const slot = MIN_SLOT[duration] * stretch;
      cursor += slot;
      const stave = staves.find((s) => s.clef === note.clef) ?? staves[0];
      if (!stave) throw new Error('layoutSequence needs a stave');
      const pos = staffPos(note);
      return { x: cursor - slot / 2, y: yOf(stave, pos), pos, stave, eighth: duration === 'eighth' };
    });
    cursor += MEASURE_PAD;
    barlines.push(cursor);
    return heads;
  });
  return { placed, barlines };
}

const stemX = (head: Head, up: boolean) => head.x + (up ? HEAD_HALF : -HEAD_HALF);

/** A stem from the notehead out to `tipY`. */
const stem = (head: Head, up: boolean, tipY: number): Segment => {
  const x = stemX(head, up);
  return { x1: x, y1: head.y, x2: x, y2: tipY };
};

/** Stems point up below the middle line and down from it. */
const stemsUp = (pos: number) => pos < 0;

/** Stem tips of a beamed pair: the farther tip is kept and the nearer one is lengthened so the beam slopes by at most a space. */
function beamTips([a, b]: [Head, Head], up: boolean): [number, number] {
  const tips = [a, b].map((head) => head.y + (up ? -STEM_LENGTH : STEM_LENGTH));
  const farthest = up ? Math.min(...tips) : Math.max(...tips);
  const [tipA = farthest, tipB = farthest] = tips.map((tip) =>
    up ? Math.min(tip, farthest + MAX_BEAM_SLOPE) : Math.max(tip, farthest - MAX_BEAM_SLOPE),
  );
  return [tipA, tipB];
}

/** Notes of one measure with stems; a pair of eighths on one stave is beamed, any other eighth gets a flag. */
function engrave(heads: Head[]): { notes: PlacedNote[]; beams: Segment[] } {
  const notes: PlacedNote[] = [];
  const beams: Segment[] = [];
  const place = (head: Head, { up, tipY }: { up: boolean; tipY: number }, flagged = false) => {
    const flagY = tipY + (up ? FLAG.dy : -FLAG.dy);
    const flag = flagged && { x1: stemX(head, up), y1: tipY, x2: stemX(head, up) + FLAG.dx, y2: flagY };
    notes.push({ ...head, stem: stem(head, up, tipY), ...(flag && { flag }) });
  };
  const alone = (head: Head) => {
    const up = stemsUp(head.pos);
    place(head, { up, tipY: head.y + (up ? -STEM_LENGTH : STEM_LENGTH) }, head.eighth);
  };
  for (let i = 0; i < heads.length; i++) {
    const head = heads[i];
    if (!head) continue;
    const partner = head.eighth ? heads[i + 1] : undefined;
    if (!partner) {
      alone(head);
    } else if (partner.stave !== head.stave) {
      alone(head);
      alone(partner);
      i++;
    } else {
      const up = stemsUp((head.pos + partner.pos) / 2);
      const [tipA, tipB] = beamTips([head, partner], up);
      place(head, { up, tipY: tipA });
      place(partner, { up, tipY: tipB });
      beams.push({ x1: stemX(head, up), y1: tipA, x2: stemX(partner, up), y2: tipB });
      i++;
    }
  }
  return { notes, beams };
}

/**
 * Lays a sequence out on `staves` (the stave with a note's clef takes it) inside `span`: slots follow durations,
 * pairs of eighths are beamed, and each measure ends in a barline.
 */
export function layoutSequence(measures: Measure[], staves: Stave[], span: Span): SequenceLayout {
  const { placed, barlines } = placeHeads(measures, staves, span);
  const engraved = placed.map(engrave);
  return {
    notes: engraved.flatMap((measure) => measure.notes),
    beams: engraved.flatMap((measure) => measure.beams),
    barlines,
  };
}
