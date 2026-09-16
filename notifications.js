(()=>{
  if(!window.supabase||!window.VOLTTECH_SUPABASE)return;

  const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const adminContext=page.startsWith('admin');
  const customerPages=new Set(['account.html','activity.html','builds.html','quotes.html','documents.html','privacy-center.html']);
  const customerContext=customerPages.has(page);
  const context=adminContext?'admin':customerContext?'customer':'site';

  const client=window.volttechAuth||window.supabase.createClient(
    VOLTTECH_SUPABASE.url,
    VOLTTECH_SUPABASE.publishableKey,
    {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}
  );

  const SOUND_KEY='volttech_notification_sound';
  let user=null,rows=[],channel=null,opened=false,isAdmin=false;
  let audioCtx=null,audioUnlocked=false;
  const realtimeSeen=new Set();
  const q=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,a=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[a]));
  const soundEnabled=()=>localStorage.getItem(SOUND_KEY)!=='off';
  const relative=v=>{
    const ms=Date.now()-new Date(v).getTime(),m=Math.floor(ms/60000);
    if(m<1)return'now'; if(m<60)return`${m}m`;
    const h=Math.floor(m/60); if(h<24)return`${h}h`;
    const d=Math.floor(h/24); if(d<7)return`${d}d`;
    return new Intl.DateTimeFormat('en-ZA',{day:'numeric',month:'short'}).format(new Date(v));
  };
  const roleLabel=r=>r==='admin'?'ADMIN ACTION':'CUSTOMER UPDATE';

  function mount(){
    if(q('#vtNotifyButton'))return;
    const ownerVisible=adminContext||(context==='site'&&isAdmin);
    if(ownerVisible){
      const owner=document.createElement('span');owner.id='vtOwnerMode';owner.className='vt-owner-mode';owner.textContent='OWNER MODE';document.body.append(owner);
    }

    const button=document.createElement('button');
    button.id='vtNotifyButton';button.className='vt-notify-button';button.type='button';button.setAttribute('aria-label','Open notifications');button.setAttribute('aria-expanded','false');
    button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg><span class="vt-notify-count" id="vtNotifyCount" hidden>0</span>';
    document.body.append(button);

    const panel=document.createElement('section');panel.id='vtNotifyPanel';panel.className='vt-notify-panel';panel.hidden=true;panel.setAttribute('aria-label','Notifications');
    const heading=adminContext?'VoltTech Admin Alerts':customerContext?'My VoltTech Notifications':'VoltTech Notifications';
    const kicker=adminContext?'ADMIN / ACTION CENTRE':customerContext?'CUSTOMER ACCOUNT':isAdmin?'OWNER + CUSTOMER':'CUSTOMER ACCOUNT';
    panel.innerHTML=`<div class="vt-notify-head"><div><small>${kicker}</small><h2>${heading}</h2></div><div class="vt-notify-head-actions"><button id="vtNotifySound" class="vt-notify-sound" type="button" aria-pressed="${soundEnabled()}">${soundEnabled()?'Sound On':'Sound Off'}</button><button id="vtNotifyMarkAll" class="vt-notify-markall" type="button">Mark all read</button></div></div><div id="vtNotifyList" class="vt-notify-list"></div>`;
    document.body.append(panel);

    button.addEventListener('click',()=>{opened=!opened;panel.hidden=!opened;button.setAttribute('aria-expanded',String(opened))});
    q('#vtNotifyMarkAll').addEventListener('click',markAllRead);
    q('#vtNotifySound').addEventListener('click',toggleSound);
    document.addEventListener('click',e=>{if(!opened||e.target.closest('#vtNotifyPanel,#vtNotifyButton'))return;opened=false;panel.hidden=true;button.setAttribute('aria-expanded','false')});
    ['pointerdown','touchstart','keydown'].forEach(type=>window.addEventListener(type,unlockAudio,{once:true,passive:true}));
  }

  async function unlockAudio(){
    if(!soundEnabled())return false;
    try{
      const AudioCtor=window.AudioContext||window.webkitAudioContext;if(!AudioCtor)return false;
      if(!audioCtx)audioCtx=new AudioCtor();
      if(audioCtx.state==='suspended')await audioCtx.resume();
      audioUnlocked=audioCtx.state==='running';return audioUnlocked;
    }catch{return false}
  }
  function tone(freq,start,duration,gain,type='sine'){
    if(!audioCtx||audioCtx.state!=='running')return;
    const osc=audioCtx.createOscillator(),vol=audioCtx.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,start);
    vol.gain.setValueAtTime(.0001,start);vol.gain.exponentialRampToValueAtTime(gain,start+.018);vol.gain.exponentialRampToValueAtTime(.0001,start+duration);
    osc.connect(vol);vol.connect(audioCtx.destination);osc.start(start);osc.stop(start+duration+.025);
  }
  async function playChime(role,priority,preview=false){
    if(!soundEnabled())return;if(!audioUnlocked)await unlockAudio();if(!audioCtx||audioCtx.state!=='running')return;
    const now=audioCtx.currentTime+.015,urgent=priority==='urgent',high=priority==='high';
    if(role==='admin'){
      const gain=preview?.025:urgent?.065:high?.052:.038;tone(392,now,.095,gain,'triangle');tone(523.25,now+.085,.105,gain*.9,'triangle');if(high||urgent)tone(659.25,now+.17,.12,gain*.8,'triangle');
    }else{
      const gain=preview?.022:urgent?.055:high?.043:.032;tone(659.25,now,.11,gain,'sine');tone(880,now+.105,.15,gain*.82,'sine');if(urgent)tone(1046.5,now+.21,.12,gain*.65,'sine');
    }
  }
  async function toggleSound(){
    const next=!soundEnabled();localStorage.setItem(SOUND_KEY,next?'on':'off');
    const b=q('#vtNotifySound');if(b){b.textContent=next?'Sound On':'Sound Off';b.setAttribute('aria-pressed',String(next))}
    if(next){audioUnlocked=false;await unlockAudio();await playChime(adminContext?'admin':'customer','normal',true)}else if(audioCtx&&audioCtx.state==='running'){try{await audioCtx.suspend()}catch{}audioUnlocked=false}
  }

  async function detectAdmin(){const{data,error}=await client.rpc('is_volttech_admin');return !error&&data===true}
  function selectQuery(role){
    let r=client.from('notifications').select('id,recipient_user_id,recipient_role,event_type,title,message,action_url,entity_type,entity_id,priority,read_at,created_at').is('archived_at',null);
    return role==='admin'?r.eq('recipient_role','admin'):r.eq('recipient_role','customer').eq('recipient_user_id',user.id);
  }
  async function refresh(){
    const roles=adminContext?['admin']:customerContext?['customer']:(isAdmin?['admin','customer']:['customer']);
    const results=await Promise.all(roles.map(role=>selectQuery(role).order('created_at',{ascending:false}).limit(40)));
    const error=results.find(r=>r.error)?.error;if(error){if(String(error.message||'').toLowerCase().includes('notifications')){q('#vtNotifyButton')?.remove();q('#vtNotifyPanel')?.remove();q('#vtNotifyBanner')?.remove();q('#vtOwnerMode')?.remove()}return}
    const unique=new Map(results.flatMap(r=>r.data||[]).map(r=>[r.id,r]));rows=[...unique.values()].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,60);render();
  }
  function render(){
    const unread=rows.filter(r=>!r.read_at),count=q('#vtNotifyCount'),button=q('#vtNotifyButton');count.textContent=unread.length>99?'99+':String(unread.length);count.hidden=!unread.length;
    if(button){button.classList.remove('has-high','has-urgent','role-admin','role-customer','role-hybrid');if(unread.some(r=>r.priority==='urgent'))button.classList.add('has-urgent');else if(unread.some(r=>r.priority==='high'))button.classList.add('has-high');button.classList.add(adminContext?'role-admin':customerContext?'role-customer':isAdmin?'role-hybrid':'role-customer')}
    const list=q('#vtNotifyList');
    list.innerHTML=rows.length?rows.map(r=>`<button type="button" class="vt-notify-item ${r.read_at?'':'unread'} ${(r.priority==='high'||r.priority==='urgent')?'high':''} role-${esc(r.recipient_role)}" data-notification="${esc(r.id)}"><span class="vt-notify-role role-${esc(r.recipient_role)}">${roleLabel(r.recipient_role)}</span><span class="vt-notify-title"><span>${esc(r.title)}</span><time>${esc(relative(r.created_at))}</time></span>${r.message?`<span class="vt-notify-message">${esc(r.message)}</span>`:''}${r.action_url?'<span class="vt-notify-action">Open →</span>':''}</button>`).join(''):'<div class="vt-notify-empty">You’re all caught up.</div>';
    list.querySelectorAll('[data-notification]').forEach(b=>b.addEventListener('click',()=>openNotification(b.dataset.notification)));renderBanner(unread);
  }
  function renderBanner(unread){
    q('#vtNotifyBanner')?.remove();const n=unread.find(r=>r.priority==='urgent'||r.priority==='high');if(!n)return;
    const host=document.querySelector('#accountHub .profile-head')||document.querySelector('#app')||document.querySelector('main');if(!host)return;
    const banner=document.createElement('div');banner.id='vtNotifyBanner';banner.className=`vt-notify-banner role-${n.recipient_role}`;
    banner.innerHTML=`<div class="vt-notify-banner-inner"><div><small>${roleLabel(n.recipient_role)} · ${n.priority==='urgent'?'URGENT':'ACTION REQUIRED'}</small><b>${esc(n.title)}</b>${n.message?`<p>${esc(n.message)}</p>`:''}</div><button type="button">Open</button></div>`;
    banner.querySelector('button').addEventListener('click',()=>openNotification(n.id));if(host.matches('#app'))host.prepend(banner);else host.insertAdjacentElement('afterend',banner);
  }
  async function markRead(id){const n=rows.find(r=>r.id===id);if(!n||n.read_at)return;const{error}=await client.from('notifications').update({read_at:new Date().toISOString()}).eq('id',id);if(!error){n.read_at=new Date().toISOString();render()}}
  async function markRoleRead(role){let upd=client.from('notifications').update({read_at:new Date().toISOString()}).is('read_at',null).is('archived_at',null);upd=role==='admin'?upd.eq('recipient_role','admin'):upd.eq('recipient_role','customer').eq('recipient_user_id',user.id);return upd}
  async function markAllRead(){const roles=adminContext?['admin']:customerContext?['customer']:(isAdmin?['admin','customer']:['customer']);await Promise.all(roles.map(markRoleRead));refresh()}
  async function openNotification(id){const n=rows.find(r=>r.id===id);if(!n)return;await markRead(id);if(!n.action_url)return;try{const url=new URL(n.action_url,location.origin);if(url.origin===location.origin)location.href=`${url.pathname}${url.search}${url.hash}`}catch{}}
  function flashBell(n){const button=q('#vtNotifyButton');if(!button)return;const cls=n.recipient_role==='admin'?'flash-admin':'flash-customer';button.classList.remove('flash-admin','flash-customer');void button.offsetWidth;button.classList.add(cls);setTimeout(()=>button.classList.remove(cls),2400)}
  function toast(n){
    q('#vtNotifyToast')?.remove();const t=document.createElement('button');t.id='vtNotifyToast';t.type='button';t.className=`vt-notify-toast role-${n.recipient_role} priority-${n.priority||'normal'}`;
    t.innerHTML=`<small>${roleLabel(n.recipient_role)}${n.priority==='urgent'?' · URGENT':''}</small><b>${esc(n.title||'New VoltTech notification')}</b>${n.message?`<span>${esc(n.message)}</span>`:''}<em>Open →</em>`;
    t.addEventListener('click',()=>{refresh().then(()=>openNotification(n.id))});document.body.append(t);setTimeout(()=>t.remove(),7000);
  }
  function relevant(n){if(!n)return false;if(adminContext)return n.recipient_role==='admin';if(customerContext)return n.recipient_role==='customer'&&n.recipient_user_id===user.id;if(n.recipient_role==='customer')return n.recipient_user_id===user.id;return isAdmin&&n.recipient_role==='admin'}
  function handleRealtime(n){if(!relevant(n)||realtimeSeen.has(n.id))return;realtimeSeen.add(n.id);toast(n);flashBell(n);playChime(n.recipient_role,n.priority||'normal');refresh()}
  function subscribe(){if(channel)client.removeChannel(channel);channel=client.channel(`vt-notifications-${context}-${user.id}-${Math.random().toString(36).slice(2,8)}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications'},p=>handleRealtime(p.new)).on('postgres_changes',{event:'UPDATE',schema:'public',table:'notifications'},p=>{if(relevant(p.new))refresh()}).subscribe()}
  async function init(){const{data:{session}}=await client.auth.getSession();if(!session?.user)return;user=session.user;if(adminContext||context==='site')isAdmin=await detectAdmin();if(adminContext&&!isAdmin)return;mount();await refresh();subscribe()}
  document.addEventListener('DOMContentLoaded',init);window.addEventListener('beforeunload',()=>{if(channel)client.removeChannel(channel)});
})();
