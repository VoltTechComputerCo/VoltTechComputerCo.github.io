let clientRef = null;
let userRef = null;
let channel = null;
let rows = [];
let mounted = false;
let opened = false;
let authBound = false;
let audioContext = null;
const SOUND_KEY = 'volttech_notification_sound';
const q = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[char]));
const soundEnabled = () => localStorage.getItem(SOUND_KEY) !== 'off';

function relative(value) {
  const ms = Date.now() - new Date(value).getTime(); const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return 'now'; if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24); if (days < 7) return `${days}d`;
  return new Intl.DateTimeFormat('en-ZA',{day:'numeric',month:'short'}).format(new Date(value));
}
function roleLabel(priority) { return priority === 'urgent' || priority === 'high' ? 'ACTION REQUIRED' : 'CUSTOMER UPDATE'; }

async function chime(preview=false) {
  if (!soundEnabled()) return;
  try {
    const AudioCtor = window.AudioContext || window.webkitAudioContext; if (!AudioCtor) return;
    audioContext ||= new AudioCtor(); if (audioContext.state === 'suspended') await audioContext.resume();
    const start=audioContext.currentTime+.015, osc=audioContext.createOscillator(), gain=audioContext.createGain();
    osc.type='sine'; osc.frequency.setValueAtTime(preview?659.25:880,start); gain.gain.setValueAtTime(.0001,start); gain.gain.exponentialRampToValueAtTime(preview?.018:.032,start+.02); gain.gain.exponentialRampToValueAtTime(.0001,start+.16); osc.connect(gain); gain.connect(audioContext.destination); osc.start(start); osc.stop(start+.19);
  } catch {}
}
function setOpen(next) {
  opened=!!next; const panel=q('#vtNotifyPanel'),scrim=q('#vtNotifyScrim'),button=q('#vtNotifyButton');
  if(panel)panel.hidden=!opened;if(scrim)scrim.hidden=!opened;if(button)button.setAttribute('aria-expanded',String(opened));document.documentElement.classList.toggle('vt-notify-open',opened);
  if(opened) requestAnimationFrame(positionPanel); else if(panel?.contains(document.activeElement)) button?.focus();
}
function positionPanel(){const panel=q('#vtNotifyPanel'),button=q('#vtNotifyButton');if(!opened||!panel||!button)return;const r=button.getBoundingClientRect(),edge=12,width=Math.min(360,innerWidth-edge*2);let left=Math.max(edge,Math.min(r.right-width,innerWidth-width-edge));let top=r.bottom+9;panel.style.width=`${width}px`;panel.style.left=`${Math.round(left)}px`;panel.style.top=`${Math.round(top)}px`;panel.style.setProperty('--vt-panel-anchor',`${Math.max(24,Math.min(width-24,(r.left+r.width/2)-left))}px`)}
function mount(){if(mounted)return;const host=q('[data-notifications-host]');if(!host)return;mounted=true;host.innerHTML='<button id="vtNotifyButton" class="vt-notify-button is-empty" type="button" aria-label="Open notifications" aria-expanded="false" aria-controls="vtNotifyPanel"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg><span class="vt-notify-count" id="vtNotifyCount" hidden>0</span></button>';
  const scrim=document.createElement('div');scrim.id='vtNotifyScrim';scrim.className='vt-notify-scrim';scrim.hidden=true;document.body.append(scrim);
  const panel=document.createElement('section');panel.id='vtNotifyPanel';panel.className='vt-notify-panel context-customer';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Customer notifications');document.body.append(panel);
  q('#vtNotifyButton').addEventListener('click',()=>setOpen(!opened));scrim.addEventListener('click',()=>setOpen(false));
  document.addEventListener('keydown',event=>{if(!opened)return;if(event.key==='Escape'){event.preventDefault();setOpen(false)}else if(event.key==='Tab'){const controls=[...panel.querySelectorAll('button:not([disabled]),a[href]')];if(!controls.length)return;const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}});
  addEventListener('resize',positionPanel,{passive:true});addEventListener('scroll',positionPanel,{passive:true});
}
function render(){mount();const button=q('#vtNotifyButton'),panel=q('#vtNotifyPanel');if(!button||!panel)return;const action=rows.filter(row=>!row.read_at || row.priority==='high'||row.priority==='urgent'),history=rows.filter(row=>row.read_at&&row.priority!=='high'&&row.priority!=='urgent');const count=q('#vtNotifyCount');if(count){count.textContent=action.length>99?'99+':String(action.length);count.hidden=!action.length}button.className='vt-notify-button '+(action.length?'':'is-empty');
  const card=(row,historyRow=false)=>`<button type="button" class="vt-notify-item ${row.read_at?'':'unread'} ${row.priority==='high'||row.priority==='urgent'?'high':''} ${historyRow?'history':''}" data-notification="${esc(row.id)}"><span class="vt-notify-role">${roleLabel(row.priority)}</span><span class="vt-notify-title"><span>${esc(row.title)}</span><time>${esc(relative(row.created_at))}</time></span>${row.message?`<span class="vt-notify-message">${esc(row.message)}</span>`:''}${row.action_url?'<span class="vt-notify-action">View →</span>':''}</button>`;
  panel.innerHTML=`<div class="vt-notify-head"><div><small>VOLTTECH / CUSTOMER</small><h2>My notifications</h2></div><div class="vt-notify-head-actions"><button id="vtNotifySound" class="vt-notify-sound" type="button" aria-pressed="${soundEnabled()}">${soundEnabled()?'Sound On':'Sound Off'}</button><button id="vtNotifyMarkAll" class="vt-notify-markall" type="button">Mark all read</button></div><button id="vtNotifyClose" class="vt-notify-close" type="button" aria-label="Close notifications">×</button></div><div id="vtNotifyList" class="vt-notify-list">${action.length?`<div class="vt-notify-section-label">Needs attention</div>${action.map(row=>card(row)).join('')}`:'<div class="vt-notify-clear"><b>You’re all caught up.</b><span>No unread customer updates need your attention.</span></div>'}${history.length?`<div class="vt-notify-section-label history-label">Earlier</div>${history.map(row=>card(row,true)).join('')}`:''}</div>`;
  q('#vtNotifyClose').addEventListener('click',()=>setOpen(false));q('#vtNotifyMarkAll').addEventListener('click',markAllRead);q('#vtNotifySound').addEventListener('click',async()=>{const next=!soundEnabled();localStorage.setItem(SOUND_KEY,next?'on':'off');render();if(next)await chime(true)});panel.querySelectorAll('[data-notification]').forEach(el=>el.addEventListener('click',()=>openNotification(el.dataset.notification)));positionPanel();
}
async function refresh(){if(!clientRef||!userRef)return;const{data,error}=await clientRef.from('notifications').select('id,title,message,action_url,priority,read_at,created_at').eq('recipient_role','customer').eq('recipient_user_id',userRef.id).is('archived_at',null).order('created_at',{ascending:false}).limit(40);if(!error){rows=data||[];render()}}
async function markRead(id){const row=rows.find(item=>item.id===id);if(!row||row.read_at)return;const now=new Date().toISOString();const{error}=await clientRef.from('notifications').update({read_at:now}).eq('id',id);if(!error){row.read_at=now;render()}}
async function markAllRead(){const now=new Date().toISOString();await clientRef.from('notifications').update({read_at:now}).eq('recipient_role','customer').eq('recipient_user_id',userRef.id).is('read_at',null).is('archived_at',null);await refresh()}
async function openNotification(id){const row=rows.find(item=>item.id===id);if(!row)return;await markRead(id);if(!row.action_url)return;try{const url=new URL(row.action_url,location.origin);if(url.origin===location.origin)location.href=`${url.pathname}${url.search}${url.hash}`}catch{}}
function toast(row){const old=q('#vtNotifyToast');old?.remove();const el=document.createElement('button');el.id='vtNotifyToast';el.type='button';el.className=`vt-notify-toast role-customer priority-${row.priority||'normal'}`;el.innerHTML=`<small>${roleLabel(row.priority)}</small><b>${esc(row.title||'New VoltTech notification')}</b>${row.message?`<span>${esc(row.message)}</span>`:''}<em>Open →</em>`;el.addEventListener('click',async()=>{await refresh();await openNotification(row.id)});document.body.append(el);setTimeout(()=>el.remove(),7000)}
function subscribe(){if(channel)clientRef.removeChannel(channel);channel=clientRef.channel(`vt-customer-notifications-${userRef.id}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:`recipient_user_id=eq.${userRef.id}`},payload=>{const row=payload.new;if(row.recipient_role!=='customer')return;toast(row);chime();refresh()}).on('postgres_changes',{event:'UPDATE',schema:'public',table:'notifications',filter:`recipient_user_id=eq.${userRef.id}`},()=>refresh()).subscribe()}
function teardown(){if(channel&&clientRef)clientRef.removeChannel(channel);channel=null;rows=[];userRef=null;mounted=false;opened=false;q('#vtNotifyButton')?.remove();q('#vtNotifyPanel')?.remove();q('#vtNotifyScrim')?.remove();q('#vtNotifyToast')?.remove();document.documentElement.classList.remove('vt-notify-open')}
export async function initialiseCustomerNotifications(client){clientRef=client;const{data:{session}}=await client.auth.getSession();if(!session?.user){teardown();return}if(userRef?.id===session.user.id&&mounted){await refresh();return}userRef=session.user;mount();await refresh();subscribe();if(!authBound){authBound=true;client.auth.onAuthStateChange((event,next)=>{if(event==='SIGNED_OUT')teardown();else if((event==='SIGNED_IN'||event==='TOKEN_REFRESHED')&&next?.user){userRef=next.user;refresh();subscribe()}})}}
