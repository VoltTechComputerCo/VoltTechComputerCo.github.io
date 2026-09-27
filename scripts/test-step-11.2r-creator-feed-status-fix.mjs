import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const js = fs.readFileSync(path.join(root, 'assets/js/pages/creator-hub.js'), 'utf8');
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };

const checks = [
  ['status label uses child strong', js.includes("const label = state?.querySelector('strong');")],
  ['status updates label not container', js.includes("label.textContent = 'CREATOR DIRECTORY TEMPORARILY UNAVAILABLE'")],
  ['refresh preserves detail node', js.includes("if (detail) detail.textContent = 'Loading the latest available creator status.'")],
  ['refresh does not overwrite status container', !js.includes("q('#creatorFeedState').textContent = 'CHECKING CREATOR DIRECTORY…'")],
  ['live status label preserved', js.includes("label.textContent = live ? `${live} CREATOR${live === 1 ? '' : 'S'} LIVE NOW`")],
  ['detail null guard exists', js.includes("if (!state || !label || !detail) return;")],
];

for (const [name, ok] of checks) {
  assert(ok, `FAIL: ${name}`);
  console.log(`PASS: ${name}`);
}
console.log('PASS: Step 11.2R Creator Hub feed-status contract');
