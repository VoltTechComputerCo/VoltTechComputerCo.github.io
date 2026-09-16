(()=>{
const c=supabase.createClient(VOLTTECH_SUPABASE.url,VOLTTECH_SUPABASE.publishableKey);
const root=document.querySelector("#document");
const x=v=>String(v??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[a]));
const m=n=>new Intl.NumberFormat("en-ZA",{style:"currency",currency:"ZAR"}).format(Number(n||0));
const d=v=>v?new Intl.DateTimeFormat("en-ZA",{dateStyle:"long"}).format(new Date(v.includes("T")?v:v+"T12:00:00")):"—";
const cap=v=>String(v||"").replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());
const fileSafe=v=>String(v||"document").replace(/[^A-Za-z0-9_-]+/g,"_").replace(/^_+|_+$/g,"");
const loginUrl=()=>`account.html?returnTo=${encodeURIComponent(location.pathname+location.search+location.hash)}`;
let currentQuote=null,currentSession=null,busy=false;
function expired(q){if(!q?.valid_until||!["sent","viewed"].includes(q.status))return false;const end=new Date(`${q.valid_until}T23:59:59`);return !Number.isNaN(end.getTime())&&end.getTime()<Date.now()}

function renderDecision(q,session){
  const box=document.querySelector("#quoteDecision");
  if(!box)return;
  const own=q.user_id===session.user.id;
  if(!own){box.hidden=true;return}

  const kicker=document.querySelector("#quoteDecisionKicker");
  const title=document.querySelector("#quoteDecisionTitle");
  const copy=document.querySelector("#quoteDecisionCopy");
  const total=document.querySelector("#quoteDecisionTotal");
  const actions=document.querySelector("#quoteDecisionActions");
  const status=document.querySelector("#quoteDecisionStatus");
  status.textContent="";
  total.textContent="";

  if(expired(q)){
    box.hidden=false;box.dataset.state="expired";kicker.textContent="Quote expired";title.textContent=`${q.quote_number} can no longer be approved`;
    copy.textContent="This quotation has passed its validity date. Contact VoltTech if you need an updated quotation.";
    actions.hidden=true;return;
  }

  if(["sent","viewed"].includes(q.status)){
    box.hidden=false;box.dataset.state="attention";kicker.textContent="Action required";title.textContent=`Review ${q.quote_number}`;
    copy.textContent="Approve or decline this quotation below. Accepting does not take payment — it tells VoltTech to continue to the invoice stage.";
    total.textContent=m(q.total);actions.hidden=false;return;
  }

  if(q.status==="accepted"){
    box.hidden=false;box.dataset.state="done";kicker.textContent="Decision recorded";title.textContent=`${q.quote_number} accepted`;
    copy.textContent="VoltTech has been notified. Your invoice will appear in your account when it is issued.";
    actions.hidden=true;return;
  }

  if(q.status==="declined"){
    box.hidden=false;box.dataset.state="declined";kicker.textContent="Decision recorded";title.textContent=`${q.quote_number} declined`;
    copy.textContent="This quotation has been declined. Contact VoltTech if you want it revised or reissued.";
    actions.hidden=true;return;
  }

  box.hidden=true;
}

async function act(action){
  if(busy||!currentQuote||!currentSession)return;
  if(currentQuote.user_id!==currentSession.user.id)return;
  if(expired(currentQuote)||!["sent","viewed"].includes(currentQuote.status))return;

  const accept=action==="accepted";
  const ok=await VoltTechDialog.confirm({
    kicker:accept?"QUOTE / ACCEPT":"QUOTE / DECLINE",
    title:accept?`Accept ${currentQuote.quote_number}?`:`Decline ${currentQuote.quote_number}?`,
    message:accept
      ?`You are approving this quotation for ${m(currentQuote.total)}. No payment is taken now; VoltTech can then issue the invoice.`
      :"This records the quotation as declined. No payment will be taken.",
    confirmText:accept?"Accept quote":"Decline quote",
    tone:accept?undefined:"danger"
  });
  if(!ok)return;

  busy=true;
  const a=document.querySelector("#quoteAccept"),dBtn=document.querySelector("#quoteDecline"),status=document.querySelector("#quoteDecisionStatus");
  if(a)a.disabled=true;if(dBtn)dBtn.disabled=true;if(status)status.textContent="Updating your decision…";

  try{
    const{error}=await c.rpc("customer_quote_action",{p_quote_id:currentQuote.id,p_action:action});
    if(error){if(status)status.textContent=error.message;return}
    try{await c.rpc("snapshot_quote",{p_quote_id:currentQuote.id})}catch{}
    await load();
  }finally{
    busy=false;
  }
}

async function load(){
  const{data:{session}}=await c.auth.getSession();
  if(!session){location.replace(loginUrl());return}
  currentSession=session;

  const id=new URLSearchParams(location.search).get("id");
  if(!id){root.innerHTML="<p>Quote not specified.</p>";return}
  const{data:q,error}=await c.from("quotes")
    .select("id,user_id,quote_number,quote_type,title,status,subtotal,total,delivery_fee,discount_total,valid_until,customer_note,created_at,terms_version,quote_items(position,description,quantity,line_total)")
    .eq("id",id).maybeSingle();
  if(error||!q){root.innerHTML="<p>Quotation could not be loaded.</p>";return}
  currentQuote=q;

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

  renderDecision(q,session);

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

document.querySelector("#quoteAccept")?.addEventListener("click",()=>act("accepted"));
document.querySelector("#quoteDecline")?.addEventListener("click",()=>act("declined"));
load();
})();