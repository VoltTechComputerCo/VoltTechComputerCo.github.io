
(()=>{
const c=supabase.createClient(VOLTTECH_SUPABASE.url,VOLTTECH_SUPABASE.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const q=s=>document.querySelector(s),money=n=>new Intl.NumberFormat("en-ZA",{style:"currency",currency:"ZAR",maximumFractionDigits:0}).format(Number(n||0)),esc=v=>String(v??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[a]));
const REQ=["cpu","motherboard","memory","gpu","case","cooler","psu","storage"];let rows=[];
const status=(m="",t="")=>{q("#status").textContent=m;q("#status").dataset.type=t};
const label=v=>({saved:"Saved",quote_requested:"Quote requested",quoted:"Quoted",archived:"Archived"}[v]||v||"Saved");
const date=v=>v?new Intl.DateTimeFormat("en-ZA",{dateStyle:"medium",timeStyle:"short"}).format(new Date(v)):"—";
const buildRef=id=>`VT-BLD-${String(id||"").replace(/-/g,"").slice(0,8).toUpperCase()}`;
function share(v){return btoa(JSON.stringify(v||{})).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"")}
function complete(r){const s=r?.build_data?.serialized||{},cats=s.categories||{};return REQ.every(t=>t==="gpu"&&s.gpuOptional===true?true:Array.isArray(cats[t])&&cats[t].length)}
function searchText(r){return [r.name,r.status,buildRef(r.id),r.quote_id,...(r.build_data?.items||[]).flatMap(i=>[i.name,i.type,i.brand])].filter(Boolean).join(" ").toLowerCase()}
function card(r){
 const items=r.build_data?.items||[],names=items.slice(0,6).map(i=>i.name).join(" · ")+(items.length>6?` · +${items.length-6} more`:""),s=r.status||"saved",canDelete=["saved","archived"].includes(s),canQuote=s==="saved"&&complete(r)&&r.compatibility_status!=="conflict";
 return`<article class="card"><div class="head"><div><span class="mini">${esc(buildRef(r.id))} · Updated ${esc(date(r.updated_at))}</span><h2>${esc(r.name||"VoltTech PC Build")}</h2></div><span class="pill">${esc(label(s))}</span></div><div class="total"><span>${items.length} selected part${items.length===1?"":"s"}${r.estimated_power_watts?` · ${esc(r.estimated_power_watts)} W est.`:""}</span><b>${money(r.estimated_total)}</b></div><p class="parts">${esc(names||"Saved component configuration")}</p><div class="actions"><a class="btn teal" href="build-document.html?id=${encodeURIComponent(r.id)}">View / PDF</a><button class="btn" data-email-kind="build" data-email-id="${esc(r.id)}">Email copy</button><button class="btn teal" data-resume="${esc(r.id)}">Resume build</button>${canQuote?`<button class="btn primary" data-quote="${esc(r.id)}">Request quote</button>`:s==="saved"?`<button class="btn" disabled>Finish build first</button>`:""}${r.quote_id?`<a class="btn primary" href="quotes.html">Open quote</a>`:""}${canDelete?`<button class="btn danger" data-delete="${esc(r.id)}">Delete</button>`:""}</div></article>`
}
function render(){
 const term=(q("#buildSearch")?.value||"").trim().toLowerCase(),filter=q("#buildStatusFilter")?.value||"";
 const list=rows.filter(r=>(!filter||r.status===filter)&&(!term||searchText(r).includes(term)));
 q("#builds").innerHTML=list.length?list.map(card).join(""):'<p class="empty">No builds match that search.</p>';
 status(rows.length?`${list.length} of ${rows.length} saved build${rows.length===1?"":"s"}`:"");
 document.querySelectorAll("[data-resume]").forEach(b=>b.onclick=()=>resume(b.dataset.resume));
 document.querySelectorAll("[data-quote]").forEach(b=>b.onclick=()=>requestQuote(b.dataset.quote));
 document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>remove(b.dataset.delete));
}
async function load(){
 status("Loading saved builds…");
 const{data,error}=await c.from("saved_builds").select("id,name,status,build_data,estimated_total,estimated_power_watts,compatibility_status,quote_id,quote_requested_at,updated_at").order("updated_at",{ascending:false});
 if(error){status(error.message,"error");q("#builds").innerHTML='<p class="empty">Could not load saved builds.</p>';return}
 rows=data||[];render();
}
function resume(id){const r=rows.find(v=>v.id===id);if(!r)return;location.href=`builder/?savedBuild=${encodeURIComponent(id)}&build=${encodeURIComponent(share(r.build_data?.serialized||{}))}`}
async function requestQuote(id){
 const r=rows.find(v=>v.id===id);if(!r||!complete(r)||r.compatibility_status==="conflict"){status("Finish the core build and resolve hard compatibility conflicts before requesting a quote.","error");return}
 const ok=await VoltTechDialog.confirm({kicker:"PC BUILD / QUOTE",title:"Send this build for quotation?",message:"VoltTech will receive this configuration for stock, compatibility and price review before issuing a formal quotation.",confirmText:"Request quote"});
 if(!ok)return;
 status("Submitting build for VoltTech review…");const now=new Date().toISOString(),{error}=await c.from("saved_builds").update({status:"quote_requested",quote_requested_at:now,updated_at:now}).eq("id",id).eq("status","saved");
 if(error){status(error.message,"error");return}try{await c.rpc("snapshot_saved_build",{p_build_id:id})}catch{}status("Quote request sent to VoltTech.","success");load()
}
async function remove(id){
 const r=rows.find(v=>v.id===id);if(!r)return;
 const ok=await VoltTechDialog.confirm({kicker:"PC BUILD / DELETE",title:"Delete this saved PC build?",message:`${r.name||"This build"} will be removed from your account. Formal quotes or invoices already issued are not deleted.`,confirmText:"Delete build",tone:"danger"});
 if(!ok)return;
 const{error}=await c.from("saved_builds").delete().eq("id",id).in("status",["saved","archived"]);
 if(error){status(error.message,"error");return}status("Saved build deleted.","success");rows=rows.filter(x=>x.id!==id);render()
}
async function init(){
 const{data:{session}}=await c.auth.getSession();if(!session?.user){location.replace(`account.html?returnTo=${encodeURIComponent("/builds.html")}`);return}
 q("#buildSearch")?.addEventListener("input",render);q("#buildStatusFilter")?.addEventListener("change",render);load()
}
document.addEventListener("DOMContentLoaded",init)
})();
