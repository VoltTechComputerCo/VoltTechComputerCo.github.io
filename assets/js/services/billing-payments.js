import {escapeHtml as esc,money} from './billing-document.js?v=20261026-payment';
export function paymentSummary(doc,payments=[]){
 const paid=Math.round(payments.filter(p=>!p.voided_at).reduce((n,p)=>n+Number(p.amount),0)*100)/100;
 const balance=Math.round((Number(doc.total)-paid)*100)/100;
 return {paid,balance,status:paid<=0?'Unpaid':balance<0?'Credit balance':balance===0?'Paid':'Partially paid'};
}
export function paymentConfirmationText(doc,payments){
 const s=paymentSummary(doc,payments),active=payments.filter(p=>!p.voided_at);
 return `Dear ${doc.customer_details?.full_name||'Customer'},\n\nThank you. VoltTech confirms receipt of the following payment(s) for invoice ${doc.document_number}:\n\n${active.map(p=>`${p.paid_on}: ${money(p.amount)} · ${p.method}${p.reference?' · Reference: '+p.reference:''}`).join('\n')}\n\nInvoice total: ${money(doc.total)}\nPayments received: ${money(s.paid)}\n${s.balance<0?'Credit balance':'Balance outstanding'}: ${money(Math.abs(s.balance))}\nStatus: ${s.status}\n\nThis confirms payment received; order fulfilment is confirmed separately.\n\nKind regards,\nVoltTech Computer Co.\ninfo@volttechcomputerco.co.za\n+27 61 843 5775`;
}
export function paymentConfirmationHtml(doc,payments){
 return `<article class="bill-sheet"><header class="bill-brand"><div><img src="assets/brand/volttech-logo.webp" alt="VoltTech Computer Co."></div><div><h1>PAYMENT RECEIPT</h1><strong>${esc(doc.document_number)}</strong></div></header><section class="bill-note">${esc(paymentConfirmationText(doc,payments)).replaceAll('\n','<br>')}</section></article>`;
}
