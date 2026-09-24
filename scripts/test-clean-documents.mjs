import fs from 'node:fs';
const routes=['quote.html','invoice.html','proforma.html','receipt.html','order-document.html','build-document.html','service-record.html','personal-data.html'];
const fail=m=>{throw new Error(m)};
for(const file of routes){
 const s=fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
 if((s.match(/<main\b/g)||[]).length!==1)fail(`${file}: one main required`);
 if((s.match(/class="site-header"/g)||[]).length!==1)fail(`${file}: clean header missing`);
 if((s.match(/class="site-footer"/g)||[]).length!==1)fail(`${file}: clean footer missing`);
 if(!s.includes('assets/css/pages/document.css'))fail(`${file}: clean document CSS missing`);
 if(!s.includes('assets/js/pages/customer-document.js'))fail(`${file}: clean controller missing`);
 if(!s.includes('name="robots" content="noindex, nofollow"'))fail(`${file}: robots changed`);
 if(/cdn\.jsdelivr\.net\/npm\/@supabase/.test(s))fail(`${file}: direct Supabase CDN remains`);
 if(/href=["'](?:document\.css|document-phase4\.css|phase6-customer-provenance\.css|quote-decision\.css)/.test(s))fail(`${file}: legacy document CSS remains`);
 if(/quote\.js|invoice\.js|proforma\.js|receipt\.js|order-document\.js|build-document\.js|service-record\.js|personal-data\.js|document-email\.js|document-print\.js/.test(s))fail(`${file}: legacy document JS remains`);
 if(/onclick=/.test(s))fail(`${file}: inline handler remains`);
 if(/Email me a copy|Pay securely — TEST/.test(s))fail(`${file}: unavailable action exposed`);
}
const service=fs.readFileSync(new URL('../assets/js/services/customer-documents.js',import.meta.url),'utf8');
if(!service.includes("customer_quote_action"))fail('quote action RPC missing');
if(!service.includes("collectPersonalData"))fail('personal data service reuse missing');
const controller=fs.readFileSync(new URL('../assets/js/pages/customer-document.js',import.meta.url),'utf8');
if(controller.includes('create-yoco-checkout'))fail('test checkout exposed in clean document controller');
if(controller.includes('send-document-email'))fail('missing email backend exposed in controller');
if(!controller.includes('isAccountInspection'))fail('safe preview contract missing');
const recordCss=fs.readFileSync(new URL('../assets/css/pages/customer-records.css',import.meta.url),'utf8');
if(!recordCss.includes('[data-email-kind][data-email-id]{display:none!important}'))fail('dead record-list email actions are still visible');
console.log('PASS: clean printable customer document contracts');
