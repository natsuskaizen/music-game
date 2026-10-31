import { spawnSync } from 'node:child_process';
import { describe, expect, test } from 'vitest';
import {
  annotations,
  parseVerdict,
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

  test('M0-AC11 the CLI prints the scope for $GITHUB_OUTPUT from changed paths on stdin', () => {
    const scope = (input: string) =>
      spawnSync('node', ['scripts/review-gate/main.ts', 'scope'], { input, encoding: 'utf8' }).stdout;
    expect(scope('docs/STATUS.md\nREADME.md\n')).toBe('review=false\n');
    expect(scope('docs/STATUS.md\nsrc/main.ts\n')).toBe('review=true\n');
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

  test('M0-AC8 a missing or malformed reviewer output fails with a clear message', () => {
    expect(() => parseVerdict(undefined)).toThrow('no structured output');
    expect(() => parseVerdict('{"verdict":"maybe","findings":[]}')).toThrow('not a verdict');
    expect(() => parseVerdict('{"verdict":"pass"}')).toThrow('not a verdict');
    expect(parseVerdict('{"verdict":"pass","findings":[]}')).toEqual({ verdict: 'pass', findings: [] });
  });

  test('M0-AC8 the CLI exits 1 on a fail verdict and 0 on a pass', () => {
    const run = (json: string) =>
      spawnSync('node', ['scripts/review-gate/main.ts', 'verdict'], {
        env: { ...process.env, REVIEW_JSON: json, GITHUB_STEP_SUMMARY: '' },
        encoding: 'utf8',
      });
    const failed = run(JSON.stringify({ verdict: 'fail', findings: [blocking] }));
    expect(failed.status).toBe(1);
    expect(failed.stdout).toContain('::error file=src/core/quiz.ts,line=42');
    expect(run(JSON.stringify({ verdict: 'pass', findings: [] })).status).toBe(0);
  });
});
