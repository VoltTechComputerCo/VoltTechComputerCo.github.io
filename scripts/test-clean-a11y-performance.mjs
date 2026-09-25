import fs from 'node:fs';

const fail=m=>{throw new Error(m)};
const docs=['build-document','invoice','order-document','personal-data','proforma','quote','receipt','service-record'];
for(const stem of docs){
  const s=fs.readFileSync(new URL(`../src/pages/${stem}.html`,import.meta.url),'utf8');
  if((s.match(/<h1\b/g)||[]).length!==1)fail(`${stem}: static accessible H1 missing`);
  if(!s.includes('id="documentPageTitle"'))fail(`${stem}: document title ID missing`);
}
const controller=fs.readFileSync(new URL('../assets/js/pages/customer-document.js',import.meta.url),'utf8');
if(controller.includes('<h1>VoltTech Computer Co.</h1>'))fail('runtime duplicate H1 remains');
if(!controller.includes('setAccessibleDocumentTitle'))fail('runtime accessible document title updater missing');
if(!controller.includes('width="512" height="512"'))fail('document brand image dimensions missing');

const services=['service-repair','service-performance','service-upgrades','service-security','service-windows'];
for(const stem of services){
  const s=fs.readFileSync(new URL(`../src/pages/${stem}.html`,import.meta.url),'utf8');
  if(!s.includes('data-layout-stable="cover"'))fail(`${stem}: fixed-cover declaration missing`);
  if(!s.includes('fetchpriority="high"'))fail(`${stem}: LCP fetch priority missing`);
  if(!s.includes('decoding="async"'))fail(`${stem}: async image decoding missing`);
}
const checker=fs.readFileSync(new URL('../scripts/check-clean-frontend.py',import.meta.url),'utf8');
if(!checker.includes("'https', 'mailto', 'tel'"))fail('tel scheme is not accepted');
if(!checker.includes("integration_aware_pages = {'home.js', 'creator-hub.js', 'service.js'}"))fail('integration-aware controller allowlist missing');
if(!checker.includes("document_outputs = {"))fail('document output preservation missing');
if(!checker.includes('blocking classic script'))fail('blocking classic script check missing');
if(!checker.includes('remote Google font dependency'))fail('remote font performance check missing');

const workflow=fs.readFileSync(new URL('../.github/workflows/clean-frontend-sync.yml',import.meta.url),'utf8');
if(workflow.includes('continue-on-error: true'))fail('frontend checker is still soft-fail');
if(!workflow.includes('Check clean frontend accessibility and structure'))fail('hard accessibility check step missing');

console.log('PASS: Step 8.2 accessibility and performance source contracts');
