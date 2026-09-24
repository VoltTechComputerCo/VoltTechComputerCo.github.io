import { isAccountInspection } from '../services/account-session.js';
import { requireDocumentCustomer,loadDocument,customerQuoteAction,money,money0,date,cap,safeFile,buildRef,orderRef,proformaRef,serviceRef,quoteExpired } from '../services/customer-documents.js';
import { setDocumentPrintName, printDocument } from '../services/document-print.js';

const q=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const kind=q('[data-document-kind]')?.dataset.documentKind||'';
const surface=q('#documentSurface'),status=q('#documentStatus');
let client=null,user=null,current=null,personalExport=null,pendingAction='';

function brand(title,ref,state,body){
  return `<article class="document-sheet"><div class="document-top"><div class="document-brand"><img src="logo-badge.png" alt=""><div><h1>VoltTech Computer Co.</h1><p>PC &amp; technology services · Pretoria, Gauteng<br>volttechcomputerco@gmail.com · +27 61 843 5775</p></div></div><div class="document-title"><h2>${esc(title)}</h2><div class="document-ref">${esc(ref||'')}</div>${state?`<p class="document-state">${esc(state)}</p>`:''}</div></div>${body}</article>`;
}
const block=(title,html)=>`<div class="document-block"><strong>${esc(title)}</strong><p>${html}</p></div>`;
const row=(label,value,grand=false)=>`<div class="document-row${grand?' document-grand':''}"><span>${esc(label)}</span><b>${esc(value)}</b></div>`;
function table(headers,rows){return `<div class="document-table-wrap"><table class="document-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`}
function filename(value){setDocumentPrintName(value);q('#pdfFilename').hidden=false}
function note(text,warn=false){return `<div class="document-note${warn?' document-note-warning':''}">${text}</div>`}

function renderQuote(data){
  const r=data.record,p=data.profile,expired=quoteExpired(r),state=expired?'Expired':cap(r.status);
  const customer=[p?.full_name||user?.user_metadata?.full_name||user?.user_metadata?.name||'Customer',p?.company_name,p?.billing_email||user?.email,p?.phone,p?.suburb].filter(Boolean).map(esc).join('<br>');
  const items=[...(r.quote_items||[])].sort((a,b)=>a.position-b.position).map(i=>`<tr><td>${esc(i.description)}</td><td>${esc(i.quantity)}</td><td>${esc(money(i.line_total))}</td></tr>`);
  const totals=row('Subtotal',money(r.subtotal))+(r.delivery_fee?row('Delivery',money(r.delivery_fee)):'')+(r.discount_total?row('Discount',`− ${money(r.discount_total)}`):'')+row('Total',money(r.total),true);
  filename(`VoltTech_Quotation_${safeFile(r.quote_number)}`);
  surface.innerHTML=brand('Quotation',r.quote_number,state,`<div class="document-grid">${block('Prepared for',customer)}${block('Quote details',`${esc(r.title||'VoltTech quotation')}<br>Issued: ${esc(date(r.created_at))}<br>Valid until: ${esc(date(r.valid_until))}`)}</div>${table(['Description','Qty','Total'],items)}<div class="document-totals">${totals}</div>${r.customer_note?note(esc(r.customer_note)):''}${expired?note('This quotation has passed its validity date. Contact VoltTech if you need a current quotation.',true):''}${note(`Quote Terms version ${esc(r.terms_version||'2026-09')}. This document is a quotation, not an invoice or proof of payment.`)}`);
  renderQuoteActions(r,expired);
}
function renderQuoteActions(r,expired){
  const panel=q('#quoteActions');if(!panel)return;
  panel.hidden=false;
  if(expired){panel.innerHTML='<h2>Quote expired</h2><p>This quotation is no longer actionable. Contact VoltTech for an updated quotation.</p>';return}
  if(['sent','viewed'].includes(r.status)){panel.innerHTML=`<h2>Review this quotation</h2><p>Accepting approves the quoted scope and displayed total. No payment is taken at this step.</p><div class="document-decision-total">${esc(money(r.total))}</div><div class="actions"><button class="button" type="button" data-quote-action="accepted">Accept quote</button><button class="button button-secondary" type="button" data-quote-action="declined">Decline quote</button></div><p id="quoteActionStatus" class="document-status" role="status"></p>`;panel.querySelectorAll('[data-quote-action]').forEach(btn=>btn.addEventListener('click',()=>openQuoteDecision(btn.dataset.quoteAction)));return}
  if(r.status==='accepted'){panel.innerHTML='<h2>Quote accepted</h2><p>Your decision is recorded. Payment is not implied by quote acceptance.</p>';return}
  if(r.status==='declined'){panel.innerHTML='<h2>Quote declined</h2><p>Your decision is recorded. Contact VoltTech if you want the quotation revised or reissued.</p>';return}
  panel.hidden=true;
}
function renderInvoice(data){
  const r=data.record,items=[...(r.invoice_items||[])].sort((a,b)=>a.position-b.position).map(i=>`<tr><td>${esc(i.description)}</td><td>${esc(i.quantity)}</td><td>${esc(money(i.unit_price))}</td><td>${esc(money(i.line_total))}</td></tr>`);
  filename(`VoltTech_Invoice_${safeFile(r.invoice_number)}`);
  const totals=row('Subtotal',money(r.subtotal))+(r.delivery_fee?row('Delivery',money(r.delivery_fee)):'')+(r.discount_total?row('Discount',`− ${money(r.discount_total)}`):'')+(r.tax_total?row('Tax',money(r.tax_total)):'')+row('Total',money(r.total),true);
  const details=`Issued: ${esc(date(r.issued_at))}${r.due_at?`<br>Due: ${esc(date(r.due_at))}`:''}${r.paid_at?`<br>Paid: ${esc(date(r.paid_at))}`:''}${data.quoteNumber?`<br>Related quote: ${esc(data.quoteNumber)}`:''}`;
  const customer=[r.customer_name||'Customer',r.customer_company,r.customer_email,r.customer_suburb].filter(Boolean).map(esc).join('<br>');
  surface.innerHTML=brand('Invoice',r.invoice_number,cap(r.status),`<div class="document-grid">${block('Billed to',customer)}${block('Invoice details',details)}</div>${table(['Description','Qty','Unit','Total'],items)}<div class="document-totals">${totals}</div>${r.status==='paid'?`<div class="actions"><a class="button button-secondary" href="receipt.html?id=${encodeURIComponent(r.id)}">Open payment receipt</a></div>`:''}${note(`${r.vat_registered?'Tax treatment is shown above.':'VoltTech is not presenting this document as a VAT tax invoice.'} Online payment is not exposed from this document view until the production payment path is certified.`)}`);
}
function renderProforma(r){const ref=proformaRef(r);filename(`VoltTech_Proforma_${safeFile(ref)}`);surface.innerHTML=brand('Proforma',ref,'Proforma',`<div class="document-grid">${block('Created',esc(date(r.created_at)))}${block('Total',esc(money(r.total)))}</div>${note('A proforma is not proof of payment. Refer to the final invoice or receipt for the completed transaction.')}`)}
function renderReceipt(r){if(String(r.status)!=='paid'){surface.innerHTML='<div class="notice notice-warning">A paid receipt is not available for this invoice yet.</div>';q('#printButton').disabled=true;return}filename(`VoltTech_Receipt_${safeFile(r.invoice_number)}`);surface.innerHTML=brand('Receipt',r.invoice_number,'Paid',`<div class="document-grid">${block('Received from',`${esc(r.customer_name||'Customer')}<br>${esc(r.customer_email||'')}`)}${block('Payment',`Paid: ${esc(date(r.paid_at))}<br>Invoice issued: ${esc(date(r.issued_at))}`)}</div><div class="document-totals">${row('Amount received',money(r.total),true)}</div>${note(`This receipt records payment against invoice ${esc(r.invoice_number)}.`)}`)}
function renderOrder(r){const ref=orderRef(r),items=(r.order_items||[]).map(i=>`<tr><td>${esc(i.product_name||i.description||'Item')}</td><td>${esc(i.quantity||1)}</td><td>${esc(money(i.line_total||0))}</td></tr>`);filename(`VoltTech_Order_${safeFile(ref)}`);surface.innerHTML=brand('Order',ref,cap(r.status),`<div class="document-grid">${block('Placed',esc(date(r.placed_at||r.created_at)))}${block('Payment status',esc(cap(r.payment_status||'—')))}</div>${table(['Item','Qty','Total'],items)}<div class="document-totals">${row('Order total',money(r.total),true)}</div>`)}
function buildStatus(b,quote){if(quote){const s=String(quote.status||'').toLowerCase();if(s==='accepted')return'Formal quote accepted';if(s==='declined')return'Formal quote declined';if(['sent','viewed'].includes(s))return'Formal quote issued';if(s==='draft')return'Formal quote prepared';return`Formal quote ${s||'linked'}`}if(b.status==='quote_requested')return'Quote review requested';if(b.status==='quoted')return'Formal quote issued';if(b.status==='archived')return'Archived configuration';return'Saved configuration'}
function renderBuild(data){const b=data.record,quote=data.quote,ref=buildRef(b.id),items=b.build_data?.items||[],quoteLine=quote?`<a href="quote.html?id=${encodeURIComponent(quote.id)}">${esc(quote.quote_number)}</a> · ${esc(buildStatus(b,quote))}`:'Not issued yet';filename(`VoltTech_PC_Build_Spec_${safeFile(ref)}`);surface.innerHTML=brand('Build Spec',ref,buildStatus(b,quote),`<div class="document-grid">${block('Configuration',`${esc(b.name||'Custom PC')}<br>${items.length} selected part${items.length===1?'':'s'}<br>Compatibility: ${esc(b.compatibility_status||'review')}`)}${block('Estimate',`${esc(money0(b.estimated_total))}${b.estimated_power_watts?`<br>${esc(b.estimated_power_watts)} W estimated system load`:''}`)}${block('Build reference',esc(ref))}${block('Formal quotation',quoteLine)}</div>${table(['Component','Qty','Estimated price'],items.map(i=>`<tr><td>${esc(i.name)}</td><td>${esc(i.quantity||1)}</td><td>${esc(money0((i.unit_price||0)*(i.quantity||1)))}</td></tr>`))}${note(`Generated ${esc(date(b.updated_at))}. This is a PC build specification, not a quotation or invoice. Builder figures remain estimates until VoltTech issues a formal quotation.`)}`)}
function renderService(r){const ref=serviceRef(r),updates=[...(r.service_job_updates||[])].sort((a,b)=>new Date(a.created_at)-new Date(b.created_at));filename(`VoltTech_Service_Record_${safeFile(ref)}`);surface.innerHTML=brand('Service Job',ref,cap(r.status),`<div class="document-grid">${block(r.title||'Service',esc(r.device_name||''))}${block('Opened',`${esc(date(r.opened_at))}${r.completed_at?`<br>Completed: ${esc(date(r.completed_at))}`:''}`)}</div><div class="document-totals">${row('Quoted',r.amount_quoted==null?'—':money(r.amount_quoted))}${row('Paid',money(r.amount_paid||0))}</div><h3 class="document-section-title">Progress</h3><div class="document-parts">${updates.length?updates.map(u=>`<div class="document-part"><span>${esc(date(u.created_at))} · ${esc(u.title||u.status)}</span><b>${esc(u.note||'')}</b></div>`).join(''):'<p class="micro">No progress updates recorded.</p>'}</div>${note('This record summarises the service job stored in the customer account. A separate invoice or quotation remains the controlling commercial document where applicable.')}`)}
function renderPersonal(data){
  personalExport=data;const stamp=new Date().toISOString().slice(0,10),ref=`DATA-${stamp}`;
  filename(`VoltTech_Personal_Data_Report_${stamp}_${String(user.id).slice(0,8).toUpperCase()}`);
  const sections=Object.entries(data.volttech_data||{}).map(([key,value])=>`<h3 class="document-section-title">${esc(key.replace(/_/g,' '))}</h3><pre class="document-json">${esc(JSON.stringify(value??null,null,2))}</pre>`).join('');
  surface.innerHTML=brand('Data Report',ref,'Personal data export',`<div class="document-grid">${block('Account',`ID: ${esc(user.id)}<br>Email: ${esc(user.email||'')}<br>Created: ${esc(user.created_at||'—')}`)}${block('Generated',esc(new Date().toLocaleString('en-ZA')))}</div>${sections}${note('This self-service report is intended to make access easier. It does not limit formal access, correction or deletion rights under applicable law.')}`);
}

function renderPreview(){
  const preview=q('#documentPreview');if(preview){preview.hidden=false;preview.innerHTML='<strong>Read-only layout inspection.</strong> No account session or customer data is loaded on this preview host.'}
  q('#printButton').disabled=true;
  const label={quote:'Quotation',invoice:'Invoice',proforma:'Proforma',receipt:'Receipt',order:'Order',build:'Build Spec',service:'Service Job','personal-data':'Data Report'}[kind]||'Document';
  surface.innerHTML=brand(label,'PREVIEW REFERENCE','Preview',`<div class="document-grid">${block('Customer','Customer information appears here.')}${block('Document details','Dates, status and references appear here.')}</div>${note('Preview only — no real customer, pricing, transaction or service data is loaded.')}`);
}
function openQuoteDecision(action){pendingAction=action;const dialog=q('#quoteDecisionDialog'),accept=action==='accepted';q('#quoteDecisionTitle').textContent=accept?'Accept this quotation?':'Decline this quotation?';q('#quoteDecisionBody').textContent=accept?'You are approving the quoted scope and displayed total. No payment is taken at this step.':'This records the quotation as declined. No payment will be taken.';q('#quoteDecisionConfirm').textContent=accept?'Accept quote':'Decline quote';dialog?.showModal()}
async function confirmQuoteDecision(){if(!pendingAction||!client||!current?.record)return;const action=pendingAction;pendingAction='';q('#quoteDecisionDialog')?.close();const actionStatus=q('#quoteActionStatus');if(actionStatus)actionStatus.textContent='Updating…';const result=await customerQuoteAction(client,current.record.id,action);if(result.error){if(actionStatus)actionStatus.textContent=result.error.message;return}await loadProduction()}
function downloadPersonalJson(){if(!personalExport||!user)return;const blob=new Blob([JSON.stringify(personalExport,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`VoltTech_Personal_Data_${new Date().toISOString().slice(0,10)}_${String(user.id).slice(0,8).toUpperCase()}.json`;a.click();const href=a.href;setTimeout(()=>URL.revokeObjectURL(href),1000)}
async function loadProduction(){
  status.textContent='Loading document…';const id=new URLSearchParams(location.search).get('id');
  if(kind!=='personal-data'&&!id){surface.innerHTML='<div class="notice notice-warning">Document reference not specified.</div>';status.textContent='';return}
  const result=await loadDocument(client,user,kind,id);
  if(result.error||!result.data){surface.innerHTML='<div class="notice notice-warning">This document could not be loaded.</div>';status.textContent='';return}
  current=result.data;status.textContent='';
  if(kind==='quote')renderQuote(result.data);
  if(kind==='invoice')renderInvoice(result.data);
  if(kind==='proforma')renderProforma(result.data);
  if(kind==='receipt')renderReceipt(result.data);
  if(kind==='order')renderOrder(result.data);
  if(kind==='build')renderBuild(result.data);
  if(kind==='service')renderService(result.data);
  if(kind==='personal-data')renderPersonal(result.data);
}
async function start(){
  q('#printButton')?.addEventListener('click',printDocument);
  q('#downloadJson')?.addEventListener('click',downloadPersonalJson);
  q('#quoteDecisionCancel')?.addEventListener('click',()=>{pendingAction='';q('#quoteDecisionDialog')?.close()});
  q('#quoteDecisionConfirm')?.addEventListener('click',confirmQuoteDecision);
  if(isAccountInspection()){renderPreview();return}
  const auth=await requireDocumentCustomer();if(!auth)return;client=auth.client;user=auth.user;await loadProduction();
}
start().catch(error=>{console.error(error);status.textContent='This document view could not be loaded.'});
