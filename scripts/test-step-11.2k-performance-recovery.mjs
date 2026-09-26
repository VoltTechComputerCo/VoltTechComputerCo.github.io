import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };

const glass = read('assets/css/glass-system.css');
const nav = read('assets/css/navigation.css');
const creator = read('src/pages/creator-hub-south-africa.html');
const creatorCss = read('assets/css/pages/creator-hub.css');
const components = read('assets/css/components.css');
const home = read('index.html');

const globalBackdropCount = (glass.match(/backdrop-filter/g) || []).length;

const checks = [
  ['performance marker exists', glass.includes('STEP 11.2K PERFORMANCE RECOVERY')],
  ['global glass has zero backdrop filters', globalBackdropCount === 0],
  ['fixed photo canvas removed', !glass.includes('STEP 11.2J PHOTOGRAPHIC SITE CANVAS START')],
  ['ambient glow experiment removed', !glass.includes('STEP 11.2I SITE ATMOSPHERE START')],
  ['image-card nav experiment removed', !nav.includes('STEP 11.2J IMAGE CARD NAVIGATION START')],
  ['premium nav experiment removed', !nav.includes('STEP 11.2I PREMIUM NAVIGATION START')],
  ['synthetic creator stage removed', !creator.includes('creator-signal-stage')],
  ['photo creator hero experiment removed', !creator.includes('creator-hero-visual')],
  ['creator CSS experimental blocks removed', !creatorCss.includes('STEP 11.2I CREATOR HUB DEPTH START') && !creatorCss.includes('STEP 11.2J CREATOR HUB PHOTO DIRECTION START')],
  ['small scoped image glass retained', components.includes('STEP 11.2G IMAGE OVERLAY GLASS SYSTEM START')],
  ['small scoped blur retained', components.includes('backdrop-filter: blur(7px) saturate(125%)')],
  ['generated homepage still loads global glass system', home.includes('assets/css/glass-system.css')],
  ['hero headline retained', home.includes('BUILT FOR PERFORMANCE.') && home.includes('READY FOR ANYTHING.')],
];

for (const [name, ok] of checks) {
  assert(ok, `FAIL: ${name}`);
  console.log(`PASS: ${name}`);
}

console.log(`PASS: global backdrop-filter count = ${globalBackdropCount}`);
console.log('PASS: Step 11.2K performance recovery contract');
