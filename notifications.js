(()=>{
  if(!window.supabase||!window.VOLTTECH_SUPABASE)return;
  const page=(location.pathname.split("/").pop()||"index.html").toLowerCase();
  const adminMode=page.startsWith("admin");
  const client=window.volttechAuth||window.supabase.createClient(VOLTTECH_SUPABASE.url,VOLTTECH_SUPABASE.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  let user=null,rows=[],channel=null,opened=false;
  const q=s=>document.querySelector(s);
  const esc=v=>String(v??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[a]));
  const relative=v=>{const ms=Date.now()-new Date(v).getTime(),m=Math.floor(ms/60000);if(m<1)return"now";if(m<60)return`${m}m`;const h=Math.floor(m/60);if(h<24)return`${h}h`;const d=Math.floor(h/24);if(d<7)return`${d}d`;return new Intl.DateTimeFormat("en-ZA",{day:"numeric",month:"short"}).format(new Date(v))};

  function mount(){
    if(q("#vtNotifyButton"))return;
    const button=document.createElement("button");button.id="vtNotifyButton";button.className="vt-notify-button";button.type="button";button.setAttribute("aria-label","Open notifications");button.setAttribute("aria-expanded","false");
    button.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg><span class="vt-notify-count" id="vtNotifyCount" hidden>0</span>`;document.body.append(button);
    const panel=document.createElement("section");panel.id="vtNotifyPanel";panel.className="vt-notify-panel";panel.hidden=true;panel.setAttribute("aria-label","Notifications");
    panel.innerHTML=`<div class="vt-notify-head"><div><small>${adminMode?"VoltTech Admin":"Your VoltTech account"}</small><h2>Notifications</h2></div><button id="vtNotifyMarkAll" class="vt-notify-markall" type="button">Mark all read</button></div><div id="vtNotifyList" class="vt-notify-list"></div>`;document.body.append(panel);
    button.addEventListener("click",()=>{opened=!opened;panel.hidden=!opened;button.setAttribute("aria-expanded",String(opened))});
    q("#vtNotifyMarkAll").addEventListener("click",markAllRead);
    document.addEventListener("click",e=>{if(!opened||e.target.closest("#vtNotifyPanel,#vtNotifyButton"))return;opened=false;panel.hidden=true;button.setAttribute("aria-expanded","false")});
  }
  async function verifyAudience(){if(!adminMode)return true;const{data,error}=await client.rpc("is_volttech_admin");return !error&&data===true}
  function queryBase(){let r=client.from("notifications").select("id,recipient_user_id,recipient_role,event_type,title,message,action_url,entity_type,entity_id,priority,read_at,created_at").is("archived_at",null);return adminMode?r.eq("recipient_role","admin"):r.eq("recipient_role","customer").eq("recipient_user_id",user.id)}
  async function refresh(){const{data,error}=await queryBase().order("created_at",{ascending:false}).limit(40);if(error){if(String(error.message||"").toLowerCase().includes("notifications")){q("#vtNotifyButton")?.remove();q("#vtNotifyPanel")?.remove();q("#vtNotifyBanner")?.remove()}return}rows=data||[];render()}
  function render(){
    const unread=rows.filter(r=>!r.read_at),count=q("#vtNotifyCount");count.textContent=unread.length>99?"99+":String(unread.length);count.hidden=!unread.length;
    const list=q("#vtNotifyList");
    list.innerHTML=rows.length?rows.map(r=>`<button type="button" class="vt-notify-item ${r.read_at?"":"unread"} ${(r.priority==="high"||r.priority==="urgent")?"high":""}" data-notification="${esc(r.id)}"><span class="vt-notify-title"><span>${esc(r.title)}</span><time>${esc(relative(r.created_at))}</time></span>${r.message?`<span class="vt-notify-message">${esc(r.message)}</span>`:""}${r.action_url?'<span class="vt-notify-action">Open →</span>':""}</button>`).join(""):'<div class="vt-notify-empty">You’re all caught up.</div>';
    list.querySelectorAll("[data-notification]").forEach(b=>b.addEventListener("click",()=>openNotification(b.dataset.notification)));renderBanner(unread);
  }
  function renderBanner(unread){
    q("#vtNotifyBanner")?.remove();const n=unread.find(r=>r.priority==="urgent"||r.priority==="high");if(!n)return;
    const host=document.querySelector("#accountHub .profile-head")||document.querySelector("#app")||document.querySelector("main");if(!host)return;
    const banner=document.createElement("div");banner.id="vtNotifyBanner";banner.className="vt-notify-banner";banner.innerHTML=`<div class="vt-notify-banner-inner"><div><small>Action required</small><b>${esc(n.title)}</b>${n.message?`<p>${esc(n.message)}</p>`:""}</div><button type="button">Open</button></div>`;
    banner.querySelector("button").addEventListener("click",()=>openNotification(n.id));if(host.matches("#app"))host.prepend(banner);else host.insertAdjacentElement("afterend",banner);
  }
  async function markRead(id){const n=rows.find(r=>r.id===id);if(!n||n.read_at)return;const{error}=await client.from("notifications").update({read_at:new Date().toISOString()}).eq("id",id);if(!error){n.read_at=new Date().toISOString();render()}}
  async function markAllRead(){if(!rows.some(r=>!r.read_at))return;let upd=client.from("notifications").update({read_at:new Date().toISOString()}).is("read_at",null).is("archived_at",null);upd=adminMode?upd.eq("recipient_role","admin"):upd.eq("recipient_role","customer").eq("recipient_user_id",user.id);const{error}=await upd;if(!error)refresh()}
  async function openNotification(id){const n=rows.find(r=>r.id===id);if(!n)return;await markRead(id);if(!n.action_url)return;try{const url=new URL(n.action_url,location.origin);if(url.origin===location.origin)location.href=`${url.pathname}${url.search}${url.hash}`}catch{}}
  function toast(n){q("#vtNotifyToast")?.remove();const t=document.createElement("button");t.id="vtNotifyToast";t.type="button";t.className="vt-notify-toast";t.innerHTML=`<b>${esc(n.title||"New VoltTech notification")}</b>${n.message?`<span>${esc(n.message)}</span>`:""}`;t.addEventListener("click",()=>{refresh().then(()=>openNotification(n.id))});document.body.append(t);setTimeout(()=>t.remove(),6500)}
  function relevant(n){if(!n)return false;return adminMode?n.recipient_role==="admin":n.recipient_role==="customer"&&n.recipient_user_id===user.id}
  function subscribe(){if(channel)client.removeChannel(channel);channel=client.channel(`vt-notifications-${adminMode?"admin":user.id}-${Math.random().toString(36).slice(2,8)}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications"},p=>{if(!relevant(p.new))return;toast(p.new);refresh()}).on("postgres_changes",{event:"UPDATE",schema:"public",table:"notifications"},p=>{if(relevant(p.new))refresh()}).subscribe()}
  async function init(){const{data:{session}}=await client.auth.getSession();if(!session?.user)return;user=session.user;if(!(await verifyAudience()))return;mount();await refresh();subscribe()}
  document.addEventListener("DOMContentLoaded",init);window.addEventListener("beforeunload",()=>{if(channel)client.removeChannel(channel)});
})();
