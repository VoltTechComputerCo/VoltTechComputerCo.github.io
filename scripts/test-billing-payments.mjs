import assert from 'node:assert/strict';
import {paymentSummary,paymentConfirmationHtml,paymentConfirmationText} from '../assets/js/services/billing-payments.js';
import {billingDocumentHtml} from '../assets/js/services/billing-document.js';
const doc={kind:'invoice',status:'issued',document_number:'VT-INV-TEST',total:100,customer_details:{full_name:'<script>Customer</script>'},internal_delivery:{supplier:'SECRET'},internal_financials:{markup:'SECRET'}};
const payments=[{amount:40,paid_on:'2026-10-26',method:'EFT',reference:'<bad>'},{amount:60,paid_on:'2026-10-26',method:'Cash'}];
assert.equal(paymentSummary(doc,[]).status,'Unpaid');assert.equal(paymentSummary(doc,payments.slice(0,1)).status,'Partially paid');assert.equal(paymentSummary(doc,payments).status,'Paid');assert.equal(paymentSummary({...doc,total:90},payments).status,'Credit balance');assert.equal(paymentSummary(doc,[{...payments[0],voided_at:'now'}]).paid,0);
const receipt=paymentConfirmationHtml(doc,payments);assert.ok(receipt.includes('&lt;script&gt;'));assert.ok(receipt.includes('&lt;bad&gt;'));assert.ok(!receipt.includes('SECRET'));assert.ok(paymentConfirmationText(doc,payments).includes('Balance outstanding: R'));
const html=billingDocumentHtml({...doc,paid_total:100},[]);assert.ok(html.includes('PAID'));assert.ok(html.includes('Balance outstanding'));assert.ok(!html.includes('This invoice is not proof of payment'));assert.ok(!html.includes('SECRET'));
console.log('PASS payment totals, partial/full/credit statuses, void handling and customer receipt privacy');
