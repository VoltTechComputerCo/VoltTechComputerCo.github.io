import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const nav = fs.readFileSync(path.join(root, 'assets/css/navigation.css'), 'utf8');
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };

const start = nav.indexOf('/* STEP 11.2M COLOUR IMAGE MENU START */');
const end = nav.indexOf('/* STEP 11.2M COLOUR IMAGE MENU END */');
assert(start >= 0 && end > start, 'FAIL: menu block missing');
const block = nav.slice(start, end);

const checks = [
  ['store custom image', block.includes('vt-menu-store-custom.webp')],
  ['stream custom image', block.includes('vt-menu-stream-custom.webp')],
  ['services custom image', block.includes('vt-menu-services-custom.webp')],
  ['signal custom image', block.includes('vt-menu-signal-custom.webp')],
  ['builder custom image', block.includes('vt-menu-builder-custom.webp')],
  ['custom positions', block.includes('--nav-image-position:center 38%') && block.includes('--nav-image-position:center 42%')],
  ['updated accent colours', ['74,238,220','255,196,108','255,151,72','120,146,255','255,137,204'].every(x => block.includes(x))],
  ['no backdrop blur', !/backdrop-filter\s*:/.test(block)],
];
for (const [name, ok] of checks) {
  assert(ok, `FAIL: ${name}`);
  console.log(`PASS: ${name}`);
}
console.log('PASS: Step 11.2N custom menu images contract');
