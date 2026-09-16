(()=>{
const c=supabase.createClient(VOLTTECH_SUPABASE.url,VOLTTECH_SUPABASE.publishableKey),e=document.querySelector("#quotes"),s=document.querySelector("#status"),modal=document.querySelector("#confirmModal");
const x=v=>String(v??"").replace(/[&<>"]/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[a])),m=n=>new Intl.NumberFormat("en-ZA",{style:"currency",currency:"ZAR"}).format(Number(n||0)),date=v=>v?new Intl.DateTimeFormat("en-ZA",{day:"numeric",month:"short",year:"numeric"}).format(new Date(v.includes("T")?v:v+"T12:00:00")):"—";
let pending=null,rows=[],lastFocus=null;const busy=new Set();
const loginUrl=()=>`account.html?returnTo=${encodeURIComponent(location.pathname+location.search+location.hash)}`;
function isExpired(q){if(!q?.valid_until||!["sent","viewed"].includes(q.status))return false;const end=new Date(`${q.valid_until}T23:59:59`);return !Number.isNaN(end.getTime())&&end.getTime()<Date.now()}
function effectiveStatus(q){return isExpired(q)?"expired":q.status}
function text(q){return[q.quote_number,q.quote_type,q.title,effectiveStatus(q),q.customer_note,...(q.quote_items||[]).flatMap(i=>[i.description,i.quantity])].filter(Boolean).join(" ").toLowerCase()}
function render(){
 const term=(document.querySelector("#quoteSearch")?.value||"").trim().toLowerCase(),filter=document.querySelector("#quoteStatusFilter")?.value||"";
 const data=rows.filter(q=>(!filter||effectiveStatus(q)===filter)&&(!term||text(q).includes(term)));
 e.innerHTML=data.length?data.map(q=>{const expired=isExpired(q),status=effectiveStatus(q),locked=busy.has(q.id);return`<article class="card"><div class="head"><div><span class="num">${x(q.quote_number)}</span><h2>${x(q.title)}</h2></div><span class="pill">${x(status)}</span></div><div class="meta">Issued ${date(q.created_at)} · Valid until ${date(q.valid_until)}</div><div class="items">${[...(q.quote_items||[])].sort((a,b)=>a.position-b.position).map(i=>`<div class="item"><span>${i.quantity} × ${x(i.description)}</span><b>${m(i.line_total)}</b></div>`).join("")}</div><div class="total"><span>Total</span><b>${m(q.total)}</b></div>${q.customer_note?`<p class="note">${x(q.customer_note)}</p>`:""}${expired?'<p class="note">This quotation has passed its validity date. Contact VoltTech if you need it reissued.</p>':""}<div class="actions"><a class="btn teal" href="quote.html?id=${encodeURIComponent(q.id)}">View / PDF</a><button class="btn" data-email-kind="quote" data-email-id="${q.id}">Email copy</button>${["sent","viewed"].includes(q.status)&&!expired?`<button class="btn primary" data-a="accepted" data-id="${q.id}" data-num="${x(q.quote_number)}" data-total="${q.total}" ${locked?"disabled":""}>${locked?"Updating…":"Accept quote"}</button><button class="btn danger" data-a="declined" data-id="${q.id}" data-num="${x(q.quote_number)}" ${locked?"disabled":""}>${locked?"Updating…":"Decline"}</button>`:""}</div></article>`}).join(""):'<p class="empty">No quotations match that search.</p>';
 s.textContent=rows.length?`${data.length} of ${rows.length} quotation${rows.length===1?"":"s"}`:"";
 document.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>b.dataset.a==="accepted"?ask(b):decline(b))
}
async function load(){
 const{data:{session}}=await c.auth.getSession();if(!session){location.replace(loginUrl());return}
 const{data,error}=await c.from("quotes").select("id,quote_number,quote_type,title,status,subtotal,total,delivery_fee,discount_total,valid_until,customer_note,created_at,terms_version,quote_items(position,description,quantity,line_total)").order("created_at",{ascending:false});
 if(error){e.innerHTML=`<p class="empty">${x(error.message)}</p>`;return}
 rows=data||[];render()
}
function ask(b){
 const row=rows.find(q=>q.id===b.dataset.id);if(!row||isExpired(row)){s.textContent="This quotation has expired and can no longer be accepted from this page.";render();return}
 pending=b.dataset.id;lastFocus=b;document.querySelector("#modalText").textContent=`You're accepting quote ${b.dataset.num} for:`;document.querySelector("#modalAmount").textContent=m(b.dataset.total);modal.hidden=false;document.querySelector("#modalAccept").focus()
}
function close({restore=true}={}){pending=null;modal.hidden=true;if(restore&&lastFocus?.isConnected)lastFocus.focus();lastFocus=null}
function trapFocus(ev){
 if(modal.hidden)return;
 if(ev.key==="Escape"){ev.preventDefault();close();return}
 if(ev.key!=="Tab")return;
 const f=[...modal.querySelectorAll('button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')].filter(el=>!el.hidden);
 if(!f.length)return;const first=f[0],last=f[f.length-1];
 if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus()}else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus()}
}
async function decline(b){
 const row=rows.find(q=>q.id===b.dataset.id);if(!row||isExpired(row)){s.textContent="This quotation has expired and can no longer be declined from this page.";render();return}
 const ok=await VoltTechDialog.confirm({kicker:"QUOTE / DECLINE",title:`Decline ${b.dataset.num}?`,message:"This records the quotation as declined in your VoltTech account. No payment will be taken.",confirmText:"Decline quote",tone:"danger"});
 if(ok)await act(b.dataset.id,"declined")
}
async function act(id,a){
 if(busy.has(id))return;const row=rows.find(q=>q.id===id);if(!row||isExpired(row)){s.textContent="This quotation has passed its validity date. Ask VoltTech to reissue it if needed.";render();return}
 busy.add(id);render();s.textContent="Updating…";
 try{const{error}=await c.rpc("customer_quote_action",{p_quote_id:id,p_action:a});s.textContent=error?error.message:(a==="accepted"?"Quote accepted.":"Quote declined.");if(!error){try{await c.rpc("snapshot_quote",{p_quote_id:id})}catch{}await load()}}
 finally{busy.delete(id);render()}
}
document.querySelector("#modalCancel").onclick=()=>close();document.querySelector("#modalAccept").onclick=async()=>{const id=pending;close({restore:false});if(id)await act(id,"accepted")};modal.onclick=v=>{if(v.target===modal)close()};document.addEventListener("keydown",trapFocus);
document.querySelector("#quoteSearch")?.addEventListener("input",render);document.querySelector("#quoteStatusFilter")?.addEventListener("change",render);load()
})();
