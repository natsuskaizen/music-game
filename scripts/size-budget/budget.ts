/** The roadmap's build budget: total gzipped JS the app may ship. Raise it deliberately, never to pass a PR. */
export const JS_BUDGET_BYTES = 250 * 1024;

/** One built JS file and its gzipped size. */
export interface JsFile {
  path: string;
  gzipBytes: number;
}

/** The budget verdict and a one-line summary for the console. */
export interface BudgetResult {
  ok: boolean;
  summary: string;
}

const toKb = (bytes: number): string => (bytes / 1024).toFixed(1);

/** Sums the gzipped JS and compares it with the budget, so a PR that bloats the bundle fails `npm run check`. */
export function checkBudget(files: JsFile[], budget = JS_BUDGET_BYTES): BudgetResult {
  const total = files.reduce((sum, file) => sum + file.gzipBytes, 0);
  const ok = total <= budget;
  const verdict = ok ? 'within' : 'OVER';
  return {
    ok,
    summary: `JS ${toKb(total)} KB gz in ${String(files.length)} files, ${verdict} the ${toKb(budget)} KB budget`,
  };
}
