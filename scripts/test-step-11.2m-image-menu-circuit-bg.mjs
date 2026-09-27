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
const home = read('index.html');

const bgStart = glass.indexOf('/* STEP 11.2M SCHEMATIC CIRCUIT BACKGROUND START */');
const bgEnd = glass.indexOf('/* STEP 11.2M SCHEMATIC CIRCUIT BACKGROUND END */');
assert(bgStart >= 0 && bgEnd > bgStart, 'FAIL: background block missing');
const bg = glass.slice(bgStart, bgEnd);

const menuStart = nav.indexOf('/* STEP 11.2M COLOUR IMAGE MENU START */');
const menuEnd = nav.indexOf('/* STEP 11.2M COLOUR IMAGE MENU END */');
assert(menuStart >= 0 && menuEnd > menuStart, 'FAIL: menu block missing');
const menu = nav.slice(menuStart, menuEnd);

const checks = [
  ['old grid removed', !glass.includes('STEP 11.2L PROCEDURAL TECH BACKGROUND START')],
  ['circuit nodes exist', bg.includes('radial-gradient(circle at 10% 10%')],
  ['asymmetric traces exist', bg.includes('24% 1px')],
  ['background has no image URL', !bg.includes('url(')],
  ['background has no backdrop blur', !/backdrop-filter\s*:/.test(bg)],
  ['background has no fixed layer', !/position\s*:\s*fixed/.test(bg)],
  ['eight menu classes', ['nav-store','nav-builder','nav-services','nav-stream','nav-scan','nav-creator','nav-static','nav-cart'].every(x => header.includes(x))],
  ['creator hub menu route', header.includes('creator-hub-south-africa.html')],
  ['local images used', menu.includes('vt-own-hardware.webp') && menu.includes('vt-px-modern-pc.webp') && menu.includes('vt-px-creator-desk.webp')],
  ['eight accent colours', ['74,238,220','86,150,255','255,151,72','194,140,255','105,255,177','255,102,196','255,89,89','255,198,82'].every(x => menu.includes(x))],
  ['glowing border', menu.includes('0 0 24px rgba(var(--nav-rgb),.30)')],
  ['menu has no backdrop blur', !/backdrop-filter\s*:/.test(menu)],
  ['generated home enriched', home.includes('VOLTTECH / SYSTEM MAP') && home.includes('South African streams')],
];

for (const [name, ok] of checks) {
  assert(ok, `FAIL: ${name}`);
  console.log(`PASS: ${name}`);
}
console.log('PASS: Step 11.2M contract');
