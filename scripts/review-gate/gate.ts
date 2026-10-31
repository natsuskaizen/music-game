/** One reviewer finding; only `blocking` ones fail the gate. */
export interface Finding {
  severity: 'blocking' | 'suggestion';
  file: string;
  line?: number;
  rule: string;
  message: string;
}

/** The code-reviewer agent's output, as `.claude/agents/code-reviewer.md` defines it. */
export interface Verdict {
  verdict: 'pass' | 'fail';
  findings: Finding[];
}

/** A PR that only touches Markdown has no code to review, so the gate passes without calling Claude.
 * Agent files under `.claude/` are Markdown but steer the reviewer, so they still get reviewed. */
export function isDocsOnly(changedPaths: string[]): boolean {
  return changedPaths.every((path) => path.endsWith('.md') && !path.startsWith('.claude/'));
}

/** Fails on the agent's `fail` verdict or on any blocking finding, so a mislabeled verdict can't slip through. */
export function isFailing(result: Verdict): boolean {
  return result.verdict === 'fail' || result.findings.some((finding) => finding.severity === 'blocking');
}

// Workflow commands need %, CR, LF escaped in messages, plus , and : in properties.
function escapeData(text: string): string {
  return text.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
}

function escapeProperty(text: string): string {
  return escapeData(text).replaceAll(':', '%3A').replaceAll(',', '%2C');
}

/** Turns findings into workflow commands that GitHub shows inline on the PR's changed files. */
export function annotations(result: Verdict): string[] {
  return result.findings.map(({ severity, file, line, rule, message }) => {
    const level = severity === 'blocking' ? 'error' : 'warning';
    const location = line === undefined ? '' : `,line=${String(line)}`;
    const title = escapeProperty(`AI review: ${rule}`);
    return `::${level} file=${escapeProperty(file)}${location},title=${title}::${escapeData(message)}`;
  });
}

/** Renders the verdict and findings as the job summary. */
export function renderSummary(result: Verdict): string {
  const heading = `### AI review: ${isFailing(result) ? '❌ fail' : '✅ pass'}`;
  if (result.findings.length === 0) return `${heading}\n\nNo findings.\n`;
  const rows = result.findings.map(({ severity, file, line, rule, message }) => {
    const where = line === undefined ? file : `${file}:${String(line)}`;
    return `| ${severity} | ${where} | ${rule} | ${message.replaceAll('|', '\\|')} |`;
  });
  return [heading, '', '| Severity | Where | Rule | Finding |', '|---|---|---|---|', ...rows, ''].join('\n');
}
