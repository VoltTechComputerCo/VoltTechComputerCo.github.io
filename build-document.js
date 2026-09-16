(()=>{
const c=supabase.createClient(VOLTTECH_SUPABASE.url,VOLTTECH_SUPABASE.publishableKey);
const root=document.querySelector("#document");
const x=v=>String(v??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[a]));
const m=n=>new Intl.NumberFormat("en-ZA",{style:"currency",currency:"ZAR",maximumFractionDigits:0}).format(Number(n||0));
const d=v=>v?new Intl.DateTimeFormat("en-ZA",{dateStyle:"long"}).format(new Date(v)):"—";
const shortRef=id=>`VT-BLD-${String(id||"").replace(/-/g,"").slice(0,8).toUpperCase()}`;
const fileSafe=v=>String(v||"document").replace(/[^A-Za-z0-9_-]+/g,"_").replace(/^_+|_+$/g,"");
function buildStatus(b,quote){
  if(quote){
    const s=String(quote.status||"").toLowerCase();
    if(s==="accepted") return "Formal quote accepted";
    if(s==="declined") return "Formal quote declined";
    if(s==="sent"||s==="viewed") return "Formal quote issued";
    if(s==="draft") return "Formal quote prepared";
    return `Formal quote ${s||"linked"}`;
  }
  const s=String(b.status||"saved");
  if(s==="quote_requested") return "Quote review requested";
  if(s==="quoted") return "Formal quote issued";
  if(s==="archived") return "Archived configuration";
  return "Saved configuration";
}
async function load(){
  const{data:{session}}=await c.auth.getSession();
  if(!session){location.href="account.html";return}
  const id=new URLSearchParams(location.search).get("id");
  const{data:b,error}=await c.from("saved_builds").select("*").eq("id",id).maybeSingle();
  if(error||!b){root.innerHTML="<p>Build could not be loaded.</p>";return}

  let quote=null;
  if(b.quote_id){
    const qr=await c.from("quotes").select("id,quote_number,status").eq("id",b.quote_id).maybeSingle();
    if(!qr.error) quote=qr.data;
  }

  const ref=shortRef(b.id);
  document.title=`VoltTech_PC_Build_Spec_${fileSafe(ref)}`;VoltTechPrint.setName(document.title);

  const email=document.querySelector("#emailCopy");
  email.hidden=false;email.dataset.emailKind="build";email.dataset.emailId=id;

  const items=b.build_data?.items||[];
  const quoteLine=quote
    ? `<a href="quote.html?id=${encodeURIComponent(quote.id)}">${x(quote.quote_number)}</a> · ${x(buildStatus(b,quote))}`
    : "Not issued yet";

  root.innerHTML=`<article class="sheet">
    <div class="top">
      <div class="brand"><div class="brandline"><img src="logo-badge.png" alt=""><h1>VoltTech Computer Co.</h1></div><p>PC Builder configuration</p></div>
      <div class="doc"><h2>Build Spec</h2><div class="num">${x(ref)}</div><p class="meta">${x(buildStatus(b,quote))}</p></div>
    </div>
    <div class="grid">
      <div class="block"><strong>Configuration</strong><p>${x(b.name||"Custom PC")}<br>${items.length} selected part${items.length===1?"":"s"}<br>Compatibility: ${x(b.compatibility_status||"review")}</p></div>
      <div class="block"><strong>Estimate</strong><p>${m(b.estimated_total)}${b.estimated_power_watts?`<br>${x(b.estimated_power_watts)} W estimated system load`:""}</p></div>
    </div>
    <div class="grid">
      <div class="block"><strong>Build reference</strong><p>${x(ref)}</p></div>
      <div class="block"><strong>Formal quotation</strong><p>${quoteLine}</p></div>
    </div>
    <table class="items"><thead><tr><th>Component</th><th>Qty</th><th>Estimated price</th></tr></thead><tbody>${items.map(i=>`<tr><td>${x(i.name)}</td><td>${i.quantity||1}</td><td>${m((i.unit_price||0)*(i.quantity||1))}</td></tr>`).join("")}</tbody></table>
    <div class="notice">Generated ${d(b.updated_at)}. This is a PC build specification, not a quotation or invoice. Builder figures remain estimates until VoltTech issues a formal quotation.</div>
  </article>`;
}
load();
})();