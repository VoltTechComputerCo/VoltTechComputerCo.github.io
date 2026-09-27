import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const assert = (value, message) => {
  if (!value) throw new Error(message);
};

const source = read('src/pages/home.html');
const built = read('index.html');
const css = read('assets/css/pages/home.css');

const checks = [
  ['source has hero build button class', source.includes('button hero-build-button')],
  ['built has hero build button class', built.includes('button hero-build-button')],
  ['source keeps hero stream button class', source.includes('button button-secondary hero-stream-button')],
  ['built keeps hero stream button class', built.includes('button button-secondary hero-stream-button')],
  ['step marker present', css.includes('STEP 11.2F HERO CTA GLASS BUTTONS START')],
  ['shared glass selectors', css.includes('.hero-build-button,') && css.includes('.hero-stream-button {')],
  ['backdrop blur present', css.includes('backdrop-filter: blur(18px)') || css.includes('-webkit-backdrop-filter: blur(18px)')],
  ['teal glass colours present', css.includes('rgba(78, 239, 224, .92)') && css.includes('#90fff4')],
  ['purple glass colours present', css.includes('rgba(194, 140, 255, .92)') && css.includes('#d9bbff')],
  ['step 11.2e marker removed', !css.includes('STEP 11.2E HOMEPAGE HERO REFRESH START')],
];

for (const [name, ok] of checks) {
  assert(ok, `FAIL: ${name}`);
  console.log(`PASS: ${name}`);
}

console.log('PASS: Step 11.2F hero CTA glass buttons contract');
