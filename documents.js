
(()=>{
const c=supabase.createClient(VOLTTECH_SUPABASE.url,VOLTTECH_SUPABASE.publishableKey),x=v=>String(v??"").replace(/[&<>"]/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[a])),m=n=>new Intl.NumberFormat("en-ZA",{style:"currency",currency:"ZAR"}).format(Number(n||0)),d=v=>v?new Intl.DateTimeFormat("en-ZA",{dateStyle:"medium"}).format(new Date(v)):"—";
const buildRef=id=>`VT-BLD-${String(id||"").replace(/-/g,"").slice(0,8).toUpperCase()}`;
let data={invoice:[],quote:[],build:[],order:[],service:[],proforma:[]};
function card(num,status,total,meta,href,kind,id,extra=""){return`<article class="card"><div class="head"><div><span class="num">${x(num)}</span>${extra}</div><span class="pill">${x(status||"")}</span></div>${total!=null?`<div class="money">${m(total)}</div>`:""}<div class="meta">${x(meta||"")}</div><div class="actions"><a class="btn teal" href="${href}">View / PDF</a><button class="btn" data-email-kind="${kind}" data-email-id="${id}">Email copy</button></div></article>`}
function searchText(type,r){
 const common=[type,r.status,r.total,r.created_at,r.updated_at];
 if(type==="invoice")common.push(r.invoice_number,r.due_at,r.paid_at);
 if(type==="quote")common.push(r.quote_number,r.title);
 if(type==="build")common.push(buildRef(r.id),r.name);
 if(type==="order")common.push(r.order_number,r.payment_status,r.placed_at);
 if(type==="service")common.push(r.job_number,r.title,r.device_name,r.completed_at);
 if(type==="proforma")common.push(r.proforma_number);
 return common.filter(Boolean).join(" ").toLowerCase()
}
function renderType(type,selector,emptyText,renderer){
 const term=(document.querySelector("#documentSearch")?.value||"").trim().toLowerCase(),filter=document.querySelector("#documentTypeFilter")?.value||"";
 const section=document.querySelector(`[data-doc-section="${type}"]`);
 if(section)section.hidden=!!filter&&filter!==type;
 if(filter&&filter!==type)return 0;
 const rows=data[type].filter(r=>!term||searchText(type,r).includes(term)),target=document.querySelector(selector);
 target.innerHTML=rows.length?rows.map(renderer).join(""):`<p class="empty">${term?"No matching records.":emptyText}</p>`;
 return rows.length
}
function render(){
 let total=0;
 total+=renderType("invoice","#invoices","No invoices yet.",i=>card(i.invoice_number,i.status,i.total,`Issued ${d(i.issued_at)}${i.paid_at?` · Paid ${d(i.paid_at)}`:""}`,`invoice.html?id=${encodeURIComponent(i.id)}`,"invoice",i.id,i.status==="paid"?`<div class="actions"><a class="btn" href="receipt.html?id=${encodeURIComponent(i.id)}">Receipt</a></div>`:""));
 total+=renderType("quote","#quoteDocs","No quotes yet.",q=>card(q.quote_number,q.status,q.total,`${q.title||"Quotation"} · ${d(q.created_at)}`,`quote.html?id=${encodeURIComponent(q.id)}`,"quote",q.id));
 total+=renderType("build","#buildDocs","No saved builds yet.",b=>card(buildRef(b.id),b.status,b.estimated_total,`${b.name||"PC Build"} · Updated ${d(b.updated_at)}`,`build-document.html?id=${encodeURIComponent(b.id)}`,"build",b.id));
 total+=renderType("order","#orderDocs","No orders yet.",o=>card(o.order_number||"Order",o.status,o.total,`${o.payment_status||""} · ${d(o.placed_at||o.created_at)}`,`order-document.html?id=${encodeURIComponent(o.id)}`,"order",o.id));
 total+=renderType("service","#serviceDocs","No service jobs yet.",j=>card(j.job_number||"Service job",j.status,null,`${j.title||"Service"} · Opened ${d(j.opened_at)}`,`service-record.html?id=${encodeURIComponent(j.id)}`,"service",j.id));
 total+=renderType("proforma","#proformas","No proformas.",p=>card(p.proforma_number||"Proforma","proforma",p.total,`Created ${d(p.created_at)}`,`proforma.html?id=${encodeURIComponent(p.id)}`,"proforma",p.id));
 document.querySelector("#docStatus").textContent=`${total} matching record${total===1?"":"s"}`
}
async function load(){
 const{data:{session}}=await c.auth.getSession();if(!session){location.href="account.html";return}
 const[inv,quo,bui,ord,job,pro]=await Promise.all([
   c.from("invoices").select("id,invoice_number,status,total,issued_at,due_at,paid_at").order("issued_at",{ascending:false}),
   c.from("quotes").select("id,quote_number,status,total,title,created_at").order("created_at",{ascending:false}),
   c.from("saved_builds").select("id,name,status,estimated_total,updated_at").order("updated_at",{ascending:false}),
   c.from("orders").select("id,order_number,status,total,payment_status,placed_at,created_at").order("created_at",{ascending:false}),
   c.from("service_jobs").select("id,job_number,status,title,device_name,opened_at,completed_at").order("opened_at",{ascending:false}),
   c.from("proformas").select("id,proforma_number,total,created_at").order("created_at",{ascending:false})
 ]);
 data.invoice=inv.error?[]:(inv.data||[]);data.quote=quo.error?[]:(quo.data||[]);data.build=bui.error?[]:(bui.data||[]);data.order=ord.error?[]:(ord.data||[]);data.service=job.error?[]:(job.data||[]);data.proforma=pro.error?[]:(pro.data||[]);
 render()
}
document.querySelector("#documentSearch")?.addEventListener("input",render);document.querySelector("#documentTypeFilter")?.addEventListener("change",render);load()
})();
