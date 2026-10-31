// Writes the AC status table for the active milestone to the job summary (or stdout) and exits 1 if any AC fails.
// Reads the JSON reports that Vitest and Playwright write under `reports/` when CI is set.
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import {
  activeMilestoneDoc,
  parseCriteria,
  playwrightOutcomes,
  renderTable,
  statusOf,
  vitestOutcomes,
  type PlaywrightSuite,
  type VitestReport,
} from './report.ts';

function readText(path: string): string {
  return readFileSync(path, 'utf8');
}

// A missing report means that runner didn't get to run; its ACs show as pending and the failed step stays red.
function readReport(path: string): unknown {
  return existsSync(path) ? JSON.parse(readText(path)) : undefined;
}

const doc = activeMilestoneDoc(readText('docs/roadmap.md'));
if (!doc) throw new Error('No milestone is marked "In progress" in docs/roadmap.md');

const unit = readReport('reports/unit.json') as VitestReport | undefined;
const e2e = readReport('reports/e2e.json') as PlaywrightSuite | undefined;
const outcomes = [...(unit ? vitestOutcomes(unit) : []), ...(e2e ? playwrightOutcomes(e2e) : [])];
const results = parseCriteria(readText(`docs/${doc}`)).map((criterion) => ({
  criterion,
  status: statusOf(criterion, outcomes),
}));
const table = renderTable(doc, results);

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (summaryPath) appendFileSync(summaryPath, table);
else console.log(table);

if (results.some((result) => result.status === 'fail')) process.exit(1);
