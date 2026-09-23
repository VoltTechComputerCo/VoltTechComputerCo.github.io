import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const pages=['activity','builds','quotes','documents'];
const bad=['customer-shell.css','portal-phase4.css','portal-shell.js','activity.js?v=','builds.js?v=','quotes.js?v=','documents.js?v=','https://fonts.googleapis.com','https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'];
for(const name of pages){
  const html=read(`${name}.html`);
  if(!html.includes('data-vt-shell="clean"'))throw new Error(`${name}: missing clean shell`);
  if(!html.includes('assets/css/pages/customer-records.css'))throw new Error(`${name}: missing records css`);
  if(!html.includes('assets/js/pages/customer-records.js'))throw new Error(`${name}: missing records controller`);
  if(!html.includes('supabase-config.js'))throw new Error(`${name}: missing configured client bootstrap`);
  for(const legacy of bad)if(html.includes(legacy))throw new Error(`${name}: legacy dependency ${legacy}`);
  const cfg=JSON.parse(read(`src/pages/${name}.json`));
  if(cfg.output!==`${name}.html`)throw new Error(`${name}: source output mismatch`);
}
const controller=read('assets/js/pages/customer-records.js');
if(/\b(supabase|fetch|localStorage|sessionStorage|gtag)\b/.test(controller))throw new Error('page controller has direct integration');
const service=read('assets/js/services/customer-records.js');
for(const contract of ['customer_quote_action','snapshot_quote','saved_builds','invoices','service_jobs'])if(!service.includes(contract))throw new Error(`missing service contract ${contract}`);
if(!service.includes("status in ('sent','viewed')") && !service.includes('effectiveQuoteStatus')){
  // The server RPC owns the write transition; client must at least preserve effective expiry handling.
  throw new Error('quote state handling missing');
}
const manifest=JSON.parse(read('docs/clean-rebuild/step-5.2-manifest.json'));
for(const d of ['scripts/__pycache__/check-clean-frontend.cpython-313.pyc','scripts/__pycache__/Placeholder.txt'])if(!manifest.delete.includes(d))throw new Error(`cleanup deletion missing: ${d}`);
const corrected=JSON.parse(read('docs/clean-rebuild/step-5.1-manifest.json'));
if(Object.keys(corrected.sha256).some(p=>p.includes('__pycache__')))throw new Error('corrected 5.1 manifest still contains pycache');
console.log('PASS: clean customer records pages, auth boundary, quote contract and Step 5.1 cache cleanup');
