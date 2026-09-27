import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };

const build = read('scripts/build-clean-frontend.py');
const glass = read('assets/css/glass-system.css');
const home = read('index.html');
const store = read('store.html');
const repair = read('pc-repair-pretoria.html');
const builder = read('builder/index.html');
const account = read('account.html');
const legal = read('legal.html');

const stylesheetPattern = /assets\/css\/glass-system\.css/;

const checks = [
  ['build appends sitewide glass stylesheet last', build.includes("config.get('styles', []) + ['assets/css/glass-system.css']")],
  ['home loads glass system', stylesheetPattern.test(home)],
  ['store loads glass system', stylesheetPattern.test(store)],
  ['repair loads glass system', stylesheetPattern.test(repair)],
  ['builder loads glass system', stylesheetPattern.test(builder)],
  ['account loads glass system', stylesheetPattern.test(account)],
  ['legal loads glass system', stylesheetPattern.test(legal)],
  ['STATIC exclusion exists', glass.includes('[data-page^="static"]')],
  ['admin exclusion exists', glass.includes('[data-page^="admin"]')],
  ['global glass blur is 7px', glass.includes('--vt-glass-blur: 7px')],
  ['mobile glass blur is 5px', glass.includes('--vt-glass-blur-mobile: 5px')],
  ['global panel system exists', glass.includes('GLOBAL MATERIAL')],
  ['global button system exists', glass.includes('BUTTONS')],
  ['global form system exists', glass.includes('FORMS')],
  ['service accent routing exists', glass.includes('--service-accent')],
  ['creator purple routing exists', glass.includes('body[data-page="creator-hub-south-africa"]')],
  ['print flattening exists', glass.includes('@media print')],
  ['existing image glass stays aligned', glass.includes('.vt-image-glass')],
];

for (const [name, ok] of checks) {
  assert(ok, `FAIL: ${name}`);
  console.log(`PASS: ${name}`);
}

console.log('PASS: Step 11.2H sitewide glass design system contract');
