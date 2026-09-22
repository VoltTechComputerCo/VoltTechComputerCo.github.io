(()=>{
  if(window.__voltTechNotificationsV5)return;
  window.__voltTechNotificationsV5=true;
  if(!window.supabase||!window.VOLTTECH_SUPABASE)return;

  const page=(location.pathname.split("/").pop()||"index.html").toLowerCase();
  const adminContext=page.startsWith("admin");
  const customerPages=new Set(["account.html","activity.html","builds.html","quotes.html","documents.html","privacy-center.html"]);
  const customerContext=customerPages.has(page);
  const context=adminContext?"admin":customerContext?"customer":"site";

  const client=window.volttechAuth||window.supabase.createClient(
    VOLTTECH_SUPABASE.url,
    VOLTTECH_SUPABASE.publishableKey,
    {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}
  );

  const SOUND_KEY="volttech_notification_sound";
  let user=null,rows=[],channel=null,opened=false,isAdmin=false,button=null,panel=null,scrim=null;
  let audioCtx=null,audioUnlocked=false,initialisedFor=null;
  const realtimeSeen=new Set();
  const q=s=>document.querySelector(s);
  const esc=v=>String(v??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[a]));
  const soundEnabled=()=>localStorage.getItem(SOUND_KEY)!=="off";
  const roleLabel=(role,priority)=>{
    const action=priority==="high"||priority==="urgent";
    if(action)return role==="admin"?"ADMIN ACTION":"ACTION REQUIRED";
    return role==="admin"?"ADMIN UPDATE":"CUSTOMER UPDATE";
  };
  const relative=v=>{
    const ms=Date.now()-new Date(v).getTime(),m=Math.floor(ms/60000);
    if(m<1)return"now";if(m<60)return`${m}m`;
    const h=Math.floor(m/60);if(h<24)return`${h}h`;
    const d=Math.floor(h/24);if(d<7)return`${d}d`;
    return new Intl.DateTimeFormat("en-ZA",{day:"numeric",month:"short"}).format(new Date(v));
  };

  async function ensureServiceWorker(){
    if(document.documentElement.dataset.vtShell==="clean")return;
    if(!("serviceWorker" in navigator)||location.protocol!=="https:")return;
    try{
      const reg=await navigator.serviceWorker.register("/sw.js?v=5.2.0");
      reg.update().catch(()=>{});
    }catch{}
  }

  function findPlacement(){
    const cleanHost=document.querySelector("[data-notifications-host]");
    if(cleanHost)return cleanHost;
    if(adminContext){
      return document.querySelector(".top .portal-admin-nav,.top .tools,nav .portal-admin-nav,nav .wrap");
    }
    if(page==="index.html"&&location.pathname.includes("/builder/")){
      return document.querySelector(".topbar .top-actions,.topbar .topbar-inner");
    }
    if(location.pathname.includes("/builder/")){
      return document.querySelector(".topbar .top-actions,.topbar .topbar-inner");
    }
    const wrap=document.querySelector("nav .wrap");
    if(wrap)return wrap;
    return document.querySelector("header");
  }

  function placeButton(){
    if(!button)return;
    const host=findPlacement();
    if(!host){
      if(!button.isConnected)document.body.append(button);
      button.classList.add("is-floating");
      return;
    }

    button.classList.remove("is-floating");

    if(host.matches(".top-actions")){
      host.prepend(button);
      return;
    }

    if(host.matches(".portal-admin-nav,.tools")){
      host.prepend(button);
      return;
    }

    const mobile=host.querySelector(":scope > .vt-mobile-menu-btn");
    if(mobile){
      host.insertBefore(button,mobile);
      return;
    }

    const home=host.querySelector(":scope > .home");
    if(home){
      host.insertBefore(button,home);
      return;
    }

    const group=host.querySelector(":scope > .portal-customer-nav,:scope > .navlinks,:scope > .v4-page-nav,:scope > .portal-admin-nav");
    if(group){
      host.insertBefore(button,group);
      return;
    }

    host.append(button);
  }

  function setOpen(next){
    opened=!!next;
    if(panel)panel.hidden=!opened;
    if(scrim)scrim.hidden=!opened;
    if(button)button.setAttribute("aria-expanded",String(opened));
    document.documentElement.classList.toggle("vt-notify-open",opened);
    if(opened)requestAnimationFrame(positionPanel);
    if(document.documentElement.dataset.vtShell==="clean"){
      if(opened)q("#vtNotifyClose")?.focus();
      else if(panel?.contains(document.activeElement))button?.focus();
    }
  }

  function positionPanel(){
    if(!opened||!panel||!button)return;
    const r=button.getBoundingClientRect();
    const gap=9,edge=12;
    const width=Math.min(360,window.innerWidth-(edge*2));
    let left=r.right-width;
    left=Math.max(edge,Math.min(left,window.innerWidth-width-edge));
    let top=r.bottom+gap;
    const estimated=Math.min(window.innerHeight*.68,620);
    if(top+estimated>window.innerHeight-edge){
      top=Math.max(edge,r.top-gap-Math.min(estimated,r.top-gap-edge));
    }
    panel.style.width=`${width}px`;
    panel.style.left=`${Math.round(left)}px`;
    panel.style.top=`${Math.round(top)}px`;
    panel.style.setProperty("--vt-panel-anchor",`${Math.max(24,Math.min(width-24,(r.left+r.width/2)-left))}px`);
  }

  function mount(){
    button=q("#vtNotifyButton");
    panel=q("#vtNotifyPanel");
    scrim=q("#vtNotifyScrim");

    if(!button){
      button=document.createElement("button");
      button.id="vtNotifyButton";
      button.className="vt-notify-button is-empty";
      button.type="button";
      button.setAttribute("aria-label","Open notifications");
      button.setAttribute("aria-expanded","false");
      button.setAttribute("aria-controls","vtNotifyPanel");
      button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg><span class="vt-notify-count" id="vtNotifyCount" hidden>0</span>';
      placeButton();
    }else{
      placeButton();
    }

    if(!scrim){
      scrim=document.createElement("div");
      scrim.id="vtNotifyScrim";
      scrim.className="vt-notify-scrim";
      scrim.hidden=true;
      document.body.append(scrim);
      scrim.addEventListener("click",()=>setOpen(false));
    }

    if(!panel){
      panel=document.createElement("section");
      panel.id="vtNotifyPanel";
      panel.className="vt-notify-panel";
      panel.hidden=true;
      panel.setAttribute("aria-label","Notifications");
      if(document.documentElement.dataset.vtShell==="clean"){
        panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","true");
      }
      document.body.append(panel);
    }

    const heading=adminContext?"Admin notifications":customerContext?"My notifications":"Notifications";
    const kicker=adminContext?"VOLTTECH / ADMIN":customerContext?"VOLTTECH / CUSTOMER":isAdmin?"ADMIN + CUSTOMER":"VOLTTECH / CUSTOMER";
    panel.classList.remove("context-admin","context-customer","context-hybrid");
    panel.classList.add(adminContext?"context-admin":customerContext?"context-customer":isAdmin?"context-hybrid":"context-customer");
    panel.innerHTML=`<div class="vt-notify-head"><div><small>${kicker}</small><h2>${heading}</h2></div><div class="vt-notify-head-actions"><button id="vtNotifySound" class="vt-notify-sound" type="button" aria-pressed="${soundEnabled()}">${soundEnabled()?"Sound On":"Sound Off"}</button><button id="vtNotifyMarkAll" class="vt-notify-markall" type="button">Mark all read</button></div><button id="vtNotifyClose" class="vt-notify-close" type="button" aria-label="Close notifications">×</button></div><div id="vtNotifyList" class="vt-notify-list"></div>`;

    if(!button.dataset.vtBound){
      button.dataset.vtBound="1";
      button.addEventListener("click",()=>setOpen(!opened));
    }

    q("#vtNotifyMarkAll")?.addEventListener("click",markAllRead);
    q("#vtNotifySound")?.addEventListener("click",toggleSound);
    q("#vtNotifyClose")?.addEventListener("click",()=>setOpen(false));

    if(!document.documentElement.dataset.vtNotifyGlobalBound){
      document.documentElement.dataset.vtNotifyGlobalBound="1";
      document.addEventListener("click",e=>{
        if(!opened||e.target.closest("#vtNotifyPanel,#vtNotifyButton"))return;
        setOpen(false);
      });
      document.addEventListener("keydown",e=>{
        if(!opened||document.documentElement.dataset.vtShell!=="clean")return;
        if(e.key==="Escape"){
          e.preventDefault();setOpen(false);button?.focus();
        }
        if(e.key==="Tab"){
          const controls=[...panel.querySelectorAll("button:not([disabled]),a[href]")];
          const first=controls[0],last=controls[controls.length-1];
          if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
          else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
        }
      });
      window.addEventListener("resize",()=>{placeButton();positionPanel()},{passive:true});
      window.addEventListener("scroll",positionPanel,{passive:true});
      ["pointerdown","touchstart","keydown"].forEach(type=>window.addEventListener(type,unlockAudio,{once:true,passive:true}));
    }
  }

  function unmount(){
    if(channel){client.removeChannel(channel);channel=null}
    q("#vtNotifyButton")?.remove();
    q("#vtNotifyPanel")?.remove();
    q("#vtNotifyScrim")?.remove();
    q("#vtNotifyToast")?.remove();
    document.documentElement.classList.remove("vt-notify-open");
    button=null;panel=null;scrim=null;rows=[];user=null;initialisedFor=null;opened=false;
  }

  async function unlockAudio(){
    if(!soundEnabled())return false;
    try{
      const AudioCtor=window.AudioContext||window.webkitAudioContext;
      if(!AudioCtor)return false;
      if(!audioCtx)audioCtx=new AudioCtor();
      if(audioCtx.state==="suspended")await audioCtx.resume();
      audioUnlocked=audioCtx.state==="running";
      return audioUnlocked;
    }catch{return false}
  }

  function tone(freq,start,duration,gain,type="sine"){
    if(!audioCtx||audioCtx.state!=="running")return;
    const osc=audioCtx.createOscillator(),vol=audioCtx.createGain();
    osc.type=type;osc.frequency.setValueAtTime(freq,start);
    vol.gain.setValueAtTime(.0001,start);
    vol.gain.exponentialRampToValueAtTime(gain,start+.018);
    vol.gain.exponentialRampToValueAtTime(.0001,start+duration);
    osc.connect(vol);vol.connect(audioCtx.destination);
    osc.start(start);osc.stop(start+duration+.025);
  }

  async function playChime(role,priority,preview=false){
    if(!soundEnabled())return;
    if(!audioUnlocked)await unlockAudio();
    if(!audioCtx||audioCtx.state!=="running")return;
    const now=audioCtx.currentTime+.015,urgent=priority==="urgent",high=priority==="high";
    if(role==="admin"){
      const gain=preview?.025:urgent?.065:high?.052:.038;
      tone(392,now,.095,gain,"triangle");
      tone(523.25,now+.085,.105,gain*.9,"triangle");
      if(high||urgent)tone(659.25,now+.17,.12,gain*.8,"triangle");
    }else{
      const gain=preview?.022:urgent?.055:high?.043:.032;
      tone(659.25,now,.11,gain,"sine");
      tone(880,now+.105,.15,gain*.82,"sine");
      if(urgent)tone(1046.5,now+.21,.12,gain*.65,"sine");
    }
  }

  async function toggleSound(){
    const next=!soundEnabled();
    localStorage.setItem(SOUND_KEY,next?"on":"off");
    const b=q("#vtNotifySound");
    if(b){b.textContent=next?"Sound On":"Sound Off";b.setAttribute("aria-pressed",String(next))}
    if(next){
      audioUnlocked=false;
      await unlockAudio();
      await playChime(adminContext?"admin":"customer","normal",true);
    }else if(audioCtx&&audioCtx.state==="running"){
      try{await audioCtx.suspend()}catch{}
      audioUnlocked=false;
    }
  }

  async function detectAdmin(){
    const{data,error}=await client.rpc("is_volttech_admin");
    return !error&&data===true;
  }

  function selectQuery(role){
    let r=client.from("notifications")
      .select("id,recipient_user_id,recipient_role,event_type,title,message,action_url,entity_type,entity_id,priority,read_at,created_at")
      .is("archived_at",null);
    return role==="admin"?r.eq("recipient_role","admin"):r.eq("recipient_role","customer").eq("recipient_user_id",user.id);
  }

  function rolesForContext(){
    if(adminContext)return["admin"];
    if(customerContext)return["customer"];
    return isAdmin?["admin","customer"]:["customer"];
  }

  async function refresh(){
    if(!user)return;
    const results=await Promise.all(rolesForContext().map(role=>selectQuery(role).order("created_at",{ascending:false}).limit(40)));
    const error=results.find(r=>r.error)?.error;
    if(error)return;
    const unique=new Map(results.flatMap(r=>r.data||[]).map(r=>[r.id,r]));
    rows=[...unique.values()].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,60);
    render();
  }

  function render(){
    if(!button||!panel)return;
    const actionRows=rows.filter(r=>r.priority==="high"||r.priority==="urgent");
    const newUpdates=rows.filter(r=>r.priority!=="high"&&r.priority!=="urgent"&&!r.read_at);
    const history=rows.filter(r=>r.priority!=="high"&&r.priority!=="urgent"&&r.read_at);
    const attention=[...actionRows,...newUpdates];
    const attentionCount=attention.length;
    const count=q("#vtNotifyCount");
    if(count){count.textContent=attentionCount>99?"99+":String(attentionCount);count.hidden=!attentionCount}
    button.classList.remove("has-high","has-urgent","role-admin","role-customer","role-hybrid","is-empty");
    if(!attentionCount)button.classList.add("is-empty");
    if(actionRows.some(r=>r.priority==="urgent"))button.classList.add("has-urgent");
    else if(actionRows.some(r=>r.priority==="high"))button.classList.add("has-high");
    button.classList.add(adminContext?"role-admin":customerContext?"role-customer":isAdmin?"role-hybrid":"role-customer");
    const mark=q("#vtNotifyMarkAll");if(mark)mark.textContent=actionRows.length?"Mark updates read":"Mark all read";
    const list=q("#vtNotifyList");if(!list)return;
    const card=(r,isHistory=false)=>{
      const isAction=r.priority==="high"||r.priority==="urgent";
      const classes=["vt-notify-item",r.read_at?"":"unread",isAction?"high":"",isHistory?"history":"",`role-${esc(r.recipient_role)}`].filter(Boolean).join(" ");
      const cta=r.action_url?(isAction?"Open task →":"View →"):"";
      return `<button type="button" class="${classes}" data-notification="${esc(r.id)}"><span class="vt-notify-role role-${esc(r.recipient_role)}">${roleLabel(r.recipient_role,r.priority)}</span><span class="vt-notify-title"><span>${esc(r.title)}</span><time>${esc(relative(r.created_at))}</time></span>${r.message?`<span class="vt-notify-message">${esc(r.message)}</span>`:""}${cta?`<span class="vt-notify-action">${cta}</span>`:""}</button>`;
    };
    let html="";
    if(attention.length)html+=`<div class="vt-notify-section-label">Needs attention</div>${attention.map(r=>card(r,false)).join("")}`;
    else html+=`<div class="vt-notify-clear"><b>You’re all caught up.</b><span>No actions or unread updates are waiting.</span></div>`;
    if(history.length)html+=`<div class="vt-notify-section-label history-label">Recent history</div>${history.map(r=>card(r,true)).join("")}`;
    if(!rows.length)html='<div class="vt-notify-clear"><b>You’re all caught up.</b><span>No notifications yet.</span></div>';
    list.innerHTML=html;
    list.querySelectorAll("[data-notification]").forEach(b=>b.addEventListener("click",()=>openNotification(b.dataset.notification)));
    positionPanel();
  }

  async function markRead(id){
    const n=rows.find(r=>r.id===id);
    if(!n||n.read_at)return;
    const{error}=await client.from("notifications").update({read_at:new Date().toISOString()}).eq("id",id);
    if(!error){n.read_at=new Date().toISOString();render()}
  }

  async function markRoleRead(role){
    let upd=client.from("notifications").update({read_at:new Date().toISOString()}).is("read_at",null).is("archived_at",null);
    upd=role==="admin"?upd.eq("recipient_role","admin"):upd.eq("recipient_role","customer").eq("recipient_user_id",user.id);
    return upd;
  }

  async function markAllRead(){
    await Promise.all(rolesForContext().map(markRoleRead));
    refresh();
  }

  async function openNotification(id){
    const n=rows.find(r=>r.id===id);
    if(!n)return;
    await markRead(id);
    if(!n.action_url)return;
    try{
      const url=new URL(n.action_url,location.origin);
      if(url.origin===location.origin)location.href=`${url.pathname}${url.search}${url.hash}`;
    }catch{}
  }

  function flashBell(n){
    if(!button)return;
    const cls=n.recipient_role==="admin"?"flash-admin":"flash-customer";
    button.classList.remove("flash-admin","flash-customer");
    void button.offsetWidth;
    button.classList.add(cls);
    setTimeout(()=>button?.classList.remove(cls),2400);
  }

  function toast(n){
    q("#vtNotifyToast")?.remove();
    const t=document.createElement("button");
    t.id="vtNotifyToast";
    t.type="button";
    t.className=`vt-notify-toast role-${n.recipient_role} priority-${n.priority||"normal"}`;
    t.innerHTML=`<small>${roleLabel(n.recipient_role,n.priority)}${n.priority==="urgent"?" · URGENT":""}</small><b>${esc(n.title||"New VoltTech notification")}</b>${n.message?`<span>${esc(n.message)}</span>`:""}<em>Open →</em>`;
    t.addEventListener("click",()=>{refresh().then(()=>openNotification(n.id))});
    document.body.append(t);
    setTimeout(()=>t.remove(),7000);
  }

  function relevant(n){
    if(!n||!user)return false;
    if(adminContext)return n.recipient_role==="admin";
    if(customerContext)return n.recipient_role==="customer"&&n.recipient_user_id===user.id;
    if(n.recipient_role==="customer")return n.recipient_user_id===user.id;
    return isAdmin&&n.recipient_role==="admin";
  }

  function handleRealtime(n){
    if(!relevant(n)||realtimeSeen.has(n.id))return;
    realtimeSeen.add(n.id);
    toast(n);
    flashBell(n);
    playChime(n.recipient_role,n.priority||"normal");
    refresh();
  }

  function subscribe(){
    if(channel)client.removeChannel(channel);
    channel=client.channel(`vt-notifications-v5-${context}-${user.id}-${Math.random().toString(36).slice(2,8)}`)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"notifications"},p=>handleRealtime(p.new))
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"notifications"},p=>{if(relevant(p.new))refresh()})
      .subscribe();
  }

  async function initialise(session){
    if(!session?.user){unmount();return}
    if(initialisedFor===session.user.id&&button?.isConnected){
      placeButton();
      return;
    }

    user=session.user;
    initialisedFor=user.id;
    isAdmin=(adminContext||context==="site")?await detectAdmin():false;
    if(adminContext&&!isAdmin){unmount();return}

    await ensureServiceWorker();
    mount();
    await refresh();
    subscribe();

    /* Public mobile navigation may be inserted just after us. Re-place once. */
    setTimeout(placeButton,250);
    setTimeout(placeButton,900);
  }

  async function boot(){
    const{data:{session}}=await client.auth.getSession();
    await initialise(session);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);
  else boot();

  client.auth.onAuthStateChange((event,session)=>{
    if(event==="SIGNED_IN"||event==="TOKEN_REFRESHED"||event==="INITIAL_SESSION")initialise(session);
    if(event==="SIGNED_OUT")unmount();
  });

  window.addEventListener("beforeunload",()=>{if(channel)client.removeChannel(channel)});
})();
