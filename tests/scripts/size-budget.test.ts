import { describe, expect, test } from 'vitest';
import { checkBudget, JS_BUDGET_BYTES } from '../../scripts/size-budget/budget.ts';

describe('M0-AC1 build size budget', () => {
  test('M0-AC1 passes when the gzipped JS fits the budget', () => {
    const result = checkBudget([
      { path: 'assets/index.js', gzipBytes: 10 * 1024 },
      { path: 'sw.js', gzipBytes: 2 * 1024 },
    ]);
    expect(result).toEqual({ ok: true, summary: 'JS 12.0 KB gz in 2 files, within the 250.0 KB budget' });
  });

  test('M0-AC1 fails when the gzipped JS is over the budget', () => {
    const result = checkBudget([{ path: 'assets/index.js', gzipBytes: JS_BUDGET_BYTES + 1 }]);
    expect(result.ok).toBe(false);
    expect(result.summary).toContain('OVER');
  });
});
