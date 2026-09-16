(()=>{
const c=supabase.createClient(VOLTTECH_SUPABASE.url,VOLTTECH_SUPABASE.publishableKey);
const root=document.querySelector("#document");
const x=v=>String(v??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[a]));
const m=n=>new Intl.NumberFormat("en-ZA",{style:"currency",currency:"ZAR"}).format(Number(n||0));
const d=v=>v?new Intl.DateTimeFormat("en-ZA",{dateStyle:"long"}).format(new Date(v.includes("T")?v:v+"T12:00:00")):"—";
const cap=v=>String(v||"").replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());
const fileSafe=v=>String(v||"document").replace(/[^A-Za-z0-9_-]+/g,"_").replace(/^_+|_+$/g,"");
const loginUrl=()=>`account.html?returnTo=${encodeURIComponent(location.pathname+location.search+location.hash)}`;
function expired(q){if(!q?.valid_until||!["sent","viewed"].includes(q.status))return false;const end=new Date(`${q.valid_until}T23:59:59`);return !Number.isNaN(end.getTime())&&end.getTime()<Date.now()}
async function load(){
  const{data:{session}}=await c.auth.getSession();
  if(!session){location.replace(loginUrl());return}
  const id=new URLSearchParams(location.search).get("id");
  if(!id){root.innerHTML="<p>Quote not specified.</p>";return}
  const{data:q,error}=await c.from("quotes")
    .select("id,user_id,quote_number,quote_type,title,status,subtotal,total,delivery_fee,discount_total,valid_until,customer_note,created_at,terms_version,quote_items(position,description,quantity,line_total)")
    .eq("id",id).maybeSingle();
  if(error||!q){root.innerHTML="<p>Quotation could not be loaded.</p>";return}

  let profile=null;
  if(q.user_id){
    const pr=await c.from("profiles").select("full_name,company_name,billing_email,phone,suburb").eq("id",q.user_id).maybeSingle();
    if(!pr.error)profile=pr.data;
  }

  const filename=`VoltTech_Quotation_${fileSafe(q.quote_number)}`;
  document.title=filename;
  VoltTechPrint.setName(filename);

  const b=document.querySelector("#emailCopy");
  b.hidden=false;b.dataset.emailKind="quote";b.dataset.emailId=id;

  const isExpired=expired(q),displayStatus=isExpired?"expired":q.status;
  const customerName=profile?.full_name||((q.user_id===session.user.id)&&(session.user.user_metadata?.full_name||session.user.user_metadata?.name))||"Customer";
  const customerEmail=profile?.billing_email||((q.user_id===session.user.id)?session.user.email:"")||"";
  const customerBits=[customerName,profile?.company_name||"",customerEmail,profile?.phone||"",profile?.suburb||""].filter(Boolean);

  root.innerHTML=`<article class="sheet">
    <div class="top">
      <div class="brand">
        <div class="brandline"><img src="logo-badge.png" alt=""><h1>VoltTech Computer Co.</h1></div>
        <p>PC & technology services · Pretoria, Gauteng<br>volttechcomputerco@gmail.com · +27 61 843 5775</p>
      </div>
      <div class="doc"><h2>Quotation</h2><div class="num">${x(q.quote_number)}</div><p class="meta">${x(cap(displayStatus))}</p></div>
    </div>
    <div class="grid">
      <div class="block"><strong>Prepared for</strong><p>${customerBits.map(x).join("<br>")}</p></div>
      <div class="block"><strong>Quote details</strong><p>${x(q.title)}<br>Issued: ${d(q.created_at)}<br>Valid until: ${d(q.valid_until)}</p></div>
    </div>
    <table class="items"><thead><tr><th>Description</th><th>Qty</th><th>Total</th></tr></thead>
      <tbody>${[...(q.quote_items||[])].sort((a,b)=>a.position-b.position).map(i=>`<tr><td>${x(i.description)}</td><td>${i.quantity}</td><td>${m(i.line_total)}</td></tr>`).join("")}</tbody>
    </table>
    <div class="totals"><div class="row"><span>Subtotal</span><b>${m(q.subtotal)}</b></div>${q.delivery_fee?`<div class="row"><span>Delivery</span><b>${m(q.delivery_fee)}</b></div>`:""}${q.discount_total?`<div class="row"><span>Discount</span><b>− ${m(q.discount_total)}</b></div>`:""}<div class="row grand"><span>Total</span><b>${m(q.total)}</b></div></div>
    ${q.customer_note?`<div class="notice">${x(q.customer_note)}</div>`:""}
    ${isExpired?'<div class="notice">This quotation has passed its validity date. Contact VoltTech if you need a current quotation.</div>':""}
    <div class="notice">Quote Terms version ${x(q.terms_version||"2026-09")}. This document is a quotation, not an invoice or proof of payment.</div>
  </article>`;
}
load();
})();