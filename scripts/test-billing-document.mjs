import assert from 'node:assert/strict';
import {billingDocumentHtml,totals} from '../assets/js/services/billing-document.js';
const items=[{description:'DeepCool AK620 White',sku:'R-AK620-WHNNMT-G-1',quantity:2,unit_price:1152.09,supplier:'SECRET_SUPPLIER',supplier_cost:900,markup:20,source_metadata:{cost:900}}];
assert.deepEqual(totals(items,99.95,10),{subtotal:2304.18,delivery_fee:99.95,discount_total:10,total:2394.13});
const doc={kind:'invoice',status:'issued',document_number:'VT-INV-2026-TEST',customer_details:{full_name:'QA Customer',billing_email:'qa@example.invalid'},title:'Cooling upgrade',...totals(items,99.95,10),supplier:'SECRET_SUPPLIER',internal_note:'SECRET_NOTE',source_metadata:{markup:20}};
const html=billingDocumentHtml(doc,items);assert.ok(html.includes('R-AK620-WHNNMT-G-1'));assert.ok(html.includes('VT-INV-2026-TEST'));assert.ok(!/SECRET|supplier|supplier_cost|markup|source_metadata/.test(html));
const malicious=billingDocumentHtml({...doc,customer_details:{full_name:'<img src=x onerror=alert(1)>'}},[]);assert.ok(malicious.includes('&lt;img'));assert.ok(!malicious.includes('<img src=x'));
assert.ok(billingDocumentHtml({...doc,status:'draft'},[]).includes('Draft for review'));assert.ok(!billingDocumentHtml({...doc,status:'draft'},[]).includes('1055896791'));
console.log('PASS: currency rounding, automatic SKU rendering, explicit customer-only fields, HTML escaping and draft payment safeguards');
