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
  ['source title line 1', source.includes('BUILT FOR PERFORMANCE.')],
  ['source title line 2', source.includes('READY FOR ANYTHING.')],
  ['built title line 1', built.includes('BUILT FOR PERFORMANCE.')],
  ['built title line 2', built.includes('READY FOR ANYTHING.')],
  ['old hero title removed from source', !source.includes('TUNE YOUR')],
  ['old hero title removed from built page', !built.includes('TUNE YOUR')],
  ['source strap', source.includes('CUSTOM PCs. COMPONENTS. UPGRADES. REPAIRS. STREAM SUPPORT.')],
  ['built strap', built.includes('CUSTOM PCs. COMPONENTS. UPGRADES. REPAIRS. STREAM SUPPORT.')],
  ['old creator-tech kicker removed', !source.includes('PC HARDWARE / GAMING / CREATOR TECH')],
  ['new hero kicker source', source.includes('PC HARDWARE / GAMING / STREAM SUPPORT')],
  ['new hero kicker built', built.includes('PC HARDWARE / GAMING / STREAM SUPPORT')],
  ['hero CTA class source', source.includes('button button-secondary hero-stream-button')],
  ['hero CTA class built', built.includes('button button-secondary hero-stream-button')],
  ['purple CTA selector', css.includes('.hero-stream-button')],
  ['purple CTA colour', css.includes('#d9bbff') || css.includes('194, 140, 255')],
  ['neon glow', css.includes('box-shadow:')],
  ['scoped CSS marker', css.includes('STEP 11.2E HOMEPAGE HERO REFRESH START')],
];

for (const [name, ok] of checks) {
  assert(ok, `FAIL: ${name}`);
  console.log(`PASS: ${name}`);
}

console.log('PASS: Step 11.2E homepage hero refresh contract');
