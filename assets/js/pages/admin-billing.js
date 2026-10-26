import {deliveryGroups,deliveryTotal} from '../services/billing-delivery.js?v=20261026';
import {localSearch,searchCatalogue,normalizeSearch} from '../services/product-search.js?v=20261026-search2';
import {billingDocumentHtml,totals,money,escapeHtml as esc} from '../services/billing-document.js?v=20261026-delivery';
const q=s=>document.querySelector(s),client=supabase.createClient(VOLTTECH_SUPABASE.url,VOLTTECH_SUPABASE.publishableKey);
let contacts=[],accounts=[],products=[],documents=[],customer=null,lines=[],current=null,busy=false,requestKey=crypto.randomUUID(),searchVersion=0,searchTimer,productMatches=[],shown=12,activeOption=-1;
let sourcing=[],sourcingKey='',sourcingVersion=0,autoFree=new Set(),deliverySelections={},deliveryFees={},deliveryPlan=null,deliveryApplied=false;
const status=text=>{q('#billingStatus').textContent=text;};
function dateAfter(days){const d=new Date();d.setDate(d.getDate()+days);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function customerRows(){return [...contacts,...accounts.filter(a=>!contacts.some(c=>c.account_id===a.id||c.billing_email&&c.billing_email.toLowerCase()===a.billing_email?.toLowerCase())).map(a=>({...a,account_id:a.id,id:'account:'+a.id}))];}
function customerPicker(clearSelection=true){
 const term=normalizeSearch(q('#billingCustomerSearch').value);if(clearSelection)customer=null;preview();
 const rows=customerRows().filter(c=>normalizeSearch([c.full_name,c.billing_email,c.phone,c.company_name].join(' ')).includes(term));
 const box=q('#billingCustomerResults');box.replaceChildren();
 for(const row of rows.slice(0,25)){
  const b=document.createElement('button');b.type='button';b.textContent=row.full_name||row.billing_email||'Customer';
  const small=document.createElement('small');small.textContent=[row.billing_email,row.phone,row.id.startsWith('account:')?'Registered account':'Customer contact'].filter(Boolean).join(' · ');b.append(small);
  b.onclick=async()=>{try{let selected=row;if(row.id.startsWith('account:')){const r=await client.rpc('admin_save_billing_customer',{p_data:{account_id:row.account_id}});if(r.error)throw r.error;selected=r.data;contacts=contacts.filter(c=>c.id!==selected.id).concat(selected);}selectCustomer(selected);}catch(e){status(e.message);}};box.append(b);
 }
 if(!rows.length)box.textContent='No customer found. Use “Create customer” above.';
 box.hidden=false;if(clearSelection)q('#billingSelectedCustomer').textContent='Select a customer from the results.';
}
function selectCustomer(row){customer=row;q('#billingCustomerSearch').value=row.full_name||row.billing_email;q('#billingSelectedCustomer').textContent=[row.full_name,row.billing_email,row.phone,row.address].filter(Boolean).join(' · ');q('#billingCustomerResults').hidden=true;preview();}
function inputs(){return {internal_delivery:deliveryApplied?deliveryPlan:{},kind:q('#billingKind').value,title:q('#billingTitle').value,customer_details:customer||{},valid_until:q('#billingValid').value,due_date:q('#billingDue').value,customer_note:q('#billingNote').value,...totals(lines,q('#billingDelivery').value,q('#billingDiscount').value)};}
function preview(){
 const values=inputs();q('#billingTotal').textContent=money(values.total);
 const doc=current?.status==='issued'?current:{...values,status:'draft',created_at:current?.created_at,document_number:current?.document_number};
 q('#billingDocument').innerHTML=billingDocumentHtml(doc,lines);
 q('#billingIssue').textContent=values.kind==='invoice'?'Create invoice':'Issue quotation';
 q('#billingCopyInvoice').hidden=!(current?.kind==='quote'&&current?.status==='issued');
}
function renderLines(){
 q('#billingItems').innerHTML=lines.map((i,index)=>`<article class="billing-line" data-line="${index}">${i.product_id?`<h3>${esc(i.description)}</h3><small>SKU: ${esc(i.sku||'Not supplied')} · ${i.stock_qty==null?'Stock confirmation needed':Number(i.stock_qty)>0?'In stock: '+esc(i.stock_qty):'Out of stock'}</small>`:`<label>Description<input data-field="description" value="${esc(i.description)}" required maxlength="2000"></label><label>Type<select data-field="item_type"><option value="labour" ${i.item_type==='labour'?'selected':''}>Labour</option><option value="service" ${i.item_type==='service'?'selected':''}>Service</option></select></label>`}<div class="line-fields"><label>Quantity<input data-field="quantity" type="number" min="0.01" max="10000" step="0.01" value="${esc(i.quantity)}" required></label><label>Selling price (R)<input data-field="unit_price" type="number" min="0" step="0.01" value="${esc(i.unit_price??'')}" required></label><button data-remove-line="${index}" type="button" aria-label="Remove ${esc(i.description||'service line')}">Remove</button></div></article>`).join('');
 q('#billingItems').querySelectorAll('[data-field]').forEach(input=>input.addEventListener('input',()=>{const row=lines[Number(input.closest('[data-line]').dataset.line)],key=input.dataset.field;row[key]=['quantity','unit_price'].includes(key)?input.value===''?null:Number(input.value):input.value;if(key==='quantity'){deliveryApplied=false;renderDelivery();}preview();}));
 q('#billingItems').querySelectorAll('[data-remove-line]').forEach(b=>b.onclick=()=>{lines.splice(Number(b.dataset.removeLine),1);deliveryApplied=false;renderLines();});preview();refreshDelivery();
 if(current?.status==='issued')setEditorLocked(true);
}
function addProduct(p){
 deliveryApplied=false;
 if(current?.status==='issued')return;
 const existing=lines.find(i=>i.product_id===p.id);if(existing)existing.quantity=Number(existing.quantity)+1;
 else lines.push({product_id:p.id,description:p.name,sku:p.identifiers?.mpn||p.identifiers?.sku||p.model||'',item_type:'product',quantity:1,unit_price:p.retail_price==null?null:Number(p.retail_price),stock_qty:p.stock_qty});
 searchVersion++;q('#billingProductSearch').value='';closeProductResults();renderLines();status(`${p.name} added. Check the quantity and selling price.`);
}
function closeProductResults(){q('#billingProductResults').hidden=true;q('#billingMoreProducts').hidden=true;q('#billingProductSearch').setAttribute('aria-expanded','false');q('#billingProductSearch').removeAttribute('aria-activedescendant');activeOption=-1;}
function showProductResults(){
 const box=q('#billingProductResults');box.replaceChildren();activeOption=-1;
 for(const p of productMatches.slice(0,shown)){
  const b=document.createElement('button');b.type='button';b.id='billing-match-'+box.children.length;b.setAttribute('role','option');b.setAttribute('aria-selected','false');b.textContent=p.name;
  const small=document.createElement('small');small.textContent=[p.identifiers?.mpn||p.identifiers?.sku||p.model,p.retail_price==null?'Enter selling price after adding':money(p.retail_price),p.stock_qty==null?'Stock unknown':p.stock_qty>0?'In stock':'Out of stock'].filter(Boolean).join(' · ');b.append(small);b.onclick=()=>addProduct(p);box.append(b);
 }
 if(!productMatches.length)box.textContent='No matching products. Try a brand, model or SKU.';
 box.hidden=false;q('#billingProductSearch').setAttribute('aria-expanded','true');q('#billingMoreProducts').hidden=shown>=productMatches.length;
 q('#billingProductCount').textContent=`${productMatches.length} matches across ${products.length} catalogue products. Click a product to add it.`;
}
async function runProductSearch(){
 const term=q('#billingProductSearch').value.trim(),version=++searchVersion;
 if(term.length<2){closeProductResults();return;}
 const local=localSearch(products,term);
 const apply=matches=>{if(version!==searchVersion)return;productMatches=products.filter(p=>matches.has(p.id)).sort((a,b)=>(matches.get(b.id)||0)-(matches.get(a.id)||0)||Number(b.stock_qty>0)-Number(a.stock_qty>0)||a.name.localeCompare(b.name));shown=12;showProductResults();};
 apply(local);
 try{const remote=await searchCatalogue(term);const matches=new Map([...local,...remote.matches.map(r=>[r.id,Number(r.score)||0])]);apply(matches);}catch{/* Same local brand typo engine remains available. */}
}
async function loadCatalogue(){
 try{
  const first=await client.rpc('admin_billing_catalogue',{p_offset:0});if(first.error)throw first.error;
  const rows=[...first.data.products];const pages=Array.from({length:Math.max(0,Math.ceil(first.data.total/1000)-1)},(_,i)=>(i+1)*1000);
  for(let i=0;i<pages.length;i+=3){const results=await Promise.all(pages.slice(i,i+3).map(offset=>client.rpc('admin_billing_catalogue',{p_offset:offset})));for(const result of results){if(result.error)throw result.error;rows.push(...result.data.products);}}
  if(new Set(rows.map(p=>p.id)).size!==Number(first.data.total))throw Error('Catalogue count changed during loading. Reload to search the complete catalogue.');
  products=rows;q('#billingProductCount').textContent=`${products.length} catalogue products ready. Brand spelling mistakes are supported.`;q('#billingProductSearch').disabled=false;
 }catch(e){q('#billingProductCount').textContent=e.message+' Use New document or reload to retry catalogue loading.';}
}
async function refreshDelivery(){
 const ids=[...new Set(lines.map(i=>i.product_id).filter(Boolean))].sort(),key=ids.join('|');
 if(key===sourcingKey){renderDelivery();return;}
 sourcingKey=key;const version=++sourcingVersion;
 if(!ids.length){sourcing=[];renderDelivery();return;}
 q('#billingSupplierDelivery').textContent='Checking supplier orders…';
 try{const result=await client.rpc('admin_billing_sourcing',{p_product_ids:ids});if(version!==sourcingVersion)return;if(result.error)throw result.error;sourcing=result.data||[];renderDelivery();}catch(e){if(version===sourcingVersion){sourcingKey='';q('#billingSupplierDelivery').textContent='Supplier costs unavailable: '+e.message;}}
}
function renderDelivery(){
 const groups=deliveryGroups(lines,sourcing,deliverySelections),box=q('#billingSupplierDelivery');
 if(!groups.length){box.textContent='Add products to check supplier delivery.';return;}
 box.innerHTML=groups.map(g=>{
  if(g.free&&deliveryFees[g.id]==null){deliveryFees[g.id]=0;autoFree.add(g.id);}else if(!g.free&&autoFree.has(g.id)){delete deliveryFees[g.id];autoFree.delete(g.id);}
  return `<article class="billing-supplier"><h3>${esc(g.name)}</h3><p>Purchase subtotal excl. VAT: ${g.known?esc(money(g.costExcl)):'Unknown — confirm sourcing'}</p><p>${g.id==='syntech'?(g.free?'Qualifies for standard free delivery; add any applicable surcharges below.':'Below the R2,500 excl. VAT threshold: courier fee applies. Other suppliers do not count towards this threshold.'):'Enter the actual courier fee for this supplier order.'}</p>${g.items.map(({line,offer,available})=>`<label>${esc(line.description)} · Qty ${esc(line.quantity)}<select data-source="${esc(line.product_id)}">${available.length?available.map(o=>`<option value="${esc(o.supplier_id)}" ${o.supplier_id===offer?.supplier_id?'selected':''}>${esc(o.supplier_name)} · ${esc(money(o.cost_excl))} excl. VAT / unit</option>`).join(''):'<option value="unassigned">Confirm supplier manually</option>'}</select></label>`).join('')}<label>${esc(g.name)} courier fee incl. VAT (R)<input data-delivery-fee="${esc(g.id)}" type="number" min="0" step="0.01" placeholder="Enter quoted fee" value="${esc(deliveryFees[g.id]??'')}"></label></article>`;
 }).join('');
 box.querySelectorAll('[data-source]').forEach(el=>el.onchange=()=>{deliverySelections[el.dataset.source]=el.value;deliveryApplied=false;renderDelivery();});
 box.querySelectorAll('[data-delivery-fee]').forEach(el=>el.oninput=()=>{deliveryFees[el.dataset.deliveryFee]=el.value;autoFree.delete(el.dataset.deliveryFee);deliveryApplied=false;q('#billingDeliveryStatus').textContent='Breakdown changed. Apply it to update the customer delivery total.';});
 if(current?.status==='issued')setEditorLocked(true);
}

async function refreshHistory(){const r=await client.rpc('admin_billing_records');if(r.error)throw r.error;documents=r.data||[];renderHistory();}
function renderHistory(){
 const term=normalizeSearch(q('#billingHistorySearch').value);const rows=documents.filter(d=>normalizeSearch([d.document_number,d.title,d.kind,d.status,d.customer_details?.full_name,d.customer_details?.billing_email,...(d.items||[]).flatMap(i=>[i.description,i.sku])].join(' ')).includes(term));
 const box=q('#billingHistory');box.replaceChildren();for(const d of rows){const wrap=document.createElement('div');wrap.className='billing-history-row';const b=document.createElement('button');b.type='button';b.textContent=`${d.document_number||'Draft '+d.kind} · ${money(d.total)}`;const small=document.createElement('small');small.textContent=[d.customer_details?.full_name,d.title,d.status].filter(Boolean).join(' · ');b.append(small);b.onclick=()=>loadDocument(d.id).catch(e=>status(e.message));wrap.append(b);box.append(wrap);}if(!rows.length)box.textContent='No saved documents yet.';
}
function setEditorLocked(locked){q('#billingForm').querySelectorAll('input,select,textarea,button').forEach(e=>e.disabled=locked);}
async function loadDocument(id){
 const [dr,ir]=await Promise.all([client.from('billing_documents').select('*').eq('id',id).single(),client.from('billing_document_items').select('*').eq('document_id',id).eq('active',true).order('position')]);
 if(dr.error||ir.error)throw dr.error||ir.error;current=dr.data;requestKey=current.request_key;autoFree.clear();deliveryPlan=current.internal_delivery||null;deliverySelections=deliveryPlan?.selections||{};deliveryFees=deliveryPlan?.fees||{};deliveryApplied=!!deliveryPlan?.applied;q('#billingOnwardDelivery').value=deliveryPlan?.onward??0;sourcingKey='';q('#billingReference').textContent='Reference: '+(current.document_number||'Allocated on save');
 customer=contacts.find(c=>c.id===current.customer_id)||{id:current.customer_id,...current.customer_details};lines=ir.data.map(i=>({...i,unit_price:Number(i.unit_price),quantity:Number(i.quantity)}));
 setEditorLocked(false);q('#billingCustomerSearch').value=customer.full_name||'';q('#billingSelectedCustomer').textContent=[customer.full_name,customer.billing_email,customer.phone].filter(Boolean).join(' · ');
 q('#billingKind').value=current.kind;q('#billingTitle').value=current.title;q('#billingValid').value=current.valid_until||'';q('#billingDue').value=current.due_date||'';q('#billingNote').value=current.customer_note||'';q('#billingDelivery').value=current.delivery_fee;q('#billingDiscount').value=current.discount_total;renderLines();setEditorLocked(current.status==='issued');preview();
 history.replaceState(null,'',`?id=${encodeURIComponent(id)}`);status(`${current.document_number||'Draft'} loaded. ${current.status==='issued'?'Issued prices are preserved. Use Print / Save PDF.':'You can edit this draft or issue it.'}`);
}
async function save(issue){
 if(busy)return;if(!q('#billingForm').reportValidity())return;if(!customer){status('Select or create a customer first.');q('#billingCustomerSearch').focus();return;}if(!lines.length){status('Add at least one product, labour or service line.');return;}
 busy=true;setEditorLocked(true);q('#newDocument').disabled=true;status(issue?'Creating document…':'Saving draft…');
 try{
  const data={...inputs(),id:current?.id||null,expected_updated_at:current?.updated_at,request_key:requestKey,customer_id:customer.id,issue,items:lines.map(i=>({product_id:i.product_id||null,description:i.description,item_type:i.item_type,quantity:i.quantity,unit_price:i.unit_price}))};
  const r=await client.rpc('admin_save_billing_document',{p_data:data});if(r.error)throw r.error;await loadDocument(r.data);await refreshHistory();status(`${current.document_number||'Draft'} saved. ${issue?'Ready to Print / Save PDF. No email has been sent.':'Review the preview, then create the invoice or issue the quotation.'}`);
 }catch(e){status(e.message);}finally{busy=false;setEditorLocked(current?.status==='issued');q('#newDocument').disabled=false;}
}
function newDocument(){
 current=null;customer=null;lines=[];autoFree.clear();deliveryPlan=null;deliverySelections={};deliveryFees={};deliveryApplied=false;sourcingKey='';q('#billingReference').textContent='A unique reference is allocated on first save.';requestKey=crypto.randomUUID();q('#billingForm').reset();setEditorLocked(false);q('#billingCustomerSearch').value='';q('#billingSelectedCustomer').textContent='Choose a registered customer or create a contact.';q('#billingCustomerResults').hidden=true;q('#billingValid').value=dateAfter(7);q('#billingDue').value=dateAfter(7);closeProductResults();renderLines();history.replaceState(null,'','admin-invoices.html');status('Ready. Select a customer and add products.');
 if(!products.length)loadCatalogue();
}
q('#billingProductSearch').addEventListener('input',()=>{searchVersion++;clearTimeout(searchTimer);searchTimer=setTimeout(runProductSearch,150);});
q('#billingProductSearch').addEventListener('keydown',e=>{
 if(e.key==='Escape'){e.preventDefault();searchVersion++;clearTimeout(searchTimer);closeProductResults();return;}
 const options=[...q('#billingProductResults').querySelectorAll('button')];if(q('#billingProductResults').hidden||!options.length)return;
 if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();activeOption=(activeOption+(e.key==='ArrowDown'?1:-1)+options.length)%options.length;options.forEach((b,i)=>b.setAttribute('aria-selected',String(i===activeOption)));q('#billingProductSearch').setAttribute('aria-activedescendant',options[activeOption].id);options[activeOption].scrollIntoView({block:'nearest'});}
 if(e.key==='Enter'){e.preventDefault();if(activeOption>=0)options[activeOption].click();}
});
q('#billingMoreProducts').onclick=()=>{shown+=12;showProductResults();};
q('#billingAddService').onclick=()=>{lines.push({description:'',item_type:'labour',quantity:1,unit_price:0});renderLines();};
q('#billingCustomerSearch').oninput=()=>customerPicker();q('#billingCustomerSearch').onfocus=()=>{if(!current||current.status==='draft')customerPicker(false);};
q('#billingHistorySearch').oninput=renderHistory;
q('#billingForm').onsubmit=e=>{e.preventDefault();save(false);};q('#billingIssue').onclick=()=>save(true);
for(const id of ['billingKind','billingTitle','billingValid','billingDue','billingNote','billingDelivery','billingDiscount'])q('#'+id).addEventListener('input',preview);
q('#newDocument').onclick=newDocument;
q('#newCustomer').onclick=()=>q('#billingCustomerDialog').showModal();q('#closeCustomer').onclick=()=>q('#billingCustomerDialog').close();
q('#billingCustomerForm').onsubmit=async e=>{
 e.preventDefault();const button=e.target.querySelector('[type=submit]');button.disabled=true;q('#billingCustomerError').textContent='';
 try{const r=await client.rpc('admin_save_billing_customer',{p_data:Object.fromEntries(new FormData(e.target))});if(r.error)throw r.error;contacts=contacts.filter(c=>c.id!==r.data.id).concat(r.data);selectCustomer(r.data);e.target.reset();q('#billingCustomerDialog').close();status('Customer selected. No registration account or email was created.');}catch(error){q('#billingCustomerError').textContent=error.message;}finally{button.disabled=false;}
};
q('#billingCopyInvoice').onclick=()=>{
 const original=current;current=null;q('#billingReference').textContent='A new invoice reference is allocated on save.';requestKey=crypto.randomUUID();setEditorLocked(false);q('#billingKind').value='invoice';q('#billingNote').value=[`Quotation reference: ${original.document_number}`,original.customer_note].filter(Boolean).join('\n');q('#billingDue').value=dateAfter(7);renderLines();preview();status('Invoice copied from the quotation. Review prices, then Create invoice.');
};
q('#billingDelivery').addEventListener('input',()=>{deliveryApplied=false;deliveryPlan=null;});
q('#billingOnwardDelivery').addEventListener('input',()=>{deliveryApplied=false;});
q('#billingApplyDelivery').onclick=()=>{try{const groups=deliveryGroups(lines,sourcing,deliverySelections),onward=Number(q('#billingOnwardDelivery').value||0);if(!groups.length)throw Error('Add products before applying supplier delivery.');const total=deliveryTotal(groups,deliveryFees,onward);deliverySelections=Object.fromEntries(groups.flatMap(g=>g.items.map(i=>[i.line.product_id,g.id])));deliveryPlan={applied:true,selections:{...deliverySelections},fees:{...deliveryFees},onward};deliveryApplied=true;q('#billingDelivery').value=total;q('#billingDeliveryStatus').textContent='Applied '+money(total)+' total delivery. Supplier details stay admin-only. Save the document to keep this breakdown.';preview();}catch(e){q('#billingDeliveryStatus').textContent=e.message;}};
q('#billingPrint').onclick=()=>{document.title=`VoltTech_${current?.kind||q('#billingKind').value}_${current?.document_number||'Draft'}`;window.print();};
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#billingCustomerResults')&&e.target!==q('#billingCustomerSearch'))q('#billingCustomerResults').hidden=true;if(!e.target.closest('#billingProductResults')&&e.target!==q('#billingProductSearch')&&e.target!==q('#billingMoreProducts'))closeProductResults();});
async function init(){
 try{
  const session=await client.auth.getSession();if(!session.data.session){location.replace('account.html?returnTo='+encodeURIComponent('/admin-invoices.html'+location.search));return;}
  const admin=await client.rpc('is_volttech_admin');if(admin.error||admin.data!==true){status('Administrator access is required.');return;}
  const [cr,ar]=await Promise.all([client.from('billing_customers').select('*').order('full_name'),client.rpc('admin_customers')]);if(cr.error||ar.error)throw cr.error||ar.error;contacts=cr.data||[];accounts=ar.data||[];
  q('#billingApp').hidden=false;if(new URLSearchParams(location.search).get('kind')==='quote')q('#billingKind').value='quote';q('#billingValid').value=dateAfter(7);q('#billingDue').value=dateAfter(7);preview();q('#billingProductSearch').disabled=true;loadCatalogue();await refreshHistory();
  const id=new URLSearchParams(location.search).get('id');if(id)await loadDocument(id);else status('Ready. Create an invoice or quotation for a registered or unregistered customer.');
 }catch(e){status(e.message);}
}
init();
