import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const assert = (v, m) => { if (!v) throw new Error(m); };

const mapping = {
  'vt-repair.webp': 'vt-service-repair-hands-on-motherboard.webp',
  'vt-performance.webp': 'vt-service-performance-nzxt-build.webp',
  'vt-upgrades.webp': 'vt-service-upgrades-components-flatlay.webp',
  'vt-windows.webp': 'vt-service-windows-install.webp',
  'vt-malware.webp': 'vt-service-security-motherboard-cpu.webp',
  'vt-streaming.webp': 'vt-service-stream-support-showcase-build.webp',
};

const requiredNew = [
  ...Object.values(mapping),
  'vt-alt-upgrades-zotac-gpu.webp',
  'vt-alt-performance-air-cooler.webp',
  'vt-alt-performance-rog-gpu.webp',
];

for (const name of requiredNew) {
  assert(fs.existsSync(path.join(root, name)), `Missing new WebP asset: ${name}`);
}
for (const old of Object.keys(mapping)) {
  assert(!fs.existsSync(path.join(root, old)), `Retired asset still exists: ${old}`);
}

const sourceFiles = [
  'src/pages/service-repair.html',
  'src/pages/service-repair.head.html',
  'src/pages/service-performance.html',
  'src/pages/service-performance.head.html',
  'src/pages/service-upgrades.html',
  'src/pages/service-upgrades.head.html',
  'src/pages/service-windows.html',
  'src/pages/service-windows.head.html',
  'src/pages/service-security.html',
  'src/pages/service-security.head.html',
  'src/pages/streaming-support.html',
  'src/pages/streaming-support.head.html',
];

const rootHtml = fs.readdirSync(root).filter(name => name.endsWith('.html'));
const textFiles = [...sourceFiles, ...rootHtml];
let corpus = '';
for (const rel of textFiles) {
  corpus += '\n' + fs.readFileSync(path.join(root, rel), 'utf8');
}

for (const [oldName, newName] of Object.entries(mapping)) {
  assert(!corpus.includes(oldName), `Old image reference still present: ${oldName}`);
  assert(corpus.includes(newName), `New image reference missing: ${newName}`);
}

const expectations = [
  ['src/pages/service-repair.html', 'vt-service-repair-hands-on-motherboard.webp'],
  ['src/pages/service-performance.html', 'vt-service-performance-nzxt-build.webp'],
  ['src/pages/service-upgrades.html', 'vt-service-upgrades-components-flatlay.webp'],
  ['src/pages/service-windows.html', 'vt-service-windows-install.webp'],
  ['src/pages/service-security.html', 'vt-service-security-motherboard-cpu.webp'],
  ['src/pages/streaming-support.html', 'vt-service-stream-support-showcase-build.webp'],
];
for (const [rel, image] of expectations) {
  assert(fs.readFileSync(path.join(root, rel), 'utf8').includes(image), `${rel} missing ${image}`);
}

const headExpectations = [
  ['src/pages/service-repair.head.html', 'vt-service-repair-hands-on-motherboard.webp'],
  ['src/pages/service-performance.head.html', 'vt-service-performance-nzxt-build.webp'],
  ['src/pages/service-upgrades.head.html', 'vt-service-upgrades-components-flatlay.webp'],
  ['src/pages/service-windows.head.html', 'vt-service-windows-install.webp'],
  ['src/pages/service-security.head.html', 'vt-service-security-motherboard-cpu.webp'],
  ['src/pages/streaming-support.head.html', 'vt-service-stream-support-showcase-build.webp'],
];
for (const [rel, image] of headExpectations) {
  assert(fs.readFileSync(path.join(root, rel), 'utf8').includes(image), `${rel} metadata missing ${image}`);
}

console.log('PASS: Step 11.2C service imagery and metadata replacement contract');
