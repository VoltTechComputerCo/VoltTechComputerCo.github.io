import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };

const header = read('src/templates/header.html');
const nav = read('assets/css/navigation.css');
const responsive = read('assets/css/responsive.css');
const glass = read('assets/css/glass-system.css');
const creatorSource = read('src/pages/creator-hub-south-africa.html');
const creatorBuilt = read('creator-hub-south-africa.html');
const creatorCss = read('assets/css/pages/creator-hub.css');
const home = read('index.html');

const checks = [
  ['mobile nav intro exists', header.includes('mobile-nav-intro')],
  ['nav subtitles exist', header.includes('Components &amp; gear') && header.includes('OBS, audio &amp; performance')],
  ['nav stream semantic class exists', header.includes('class="nav-stream"')],
  ['premium nav CSS exists', nav.includes('STEP 11.2I PREMIUM NAVIGATION START')],
  ['mobile nav glass container exists', nav.includes('backdrop-filter: blur(12px)')],
  ['responsive nav refinement exists', responsive.includes('STEP 11.2I NAV RESPONSIVE START')],
  ['site atmosphere exists', glass.includes('STEP 11.2I SITE ATMOSPHERE START')],
  ['technical grid exists', glass.includes('background-size: 48px 48px')],
  ['creator page atmosphere routing preserved', glass.includes('body[data-page="creator-hub-south-africa"]')],
  ['creator signal stage source exists', creatorSource.includes('creator-signal-stage')],
  ['creator signal stage built exists', creatorBuilt.includes('creator-signal-stage')],
  ['creator stage CSS exists', creatorCss.includes('STEP 11.2I CREATOR HUB DEPTH START')],
  ['creator scan animation exists', creatorCss.includes('@keyframes creator-scan')],
  ['reduced motion handling exists', creatorCss.includes('prefers-reduced-motion')],
  ['generated homepage has enriched navigation', home.includes('Where do you want to go?')],
];

for (const [name, ok] of checks) {
  assert(ok, `FAIL: ${name}`);
  console.log(`PASS: ${name}`);
}

console.log('PASS: Step 11.2I atmosphere/navigation/Creator Hub contract');
