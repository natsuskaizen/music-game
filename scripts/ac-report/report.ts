/** One test's result, reduced to what the AC table needs. */
export interface TestOutcome {
  title: string;
  passed: boolean;
}

/** An acceptance criterion from a milestone doc. `checked` means a recorded manual check (`- [x]`). */
export interface Criterion {
  id: string;
  text: string;
  checked: boolean;
}

/** `pending` means nothing covers the AC yet. It doesn't fail CI, but a milestone can't close with one. */
export type AcStatus = 'pass' | 'fail' | 'pending';

/** A criterion with its computed status, one row of the table. */
export interface AcResult {
  criterion: Criterion;
  status: AcStatus;
}

/** The subset of Vitest's JSON reporter output that we read. */
export interface VitestReport {
  testResults: { assertionResults: { title: string; status: string }[] }[];
}

/** The subset of Playwright's JSON reporter output that we read; the report root is itself a suite. */
export interface PlaywrightSuite {
  specs?: { title: string; tests: { status: string }[] }[];
  suites?: PlaywrightSuite[];
}

const AC_LINE = /^- (?:\[([ x])\] )?([MF]\d+-AC\d+) (.+)$/;
const PASSING = new Set(['passed', 'expected', 'flaky']);
const FAILING = new Set(['failed', 'unexpected']);
const BADGE: Record<AcStatus, string> = { pass: '✅ pass', fail: '❌ fail', pending: '⏳ pending' };

/** Finds the milestone doc (relative to `docs/`) of the roadmap row marked "In progress". */
export function activeMilestoneDoc(roadmap: string): string | undefined {
  const row = roadmap.split('\n').find((line) => line.startsWith('|') && line.includes('| In progress |'));
  return row ? /\]\((milestones\/[^)]+)\)/.exec(row)?.[1] : undefined;
}

/** Reads the AC list items (`- M0-AC1 ...` or `- [x] M0-AC6 ...`) from a milestone doc. */
export function parseCriteria(markdown: string): Criterion[] {
  return markdown.split('\n').flatMap((line) => {
    const match = AC_LINE.exec(line.trim());
    if (!match?.[2] || !match[3]) return [];
    return [{ id: match[2], text: match[3], checked: match[1] === 'x' }];
  });
}

/** Turns a runner status into an outcome; skipped and todo tests count as neither pass nor fail. */
function toOutcome(title: string, status: string): TestOutcome[] {
  if (PASSING.has(status)) return [{ title, passed: true }];
  if (FAILING.has(status)) return [{ title, passed: false }];
  return [];
}

/** Flattens a Vitest JSON report into outcomes. */
export function vitestOutcomes(report: VitestReport): TestOutcome[] {
  return report.testResults.flatMap((file) =>
    file.assertionResults.flatMap((test) => toOutcome(test.title, test.status)),
  );
}

/** Flattens a Playwright JSON report into outcomes, one per spec and device project. */
export function playwrightOutcomes(suite: PlaywrightSuite): TestOutcome[] {
  const own = (suite.specs ?? []).flatMap((spec) =>
    spec.tests.flatMap((test) => toOutcome(spec.title, test.status)),
  );
  return [...own, ...(suite.suites ?? []).flatMap(playwrightOutcomes)];
}

/** An AC passes with a passing test or a checked box, and fails if any of its tests fails. */
export function statusOf(criterion: Criterion, outcomes: TestOutcome[]): AcStatus {
  const own = outcomes.filter((outcome) => outcome.title.startsWith(`${criterion.id} `));
  if (own.some((outcome) => !outcome.passed)) return 'fail';
  return own.length > 0 || criterion.checked ? 'pass' : 'pending';
}

/** Renders the per-AC markdown table for the job summary. */
export function renderTable(title: string, results: AcResult[]): string {
  const rows = results.map(
    ({ criterion, status }) =>
      `| ${criterion.id} | ${BADGE[status]} | ${criterion.text.replaceAll('|', '\\|')} |`,
  );
  return [`### AC status: ${title}`, '', '| AC | Status | Criterion |', '|---|---|---|', ...rows, ''].join(
    '\n',
  );
}
