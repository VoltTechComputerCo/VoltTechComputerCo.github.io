
import fs from 'node:fs';
const fail=m=>{throw new Error(m)};
const js=fs.readFileSync(new URL('../assets/js/pages/customer-records.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../assets/css/pages/customer-records.css',import.meta.url),'utf8');
if(js.includes("document-email.js"))fail('dead document-email import remains');
if(js.includes('data-email-kind'))fail('dead email button markup remains');
if(js.includes('Email copy'))fail('dead Email copy label remains');
if(js.includes('initEmailButtons'))fail('dead email handler remains');
if(css.includes('data-email-kind'))fail('temporary email-hide CSS remains');
if(!js.includes('quote.html?id='))fail('quote document link missing');
if(!js.includes('build-document.html?id='))fail('build document link missing');
if(!js.includes('invoice.html?id='))fail('invoice document link missing');
if(!js.includes('receipt.html?id='))fail('receipt document link missing');
if(!js.includes('order-document.html?id='))fail('order document link missing');
if(!js.includes('service-record.html?id='))fail('service document link missing');
console.log('PASS: Step 7 document/support closeout contracts');
