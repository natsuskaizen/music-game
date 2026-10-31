// Fails the build when the gzipped JS in dist/ (app bundles plus the service worker) exceeds the budget.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { checkBudget } from './budget.ts';

const files = readdirSync('dist', { recursive: true, encoding: 'utf8' })
  .filter((path) => path.endsWith('.js'))
  .map((path) => ({ path, gzipBytes: gzipSync(readFileSync(join('dist', path))).length }));

const { ok, summary } = checkBudget(files);
console.log(summary);
if (!ok) process.exit(1);
