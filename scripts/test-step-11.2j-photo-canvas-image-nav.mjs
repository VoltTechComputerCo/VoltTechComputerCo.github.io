import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };

const header = read('src/templates/header.html');
const nav = read('assets/css/navigation.css');
const glass = read('assets/css/glass-system.css');
const creatorSource = read('src/pages/creator-hub-south-africa.html');
const creatorBuilt = read('creator-hub-south-africa.html');
const creatorCss = read('assets/css/pages/creator-hub.css');
const home = read('index.html');

const checks = [
  ['Store nav image class', header.includes('class="nav-store"')],
  ['Builder nav image class', header.includes('class="nav-builder"')],
  ['Services nav image class', header.includes('class="nav-services"')],
  ['Signal Scan nav image class', header.includes('class="nav-scan"')],
  ['Creator Hub mobile nav route', header.includes('mobile-nav-creator nav-creator')],
  ['image-card nav block exists', nav.includes('STEP 11.2J IMAGE CARD NAVIGATION START')],
  ['menu uses real image asset', nav.includes("vt-stock-modern-build.webp") && nav.includes("vt-px-technician-service.webp")],
  ['Creator menu uses real image asset', nav.includes("vt-px-creator-desk.webp")],
  ['old premium-nav glow block removed', !nav.includes('STEP 11.2I PREMIUM NAVIGATION START')],
  ['photo canvas exists', glass.includes('STEP 11.2J PHOTOGRAPHIC SITE CANVAS START')],
  ['home real photo mapping exists', glass.includes("body[data-page=\"home\"]") && glass.includes("vt-drive-workbench.webp")],
  ['service mappings exist', glass.includes("bg-repair.webp") && glass.includes("bg-upgrades.webp")],
  ['creator photo mapping exists', glass.includes("vt-drive-creator-desk.webp")],
  ['old ambient glow block removed', !glass.includes('STEP 11.2I SITE ATMOSPHERE START')],
  ['Creator Hub source uses real image', creatorSource.includes('creator-hero-visual') && creatorSource.includes('vt-px-creator-desk.webp')],
  ['Creator Hub built uses real image', creatorBuilt.includes('creator-hero-visual') && creatorBuilt.includes('vt-px-creator-desk.webp')],
  ['synthetic creator stage removed', !creatorSource.includes('creator-signal-stage')],
  ['creator photo CSS exists', creatorCss.includes('STEP 11.2J CREATOR HUB PHOTO DIRECTION START')],
  ['creator scan animation removed', !creatorCss.includes('@keyframes creator-scan')],
  ['generated home contains Creator Hub mobile tile', home.includes('South African creators')],
];

for (const [name, ok] of checks) {
  assert(ok, `FAIL: ${name}`);
  console.log(`PASS: ${name}`);
}

console.log('PASS: Step 11.2J photographic canvas and image navigation contract');
