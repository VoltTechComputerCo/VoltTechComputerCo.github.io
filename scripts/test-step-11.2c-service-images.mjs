import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const assert = (v, m) => { if (!v) throw new Error(m); };
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const mapping = {
  'vt-repair.webp': 'vt-service-repair-hands-on-motherboard.webp',
  'vt-performance.webp': 'vt-service-performance-nzxt-build.webp',
  'vt-upgrades.webp': 'vt-service-upgrades-components-flatlay.webp',
  'vt-windows.webp': 'vt-service-windows-install.webp',
  'vt-malware.webp': 'vt-service-security-motherboard-cpu.webp',
  'vt-streaming.webp': 'vt-service-stream-support-showcase-build.webp',
};

const requiredNew = [
  'vt-service-repair-hands-on-motherboard.webp',
  'vt-service-performance-nzxt-build.webp',
  'vt-service-upgrades-components-flatlay.webp',
  'vt-service-windows-install.webp',
  'vt-service-security-motherboard-cpu.webp',
  'vt-service-stream-support-showcase-build.webp',
  'vt-alt-upgrades-zotac-gpu.webp',
  'vt-alt-performance-air-cooler.webp',
  'vt-alt-performance-rog-gpu.webp',
];

for (const name of requiredNew) {
  assert(fs.existsSync(path.join(root, name)), `Missing uploaded image asset: ${name}`);
}
for (const old of Object.keys(mapping)) {
  assert(!fs.existsSync(path.join(root, old)), `Old asset should be deleted: ${old}`);
}

const sourceFiles = [
  'src/pages/service-repair.html',
  'src/pages/service-performance.html',
  'src/pages/service-upgrades.html',
  'src/pages/service-windows.html',
  'src/pages/service-security.html',
  'src/pages/streaming-support.html',
].filter(rel => fs.existsSync(path.join(root, rel)));

const builtHtmlFiles = fs.readdirSync(root)
  .filter(name => name.endsWith('.html'))
  .map(name => name);

let htmlCorpus = '';
for (const rel of [...sourceFiles, ...builtHtmlFiles]) {
  htmlCorpus += '\n' + read(rel);
}

for (const [oldName, newName] of Object.entries(mapping)) {
  assert(!htmlCorpus.includes(oldName), `Old image reference still present: ${oldName}`);
  assert(htmlCorpus.includes(newName), `New image reference missing from HTML corpus: ${newName}`);
}

assert(read('src/pages/streaming-support.html').includes('vt-service-stream-support-showcase-build.webp'), 'Streaming Support page did not receive the new image');
console.log('PASS: Step 11.2C service image replacement contract');
