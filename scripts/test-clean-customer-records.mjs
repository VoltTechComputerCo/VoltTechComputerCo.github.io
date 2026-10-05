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
  if(!html.includes('assets/css/v4/pages.css'))throw new Error(`${name}: missing V4 records css`);
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
if(fs.existsSync(path.join(root,'scripts/__pycache__')))throw new Error('Python cache directory returned after repository cleanup');
const ignore=read('.gitignore');
if(!ignore.includes('__pycache__/')||!ignore.includes('*.py[cod]'))throw new Error('Python cache ignore contract missing');
console.log('PASS: clean customer records pages, auth boundary, quote contract and repository cache cleanup');