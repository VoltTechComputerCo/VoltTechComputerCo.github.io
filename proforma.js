(()=>{
const c=supabase.createClient(VOLTTECH_SUPABASE.url,VOLTTECH_SUPABASE.publishableKey),r=document.querySelector("#document");
const x=v=>String(v??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[a]));
const m=n=>new Intl.NumberFormat("en-ZA",{style:"currency",currency:"ZAR"}).format(Number(n||0));
const d=v=>v?new Intl.DateTimeFormat("en-ZA",{dateStyle:"long"}).format(new Date(v)):"—";
const fs=v=>String(v||"document").replace(/[^A-Za-z0-9_-]+/g,"_").replace(/^_+|_+$/g,"");
const ref=p=>p.proforma_number||`VT-PRO-${String(p.id||"").replace(/-/g,"").slice(0,8).toUpperCase()}`;
async function load(){
 const{data:{session}}=await c.auth.getSession();if(!session){location.href="account.html";return}
 const id=new URLSearchParams(location.search).get("id"),{data:p,error}=await c.from("proformas").select("*").eq("id",id).maybeSingle();
 if(error||!p){r.innerHTML="<p>Proforma could not be loaded.</p>";return}
 const proRef=ref(p);document.title=`VoltTech_Proforma_${fs(proRef)}`;VoltTechPrint.setName(document.title);
 const e=document.querySelector("#emailCopy");e.hidden=false;e.dataset.emailKind="proforma";e.dataset.emailId=id;
 r.innerHTML=`<article class="sheet"><div class="top"><div class="brand"><div class="brandline"><img src="logo-badge.png" alt=""><h1>VoltTech Computer Co.</h1></div><p>Proforma document</p></div><div class="doc"><h2>Proforma</h2><div class="num">${x(proRef)}</div></div></div><div class="grid"><div class="block"><strong>Created</strong><p>${d(p.created_at)}</p></div><div class="block"><strong>Total</strong><p>${m(p.total)}</p></div></div><div class="notice">A proforma is not proof of payment. Refer to the final invoice/receipt for the completed transaction.</div></article>`;
}
load();
})();