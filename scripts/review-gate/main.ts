// CI side of the AI review gate (review.yml). Commands:
//   scope   reads changed paths on stdin and prints `review=true|false` for $GITHUB_OUTPUT.
//   verdict reads the reviewer's JSON from $REVIEW_JSON, annotates the PR, and exits 1 on a fail.
import { appendFileSync, readFileSync } from 'node:fs';
import { annotations, isDocsOnly, isFailing, renderSummary, type Verdict } from './gate.ts';

function scope(): void {
  const paths = readFileSync(0, 'utf8').split('\n').filter(Boolean);
  console.log(`review=${String(!isDocsOnly(paths))}`);
}

function verdict(): void {
  const json = process.env.REVIEW_JSON;
  if (!json) throw new Error('REVIEW_JSON is empty: the reviewer returned no structured output.');
  const result = JSON.parse(json) as Verdict;
  for (const command of annotations(result)) console.log(command);
  const summary = renderSummary(result);
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
