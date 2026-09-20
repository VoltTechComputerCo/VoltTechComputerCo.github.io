(()=>{
const c=supabase.createClient(VOLTTECH_SUPABASE.url,VOLTTECH_SUPABASE.publishableKey),q=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[a]));
const money=n=>new Intl.NumberFormat("en-ZA",{style:"currency",currency:"ZAR"}).format(Number(n||0));
const date=v=>v?new Intl.DateTimeFormat("en-ZA",{dateStyle:"medium"}).format(new Date(v)):"—";
const buildRef=id=>`VT-BLD-${String(id||"").replace(/-/g,"").slice(0,8).toUpperCase()}`;
let customers=[],quotes=[],invoiceRows=[],builds=[],invoiceMap=new Map(),queue=[];
const customer=id=>customers.find(x=>x.id===id)||{},name=p=>p.full_name||p.billing_email||"Customer";

async function email(kind,id){
  try{return await c.functions.invoke("send-document-email",{body:{kind,source_id:id}})}
  catch(e){return{error:e}}
}

function originLabel(r){
  if(r?.source_type==="builder")return "Builder";
  if(r?.source_type==="store")return "Store";
  if(r?.quote_type==="repair"||r?.quote_type==="service")return "Service";
  return "Manual";
}

async function load(){
 const{data:{session}}=await c.auth.getSession();if(!session)return;
 const{data:ok}=await c.rpc("is_volttech_admin");if(ok!==true)return;

 const[cr,qr,ir,br]=await Promise.all([
   c.rpc("admin_customers"),
   c.rpc("admin_quotes"),
   c.from("invoices")
     .select("id,user_id,quote_id,invoice_number,status,total,issued_at,due_at,paid_at,source_type,source_id,source_metadata")
     .order("issued_at",{ascending:false}),
   c.from("saved_builds")
     .select("id,user_id,name,status,build_data,estimated_total,quote_requested_at,updated_at")
     .eq("status","quote_requested")
     .order("quote_requested_at",{ascending:true})
 ]);

 customers=cr.error?[]:(cr.data||[]);
 quotes=qr.error?[]:(qr.data||[]);
 invoiceRows=ir.error?[]:(ir.data||[]);
 builds=br.error?[]:(br.data||[]);

 /* admin_quotes may predate provenance columns, so enrich only if needed. */
 if(quotes.length && !Object.prototype.hasOwnProperty.call(quotes[0],"source_type")){
   const ids=quotes.map(x=>x.id).filter(Boolean);
   if(ids.length){
     const extra=await c.from("quotes")
       .select("id,source_type,source_id,source_metadata")
       .in("id",ids);
     if(!extra.error){
       const map=new Map((extra.data||[]).map(x=>[x.id,x]));
       quotes=quotes.map(row=>({...row,...(map.get(row.id)||{})}));
     }
   }
 }

 invoiceMap=new Map(invoiceRows.filter(i=>i.quote_id).map(i=>[i.quote_id,i]));
 buildQueue();
}

function buildQueue(){
 const items=[];

 for(const b of builds){
   const p=customer(b.user_id);
   items.push({
     key:`build:${b.id}`,stage:"review",tone:"attention",stageLabel:"Needs review",
     origin:"Builder request",
     title:b.name||"PC Build request",who:name(p),ref:buildRef(b.id),
     total:b.estimated_total,when:b.quote_requested_at||b.updated_at,
     search:[name(p),p.billing_email,b.name,buildRef(b.id),...(b.build_data?.items||[]).map(i=>i.name)].filter(Boolean).join(" ").toLowerCase(),
     actions:`<a class="btn primary" href="admin-builds.html?focus=${encodeURIComponent(b.id)}">Review & create quote</a><a class="btn" href="build-document.html?id=${encodeURIComponent(b.id)}">Build spec</a>`
   });
 }

 for(const qu of quotes){
   const inv=invoiceMap.get(qu.id);
   const origin=originLabel(qu);

   if(qu.status==="draft")items.push({
     key:`quote:${qu.id}`,stage:"draft",tone:"ready",stageLabel:"Ready to send",origin,
     title:qu.title||"Draft quotation",who:qu.customer_name||"Customer",ref:qu.quote_number,total:qu.total,when:qu.created_at,
     search:[qu.quote_number,qu.title,qu.customer_name,origin].filter(Boolean).join(" ").toLowerCase(),
     actions:`<button class="btn primary wf-send" data-id="${qu.id}" data-num="${esc(qu.quote_number)}">Send quote</button><a class="btn" href="quote.html?id=${encodeURIComponent(qu.id)}">Review PDF</a>`
   });
   else if(["sent","viewed"].includes(qu.status))items.push({
     key:`quote:${qu.id}`,stage:"waiting",tone:"waiting",stageLabel:"Waiting on customer",origin,
     title:qu.title||"Quotation",who:qu.customer_name||"Customer",ref:qu.quote_number,total:qu.total,when:qu.created_at,
     search:[qu.quote_number,qu.title,qu.customer_name,origin].filter(Boolean).join(" ").toLowerCase(),
     actions:`<a class="btn primary" href="quote.html?id=${encodeURIComponent(qu.id)}">Open quote</a>`
   });
   else if(qu.status==="accepted"&&!inv)items.push({
     key:`quote:${qu.id}`,stage:"invoice",tone:"attention",stageLabel:"Ready to invoice",origin,
     title:qu.title||"Accepted quotation",who:qu.customer_name||"Customer",ref:qu.quote_number,total:qu.total,when:qu.created_at,
     search:[qu.quote_number,qu.title,qu.customer_name,origin].filter(Boolean).join(" ").toLowerCase(),
     actions:`<button class="btn primary wf-invoice" data-id="${qu.id}" data-num="${esc(qu.quote_number)}">Create invoice</button><a class="btn" href="quote.html?id=${encodeURIComponent(qu.id)}">Open quote</a>`
   });
 }

 for(const inv of invoiceRows){
   if(inv.status==="paid")continue;
   const qu=quotes.find(x=>x.id===inv.quote_id),p=customer(inv.user_id);
   items.push({
     key:`invoice:${inv.id}`,stage:"payment",tone:"waiting",stageLabel:"Awaiting payment",
     origin:inv.source_type==="builder"?"Builder":inv.source_type==="store"?"Store":originLabel(qu),
     title:qu?.title||"Customer invoice",who:qu?.customer_name||name(p),ref:inv.invoice_number,total:inv.total,when:inv.issued_at,
     search:[inv.invoice_number,qu?.quote_number,qu?.title,qu?.customer_name,name(p),inv.source_type].filter(Boolean).join(" ").toLowerCase(),
     actions:`<a class="btn primary" href="invoice.html?id=${encodeURIComponent(inv.id)}">Open invoice</a>${qu?`<a class="btn" href="quote.html?id=${encodeURIComponent(qu.id)}">Related quote</a>`:""}`
   });
 }

 queue=items.sort((a,b)=>new Date(b.when||0)-new Date(a.when||0));
 render();
}

function render(){
 const term=(q("#queueSearch")?.value||"").trim().toLowerCase();
 const stage=q("#queueStage")?.value||"";
 const focus=new URLSearchParams(location.search).get("focus");
 const rows=queue.filter(r=>(!stage||r.stage===stage)&&(!term||r.search.includes(term)));

 q("#queueStatus").textContent=rows.length?`${rows.length} active item${rows.length===1?"":"s"}`:"Nothing needs action in this filter.";

 q("#workQueue").innerHTML=rows.length?rows.map(r=>`
   <article class="vt-work-card ${r.tone} ${focus&&r.key.endsWith(focus)?"vt-focus":""}">
     <div class="vt-work-top">
       <div>
         <div class="vt-work-badges">
           <span class="vt-work-stage">${esc(r.stageLabel)}</span>
           <span class="vt-work-origin">${esc(r.origin||"Manual")}</span>
         </div>
         <h3>${esc(r.title)}</h3>
         <div class="vt-work-meta">${esc(r.who)} · ${esc(r.ref)} · ${esc(date(r.when))}</div>
       </div>
       ${r.total!=null?`<div class="vt-work-money">${money(r.total)}</div>`:""}
     </div>
     <div class="vt-work-actions">${r.actions}</div>
   </article>`).join("")
   :'<div class="vt-queue-empty">No active records match this filter.</div>';

 document.querySelectorAll(".wf-send").forEach(b=>b.onclick=()=>send(b.dataset.id,b.dataset.num));
 document.querySelectorAll(".wf-invoice").forEach(b=>b.onclick=()=>invoice(b.dataset.id,b.dataset.num));
}

async function send(id,num){
 const ok=await VoltTechDialog.confirm({
   kicker:"ADMIN / QUOTE",
   title:`Send ${num||"this quote"}?`,
   message:"This moves the quotation to customer approval.",
   confirmText:"Send quote"
 });
 if(!ok)return;

 const{error}=await c.rpc("admin_send_quote",{p_quote_id:id});
 if(error){
   await VoltTechDialog.message({title:"Could not send quote",message:error.message});
   return;
 }

 try{await c.rpc("snapshot_quote",{p_quote_id:id})}catch{}
 await email("quote",id);
 await load();
}

async function invoice(id,num){
 const ok=await VoltTechDialog.confirm({
   kicker:"ADMIN / INVOICE",
   title:`Create invoice from ${num||"this quote"}?`,
   message:"This moves the accepted quotation to the invoice/payment stage and preserves its Store/Builder source link.",
   confirmText:"Create invoice"
 });
 if(!ok)return;

 const{data,error}=await c.rpc("admin_create_invoice",{p_quote_id:id});
 if(error){
   await VoltTechDialog.message({title:"Could not create invoice",message:error.message});
   return;
 }

 try{await c.rpc("snapshot_invoice",{p_invoice_id:data})}catch{}
 await email("invoice",data);

 if(data)location.href=`invoice.html?id=${encodeURIComponent(data)}`;
 else await load();
}

q("#queueSearch")?.addEventListener("input",render);
q("#queueStage")?.addEventListener("change",render);
document.addEventListener("DOMContentLoaded",load);
})();