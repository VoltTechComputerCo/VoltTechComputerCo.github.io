
(()=>{
const c=supabase.createClient(VOLTTECH_SUPABASE.url,VOLTTECH_SUPABASE.publishableKey),q=s=>document.querySelector(s),x=v=>String(v??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[a]));
let rows=[],names=new Map;
async function load(){
 const{data:{session}}=await c.auth.getSession();if(!session){location.href="account.html?returnTo=%2Fadmin-deletions.html";return}
 const{data:ok}=await c.rpc("is_volttech_admin");if(ok!==true){location.replace("account.html");return}
 const[{data,error},{data:customers}]=await Promise.all([c.from("account_deletion_requests").select("*").in("status",["requested","processing"]).order("requested_at",{ascending:true}),c.rpc("admin_customers")]);
 names=new Map((customers||[]).map(v=>[v.id,v]));if(error){q("#status").textContent=error.message;return}rows=data||[];render()
}
function searchable(r){const p=names.get(r.user_id)||{};return[p.full_name,p.billing_email,p.phone,p.company_name,p.suburb,r.id,r.user_id,r.status,r.requested_at,r.recovery_until].filter(Boolean).join(" ").toLowerCase()}
function render(){
 const term=(q("#deletionSearch")?.value||"").trim().toLowerCase(),list=rows.filter(r=>!term||searchable(r).includes(term));
 q("#status").textContent=`${list.length} of ${rows.length} active deletion request${rows.length===1?"":"s"}`;
 q("#requests").innerHTML=list.length?list.map(card).join(""):'<p class="empty">No deletion requests match that search.</p>';
 document.querySelectorAll("[data-finalize]").forEach(b=>b.onclick=()=>finalize(b.dataset.finalize))
}
function card(r){const p=names.get(r.user_id)||{},due=new Date(r.recovery_until),ready=Date.now()>=due.getTime();return`<article class="card"><div class="head"><div><span class="num">${x(p.full_name||p.billing_email||r.user_id)}</span><h2>Account deletion</h2></div><span class="pill">${ready?"Ready":"Recovery window"}</span></div><div class="meta">Request ${x(r.id)}<br>Requested ${new Date(r.requested_at).toLocaleString("en-ZA")} · Recovery until ${due.toLocaleString("en-ZA")}</div><div class="actions"><button class="btn danger" data-finalize="${r.id}" ${ready?"":"disabled"}>${ready?"Finalise deletion":"Wait until recovery ends"}</button></div></article>`}
async function finalize(id){
 const r=rows.find(x=>x.id===id),p=r?names.get(r.user_id)||{}:{};
 const ok=await VoltTechDialog.confirm({kicker:"ADMIN / PRIVACY",title:"Finalise account deletion?",message:`${p.full_name||p.billing_email||"This customer"} will lose login access. Final Supabase soft deletion is irreversible after this step.`,confirmText:"Finalise deletion",tone:"danger"});
 if(!ok)return;q("#status").textContent="Finalising deletion…";
 const{error}=await c.functions.invoke("finalize-account-deletion",{body:{request_id:id}});
 q("#status").textContent=error?(error.message||"Could not finalise deletion."):"Account deletion finalised.";if(!error)load()
}
q("#deletionSearch")?.addEventListener("input",render);document.addEventListener("DOMContentLoaded",load)
})();
