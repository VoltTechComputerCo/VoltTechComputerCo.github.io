import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };

const sourcePages = {
  signal: read('src/pages/signal-scan.html'),
  streamScan: read('src/pages/stream-scan.html'),
  streamSupport: read('src/pages/streaming-support.html'),
  creator: read('src/pages/creator-hub-south-africa.html'),
};
const builtPages = {
  signal: read('signal-scan.html'),
  streamScan: read('stream-scan.html'),
  streamSupport: read('streaming-setup-south-africa.html'),
  creator: read('creator-hub-south-africa.html'),
};
const css = read('assets/css/glass-system.css');

const expectedTools = [
  'signal-scan.html',
  'stream-scan.html',
  'streaming-setup-south-africa.html',
  'creator-hub-south-africa.html'
];

for (const [name, page] of Object.entries(sourcePages)) {
  assert(page.includes('class="vt-tool-switcher"'), `FAIL: ${name} source missing tool switcher`);
  for (const href of expectedTools) {
    assert(page.includes(`href="${href}"`), `FAIL: ${name} source missing ${href}`);
  }
}

for (const [name, page] of Object.entries(builtPages)) {
  assert(page.includes('class="vt-tool-switcher"'), `FAIL: ${name} built page missing tool switcher`);
}

const checks = [
  ['Signal Scan active', sourcePages.signal.includes('data-tool="signal"') && sourcePages.signal.includes('aria-current="page"')],
  ['Stream Scan active', sourcePages.streamScan.includes('data-tool="stream-scan"') && sourcePages.streamScan.includes('aria-current="page"')],
  ['Stream Support active', sourcePages.streamSupport.includes('data-tool="stream-support"') && sourcePages.streamSupport.includes('aria-current="page"')],
  ['Creator Hub active', sourcePages.creator.includes('data-tool="creator"') && sourcePages.creator.includes('aria-current="page"')],
  ['scan back links are buttons', sourcePages.signal.includes('button button-secondary scan-back') && sourcePages.streamScan.includes('button button-secondary scan-back')],
  ['tool CSS exists', css.includes('STEP 11.2P UNIFIED TOOL NAV START')],
  ['2x2 mobile tool grid exists', css.includes('grid-template-columns: repeat(2, minmax(0, 1fr))')],
  ['four tool colours exist', ['74, 238, 220','194, 140, 255','120, 146, 255','255, 102, 196'].every(x => css.includes(x))],
  ['persistent menu glow included', css.includes('.menu-toggle:not([hidden])') && css.includes('0 0 16px rgba(53, 234, 215, .20)')],
  ['no backdrop blur in new block', !/STEP 11\.2P UNIFIED TOOL NAV START[\s\S]*backdrop-filter\s*:/.test(css)],
];

for (const [name, ok] of checks) {
  assert(ok, `FAIL: ${name}`);
  console.log(`PASS: ${name}`);
}

console.log('PASS: Step 11.2P unified tool navigation contract');
