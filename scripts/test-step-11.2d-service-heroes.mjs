import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const assert=(v,m)=>{if(!v)throw new Error(m)};

const css=read('assets/css/pages/services.css');
assert(css.includes('.service-hero{position:relative;isolation:isolate;min-height:0;overflow:hidden'), 'Integrated service hero missing');
assert(css.includes('.service-hero-media{position:absolute;z-index:1;inset:0 0 0 auto;width:52%'), 'Desktop hero image must be absolute/right');
assert(css.includes('.service-hero-media figcaption{display:none}'), 'Detached image caption must be hidden');
assert(css.includes('linear-gradient(90deg,var(--black)'), 'Hero fade missing');
assert(!css.includes('.service-hero-media{position:relative;min-height:28rem'), 'Old standalone desktop image layout remains');
assert(!css.includes('.service-hero-media{min-height:17rem}'), 'Old standalone mobile image layout remains');

const pages=[
  ['pc-repair-pretoria.html','vt-service-repair-hands-on-motherboard.webp'],
  ['pc-performance-optimisation.html','vt-service-performance-nzxt-build.webp'],
  ['pc-upgrades-pretoria.html','vt-service-upgrades-components-flatlay.webp'],
  ['virus-malware-removal-pretoria.html','vt-service-security-motherboard-cpu.webp'],
  ['windows-installation-pretoria.html','vt-service-windows-install.webp'],
  ['streaming-setup-south-africa.html','vt-service-stream-support-showcase-build.webp'],
];
for(const [rel,image] of pages){
  const html=read(rel);
  assert(html.includes('class="service-hero"'), `${rel}: hero missing`);
  assert(html.includes('class="service-hero-copy"'), `${rel}: hero copy missing`);
  assert(html.includes('class="service-hero-media"'), `${rel}: hero media missing`);
  assert(html.includes(image), `${rel}: expected service image missing`);
}
console.log('PASS: Step 11.2D integrated service hero composition');
