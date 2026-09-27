import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const css = fs.readFileSync(path.join(root, 'assets/css/glass-system.css'), 'utf8');

const assert = (ok, msg) => { if (!ok) throw new Error(msg); };

const blockStart = css.indexOf('/* STEP 11.2L PROCEDURAL TECH BACKGROUND START */');
const blockEnd = css.indexOf('/* STEP 11.2L PROCEDURAL TECH BACKGROUND END */');
assert(blockStart >= 0 && blockEnd > blockStart, 'FAIL: Step 11.2L block missing');

const block = css.slice(blockStart, blockEnd);

const checks = [
  ['procedural marker', block.includes('STEP 11.2L PROCEDURAL TECH BACKGROUND START')],
  ['large engineering grid', block.includes('72px 72px')],
  ['fine sub-grid', block.includes('18px 18px')],
  ['node matrix', block.includes('radial-gradient(circle at 1px 1px')],
  ['signal trace layer', block.includes('repeating-linear-gradient')],
  ['no image URL', !block.includes('url(')],
  ['no backdrop blur', !/backdrop-filter\s*:/.test(block)],
  ['no CSS filter property', !/(^|[;{]\s*)filter\s*:/.test(block)],
  ['no animation property', !/(^|[;{]\s*)animation(?:-[\w-]+)?\s*:/.test(block)],
  ['no fixed positioning', !/position\s*:\s*fixed/.test(block)],
  ['STATIC exclusion retained', block.includes('[data-page^="static"]')],
  ['admin exclusion retained', block.includes('[data-page^="admin"]')],
];

for (const [name, ok] of checks) {
  assert(ok, `FAIL: ${name}`);
  console.log(`PASS: ${name}`);
}

console.log('PASS: Step 11.2L procedural tech background contract');
