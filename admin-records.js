
(()=>{
const c=supabase.createClient(VOLTTECH_SUPABASE.url,VOLTTECH_SUPABASE.publishableKey),q=s=>document.querySelector(s);
const x=v=>String(v??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[a]));
const money=n=>new Intl.NumberFormat("en-ZA",{style:"currency",currency:"ZAR"}).format(Number(n||0));
const date=v=>v?new Intl.DateTimeFormat("en-ZA",{dateStyle:"medium"}).format(new Date(v)):"—";
const buildRef=id=>`VT-BLD-${String(id||"").replace(/-/g,"").slice(0,8).toUpperCase()}`;
let records=[],customers=new Map;
async function safe(type,promise,mapper){
 try{const{data,error}=await promise;if(error)return[];return(data||[]).map(r=>mapper(r,type))}catch{return[]}
}
function customer(userId){return customers.get(userId)||{}}
function addSearch(r,extra=[]){const p=customer(r.user_id);r.search=[r.type,r.ref,r.title,r.status,r.meta,p.full_name,p.billing_email,p.phone,p.company_name,p.suburb,...extra].filter(Boolean).join(" ").toLowerCase();return r}
async function load(){
 const{data:{session}}=await c.auth.getSession();if(!session){location.href="account.html?returnTo=%2Fadmin-records.html";return}
 const{data:ok}=await c.rpc("is_volttech_admin");if(ok!==true){location.replace("account.html");return}
 const cr=await c.rpc("admin_customers");customers=new Map((cr.data||[]).map(v=>[v.id,v]));
 const groups=await Promise.all([
   safe("quote",c.from("quotes").select("id,user_id,quote_number,title,status,total,created_at,quote_items(description)"),r=>addSearch({type:"quote",id:r.id,user_id:r.user_id,ref:r.quote_number,title:r.title,status:r.status,total:r.total,meta:`Issued ${date(r.created_at)}`,href:`quote.html?id=${encodeURIComponent(r.id)}`},(r.quote_items||[]).map(i=>i.description))),
   safe("invoice",c.from("invoices").select("id,user_id,invoice_number,status,total,issued_at,quote_id,invoice_items(description)"),r=>addSearch({type:"invoice",id:r.id,user_id:r.user_id,ref:r.invoice_number,title:"Invoice",status:r.status,total:r.total,meta:`Issued ${date(r.issued_at)}`,href:`invoice.html?id=${encodeURIComponent(r.id)}`},(r.invoice_items||[]).map(i=>i.description))),
   safe("build",c.from("saved_builds").select("id,user_id,name,status,estimated_total,updated_at,quote_id,build_data"),r=>addSearch({type:"build",id:r.id,user_id:r.user_id,ref:buildRef(r.id),title:r.name||"PC Build",status:r.status,total:r.estimated_total,meta:`Updated ${date(r.updated_at)}`,href:`build-document.html?id=${encodeURIComponent(r.id)}`},(r.build_data?.items||[]).map(i=>i.name))),
   safe("order",c.from("orders").select("id,user_id,order_number,status,total,payment_status,created_at,order_items(product_name)"),r=>addSearch({type:"order",id:r.id,user_id:r.user_id,ref:r.order_number||r.id,title:"Order",status:r.status,total:r.total,meta:`${r.payment_status||""} · ${date(r.created_at)}`,href:`order-document.html?id=${encodeURIComponent(r.id)}`},(r.order_items||[]).map(i=>i.product_name))),
   safe("service",c.from("service_jobs").select("id,user_id,job_number,status,title,device_name,opened_at"),r=>addSearch({type:"service",id:r.id,user_id:r.user_id,ref:r.job_number||r.id,title:r.title||"Service Job",status:r.status,total:null,meta:`${r.device_name||""} · ${date(r.opened_at)}`,href:`service-record.html?id=${encodeURIComponent(r.id)}`},[r.device_name])),
   safe("proforma",c.from("proformas").select("id,user_id,proforma_number,total,created_at"),r=>addSearch({type:"proforma",id:r.id,user_id:r.user_id,ref:r.proforma_number||r.id,title:"Proforma",status:"proforma",total:r.total,meta:`Created ${date(r.created_at)}`,href:`proforma.html?id=${encodeURIComponent(r.id)}`}))
 ]);
 records=groups.flat().sort((a,b)=>String(b.meta).localeCompare(String(a.meta)));render()
}
function label(type){return({quote:"Quotation",invoice:"Invoice",build:"PC Build",order:"Order",service:"Service Job",proforma:"Proforma"}[type]||type)}
function render(){
 const term=(q("#recordSearch").value||"").trim().toLowerCase(),type=q("#recordType").value||"";
 const rows=records.filter(r=>(!type||r.type===type)&&(!term||r.search.includes(term)));
 q("#recordStatus").textContent=`${rows.length} of ${records.length} record${records.length===1?"":"s"}`;
 q("#recordResults").innerHTML=rows.length?rows.slice(0,150).map(r=>{const p=customer(r.user_id);return`<article class="card"><div class="head"><div><span class="num">${x(label(r.type))} · ${x(r.ref)}</span><h2>${x(r.title)}</h2></div><span class="pill">${x(r.status||"")}</span></div><div class="meta">${x([p.full_name||p.billing_email,p.billing_email&&p.full_name?p.billing_email:"",p.suburb].filter(Boolean).join(" · "))}</div>${r.total!=null?`<div class="money">${money(r.total)}</div>`:""}<div class="meta">${x(r.meta)}</div><div class="actions"><a class="btn teal" href="${r.href}">Open record</a></div></article>`}).join(""):'<p class="empty">No records match that search.</p>'
}
q("#recordSearch")?.addEventListener("input",render);q("#recordType")?.addEventListener("change",render);document.addEventListener("DOMContentLoaded",load)
})();
