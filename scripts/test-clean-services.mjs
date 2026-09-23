import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

const pages=[
  ['pc-repair-pretoria.html','repair','R350–R650'],
  ['pc-performance-optimisation.html','performance','R350–R550'],
  ['pc-upgrades-pretoria.html','upgrades','from R299'],
  ['virus-malware-removal-pretoria.html','security','R350–R550'],
  ['windows-installation-pretoria.html','windows','R350–R650']
];

for(const [page,key,price] of pages){
  const html=read(page);
  assert.ok(html.includes('data-vt-shell="clean"'),`${page} uses clean shell`);
  assert.ok(html.includes('assets/css/pages/services.css'),`${page} uses clean service CSS`);
  assert.ok(html.includes('assets/js/pages/service.js'),`${page} uses shared service controller`);
  assert.ok(html.includes(`data-service-key="${key}"`),`${page} exposes correct service key`);
  assert.ok(html.includes(`signal-scan.html?source=${key}`),`${page} points to correct Signal Scan route`);
  assert.ok(html.includes(price),`${page} preserves its service pricing guide`);
  assert.equal((html.match(/<h1\b/g)||[]).length,1,`${page} has one h1`);
  assert.equal((html.match(/<main\b/g)||[]).length,1,`${page} has one main`);
  assert.equal((html.match(/<header class="site-header"/g)||[]).length,1,`${page} has one clean header`);
  assert.equal((html.match(/<footer class="site-footer"/g)||[]).length,1,`${page} has one clean footer`);
  for(const retired of ['fonts.googleapis.com','analytics.js','service-pages.css','service-network.css','service-malware.css','visual-system.css','visual-block-fix.css','phase9-business-finish.css','mobile-nav.css','volttech-experience.js','conversion-context.js','symptom-handoff.js']){
    assert.ok(!html.includes(retired),`${page} no longer depends on ${retired}`);
  }
  assert.ok(!/<script(?![^>]*src=)[^>]*>[\s\S]*?<\/script>/i.test(html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/gi,'')),`${page} has no inline executable script`);
  assert.ok(!/\sstyle="/i.test(html),`${page} has no inline style attributes`);
}

const security=read('virus-malware-removal-pretoria.html');
assert.ok(security.includes('data-issue="apps"'), 'Security page keeps Unknown apps route');
assert.ok(security.includes('Programs or browser tools appeared that you don’t remember installing.'), 'Security Unknown apps copy is valid');
assert.ok(security.includes('exposure-scan.html'), 'Security page retains Exposure Scan handoff');

const upgrades=read('pc-upgrades-pretoria.html');
assert.ok(upgrades.includes('VoltTech is not currently selling or sourcing components.'), 'Upgrades page keeps current parts-supply boundary');
assert.ok(upgrades.includes('Full custom builds are not being actively offered yet.'), 'Upgrades page keeps current build boundary');

const controller=read('assets/js/pages/service.js');
assert.ok(controller.includes('connectProductionServices()'), 'Service family preserves production analytics/service-worker integration');
assert.ok(controller.includes('connectCart()'), 'Clean header cart count remains connected');
assert.ok(controller.includes('syncServiceContact'), 'Shared symptom/contact continuity is explicit');

const service=await import(`${pathToFileURL(path.join(root,'assets/js/services/service-contact.js')).href}?qa=${Date.now()}`);
const msg=service.buildServiceMessage('windows','I want a clean start');
assert.ok(msg.includes("Windows installation or Windows-related issue"), 'Windows contact copy stays contextual');
assert.ok(msg.includes('Selected issue: I want a clean start'), 'Selected issue is included in handoff message');
assert.equal(service.contactConfig('upgrades').subject,'PC Upgrade Enquiry');

console.log('PASS: clean five-page service family, SEO/pricing continuity, symptom handoff and current offer boundaries');
