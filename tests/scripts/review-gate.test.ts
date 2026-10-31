import { describe, expect, test } from 'vitest';
import {
  annotations,
  isDocsOnly,
  isFailing,
  renderSummary,
  type Finding,
} from '../../scripts/review-gate/gate.ts';

const blocking: Finding = {
  severity: 'blocking',
  file: 'src/core/quiz.ts',
  line: 42,
  rule: 'DRY',
  message: 'Same octave math as midiOf(); call it instead.',
};
const suggestion: Finding = {
  severity: 'suggestion',
  file: 'src/app.ts',
  rule: 'Readable',
  message: 'a | b',
};

describe('M0-AC11 review scope', () => {
  test('M0-AC11 a docs-only PR skips the review', () => {
    expect(isDocsOnly(['docs/STATUS.md', 'README.md', 'CLAUDE.md'])).toBe(true);
  });

  test('M0-AC11 any non-Markdown change is reviewed', () => {
    expect(isDocsOnly(['docs/STATUS.md', 'src/core/quiz.ts'])).toBe(false);
    expect(isDocsOnly(['.github/workflows/review.yml'])).toBe(false);
    expect(isDocsOnly(['.claude/agents/code-reviewer.md'])).toBe(false);
  });
});

describe('M0-AC8 review verdict', () => {
  test('M0-AC8 a blocking finding fails the gate even if the verdict says pass', () => {
    expect(isFailing({ verdict: 'fail', findings: [blocking] })).toBe(true);
    expect(isFailing({ verdict: 'pass', findings: [blocking] })).toBe(true);
  });

  test('M0-AC8 suggestions alone pass the gate', () => {
    expect(isFailing({ verdict: 'pass', findings: [suggestion] })).toBe(false);
    expect(isFailing({ verdict: 'pass', findings: [] })).toBe(false);
  });

  test('M0-AC8 findings become inline PR annotations with escaped text', () => {
    const multiline = { ...blocking, file: 'src/a,b.ts', message: '50%\nsecond line' };
    expect(annotations({ verdict: 'fail', findings: [multiline, suggestion] })).toEqual([
      '::error file=src/a%2Cb.ts,line=42,title=AI review%3A DRY::50%25%0Asecond line',
      '::warning file=src/app.ts,title=AI review%3A Readable::a | b',
    ]);
  });

  test('M0-AC8 the job summary shows the verdict and a findings table', () => {
    expect(renderSummary({ verdict: 'pass', findings: [] })).toBe('### AI review: ✅ pass\n\nNo findings.\n');
    const summary = renderSummary({ verdict: 'fail', findings: [blocking, suggestion] });
    expect(summary).toContain('### AI review: ❌ fail');
    expect(summary).toContain('| blocking | src/core/quiz.ts:42 | DRY |');
    expect(summary).toContain('| suggestion | src/app.ts | Readable | a \\| b |');
  });
});
