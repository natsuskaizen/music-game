// CI side of the AI review gate (review.yml). Commands:
//   scope   reads changed paths on stdin and prints `review=true|false` for $GITHUB_OUTPUT.
//   verdict reads the reviewer's JSON from $REVIEW_JSON, annotates the PR, writes the summary to the job
//           summary and reports/review.md (posted as a PR comment), and exits 1 on a fail.
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { annotations, isDocsOnly, isFailing, parseVerdict, renderSummary } from './gate.ts';

function scope(): void {
  const paths = readFileSync(0, 'utf8').split('\n').filter(Boolean);
  console.log(`review=${String(!isDocsOnly(paths))}`);
}

function verdict(): void {
  const result = parseVerdict(process.env.REVIEW_JSON);
  for (const command of annotations(result)) console.log(command);
  const summary = renderSummary(result);
  mkdirSync('reports', { recursive: true });
  writeFileSync('reports/review.md', summary);
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) appendFileSync(summaryPath, summary);
  else console.log(summary);
  if (isFailing(result)) process.exit(1);
}

const commands: Record<string, () => void> = {
  scope,
  verdict,
};
const command = commands[process.argv[2] ?? ''];
if (!command) throw new Error('Usage: node scripts/review-gate/main.ts scope|verdict');
command();
