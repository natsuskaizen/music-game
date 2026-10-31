import { describe, expect, test } from 'vitest';
import {
  activeMilestoneDoc,
  parseCriteria,
  playwrightOutcomes,
  renderTable,
  statusOf,
  vitestOutcomes,
} from '../../scripts/ac-report/report.ts';

const criterion = { id: 'M0-AC1', text: 'It works', checked: false };

describe('M0-AC2 AC status report', () => {
  test('M0-AC2 finds the milestone marked In progress in the roadmap', () => {
    const roadmap = [
      '| M0 | [Foundation](milestones/M0-foundation.md) | Gates | Done |',
      '| M1 | [Look](milestones/M1-look.md) | Themes | In progress |',
    ].join('\n');
    expect(activeMilestoneDoc(roadmap)).toBe('milestones/M1-look.md');
    expect(activeMilestoneDoc('| M0 | [F](milestones/M0.md) | x | Done |')).toBeUndefined();
  });

  test('M0-AC2 reads plain and checked AC lines, ignoring other text', () => {
    const doc =
      '## ACs\n- M0-AC1 Builds.\n- [x] M1-AC2 Installs (iPad, 2026-11-02)\n- [ ] F2-AC10 Hears\nM0-AC3 prose';
    expect(parseCriteria(doc)).toEqual([
      { id: 'M0-AC1', text: 'Builds.', checked: false },
      { id: 'M1-AC2', text: 'Installs (iPad, 2026-11-02)', checked: true },
      { id: 'F2-AC10', text: 'Hears', checked: false },
    ]);
  });

  test('M0-AC2 flattens Vitest results and drops skipped tests', () => {
    const report = {
      testResults: [
        {
          assertionResults: [
            { title: 'a', status: 'passed' },
            { title: 'b', status: 'failed' },
            { title: 'c', status: 'skipped' },
          ],
        },
      ],
    };
    expect(vitestOutcomes(report)).toEqual([
      { title: 'a', passed: true },
      { title: 'b', passed: false },
    ]);
  });

  test('M0-AC2 flattens nested Playwright suites, one outcome per device', () => {
    const report = {
      suites: [
        {
          specs: [{ title: 'a', tests: [{ status: 'expected' }, { status: 'unexpected' }] }],
          suites: [{ specs: [{ title: 'b', tests: [{ status: 'flaky' }, { status: 'skipped' }] }] }],
        },
      ],
    };
    expect(playwrightOutcomes(report)).toEqual([
      { title: 'a', passed: true },
      { title: 'a', passed: false },
      { title: 'b', passed: true },
    ]);
  });

  test('M0-AC2 status: any failing test fails, a pass or checked box passes, otherwise pending', () => {
    const pass = { title: 'M0-AC1 ok', passed: true };
    const fail = { title: 'M0-AC1 broken', passed: false };
    expect(statusOf(criterion, [pass, fail])).toBe('fail');
    expect(statusOf(criterion, [pass])).toBe('pass');
    expect(statusOf({ ...criterion, checked: true }, [])).toBe('pass');
    expect(statusOf(criterion, [{ title: 'M0-AC10 other', passed: false }])).toBe('pending');
  });

  test('M0-AC2 renders one table row per AC and escapes pipes', () => {
    const table = renderTable('milestones/M0.md', [
      { criterion: { ...criterion, text: 'a | b' }, status: 'pass' },
    ]);
    expect(table).toContain('### AC status: milestones/M0.md');
    expect(table).toContain('| M0-AC1 | ✅ pass | a \\| b |');
  });
});
