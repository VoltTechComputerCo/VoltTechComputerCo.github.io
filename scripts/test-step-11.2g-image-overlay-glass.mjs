import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };

const homeSource = read('src/pages/home.html');
const homeBuilt = read('index.html');
const storeSource = read('src/pages/store.html');
const storeBuilt = read('store.html');
const components = read('assets/css/components.css');
const homeCss = read('assets/css/pages/home.css');
const commerceCss = read('assets/css/pages/commerce.css');

const checks = [
  ['home source teal hero glass', homeSource.includes('hero-build-button vt-image-glass vt-image-glass--teal')],
  ['home built teal hero glass', homeBuilt.includes('hero-build-button vt-image-glass vt-image-glass--teal')],
  ['home source purple hero glass', homeSource.includes('hero-stream-button vt-image-glass vt-image-glass--purple')],
  ['home built purple hero glass', homeBuilt.includes('hero-stream-button vt-image-glass vt-image-glass--purple')],
  ['home source hero note glass', homeSource.includes('hero-note micro vt-image-glass vt-image-glass--neutral')],
  ['home source image label glass', homeSource.includes('vt-image-glass vt-image-glass--purple">REMOTE ACROSS SOUTH AFRICA')],
  ['store source hero caption glass', storeSource.includes('micro vt-image-glass vt-image-glass--teal')],
  ['store built hero caption glass', storeBuilt.includes('micro vt-image-glass vt-image-glass--teal')],
  ['shared utility exists', components.includes('STEP 11.2G IMAGE OVERLAY GLASS SYSTEM START')],
  ['desktop blur reduced to 7px', components.includes('backdrop-filter: blur(7px) saturate(125%)')],
  ['mobile blur reduced to 5px', components.includes('backdrop-filter: blur(5px) saturate(120%)')],
  ['old 18px hero blur removed from home page mapping', !homeCss.includes('backdrop-filter: blur(18px)')],
  ['old Step 11.2F marker removed', !homeCss.includes('STEP 11.2F HERO CTA GLASS BUTTONS START')],
  ['mobile hero fact glass exists', homeCss.includes('.hero-facts > span') && homeCss.includes('rgba(78,239,224,.26)')],
  ['store hero caption mapped', commerceCss.includes('.store-hero-visual figcaption.vt-image-glass')],
  ['catalogue card captions not assigned glass class in source', !storeSource.includes('catalogue-media vt-image-glass')],
];

for (const [name, ok] of checks) {
  assert(ok, `FAIL: ${name}`);
  console.log(`PASS: ${name}`);
}
console.log('PASS: Step 11.2G image-overlay glass contract');
