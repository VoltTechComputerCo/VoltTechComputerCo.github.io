(()=>{
  const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const path=location.pathname||'/';
  const pageMessages={
    '/':"Hi VoltTech! I'd like some help with my PC. My issue is: ",
    '/index.html':"Hi VoltTech! I'd like some help with my PC. My issue is: ",
    '/pc-repair-pretoria.html':"Hi VoltTech! I'd like help with a PC repair or diagnostic. The problem I'm having is: ",
    '/pc-performance-optimisation.html':"Hi VoltTech! I'd like help improving my PC's performance. The main issue I'm noticing is: ",
    '/pc-upgrades-pretoria.html':"Hi VoltTech! I'm interested in upgrading my PC. My goal is: ",
    '/virus-malware-removal-pretoria.html':"Hi VoltTech! I think my PC may have unwanted software or malware. The symptoms I'm seeing are: ",
    '/windows-installation-pretoria.html':"Hi VoltTech! I'd like help with Windows. What I need is: ",
    '/streaming-setup-south-africa.html':"Hi VoltTech! I'd like help with my streaming setup. The problem I'm having is: "
  };

  function ensureLink(rel,href,sizes){let sel=`link[rel="${rel}"]${sizes?`[sizes="${sizes}"]`:''}`,el=q(sel);if(!el){el=document.createElement('link');el.rel=rel;if(sizes)el.sizes=sizes;document.head.append(el)}el.href=href}
  function metadata(){ensureLink('manifest','manifest.webmanifest');ensureLink('apple-touch-icon','icons/apple-touch-icon.png','180x180');ensureLink('icon','icons/favicon-32.png','32x32');let a=q('meta[name="apple-mobile-web-app-capable"]');if(!a){a=document.createElement('meta');a.name='apple-mobile-web-app-capable';document.head.append(a)}a.content='yes'}
  function skipLink(){const main=q('main');if(!main)return;if(!main.id)main.id='main-content';if(q('.vt-skip-link'))return;const a=document.createElement('a');a.className='vt-skip-link';a.href='#'+main.id;a.textContent='Skip to main content';document.body.prepend(a)}
  function footerLinks(){qa('footer').forEach(f=>{if(q('.vt-footer-links',f))return;const d=document.createElement('div');d.className='vt-footer-links';[['Privacy','privacy.html'],['Legal','legal.html'],['Delivery & collection','delivery-collection.html']].forEach(([t,h])=>{const a=document.createElement('a');a.href=h;a.textContent=t;d.append(a)});f.append(d)})}
  function contactIcons(){qa('a[href^="https://wa.me/"],a[href^="mailto:"]').forEach(a=>{if(q('.vt-contact-icon',a))return;const img=document.createElement('img');img.className='vt-contact-icon';img.src=a.href.startsWith('https://wa.me/')?'whatsapp-logo.svg':'gmail-logo.svg';img.alt='';img.setAttribute('aria-hidden','true');a.prepend(img)})}
  function enhanceGenericWhatsApp(){const msg=pageMessages[path];if(!msg)return;qa('a[href^="https://wa.me/27618435775"]').forEach(a=>{if(!/[?&]text=/.test(a.href))a.href='https://wa.me/27618435775?text='+encodeURIComponent(msg)})}

  const FEED_URL='sa-streamers-live.json'; const FRESH_MS=25*60*1000; let feedPromise=null,feedData=null,feedAt=0;
  const LiveFeed={
    isFresh(data){const t=Date.parse(data&&data.generated_at||'');return Number.isFinite(t)&&Date.now()-t<=FRESH_MS},
    async get(force=false){if(!force&&feedData&&Date.now()-feedAt<60*1000)return feedData;if(!force&&feedPromise)return feedPromise;feedPromise=fetch(FEED_URL+'?ts='+Date.now(),{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('feed');return r.json()}).then(d=>{feedData=d;feedAt=Date.now();return d}).finally(()=>{feedPromise=null});return feedPromise}
  };
  window.VoltTechLiveFeed=LiveFeed;

  function mobileNav(){
    const nav=q('nav'),wrap=nav&&q('.wrap',nav);if(!nav||!wrap||q('.vt-mobile-menu-btn'))return;
    const button=document.createElement('button');button.type='button';button.className='vt-mobile-menu-btn';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','vtMobileDrawer');button.innerHTML='<span class="vt-menu-bars" aria-hidden="true"><i></i><i></i><i></i></span><span>Menu</span>';wrap.append(button);
    const backdrop=document.createElement('div');backdrop.className='vt-mobile-backdrop';backdrop.setAttribute('aria-hidden','true');
    const drawer=document.createElement('aside');drawer.className='vt-mobile-drawer';drawer.id='vtMobileDrawer';drawer.setAttribute('aria-hidden','true');drawer.setAttribute('role','dialog');drawer.setAttribute('aria-modal','true');drawer.setAttribute('aria-label','VoltTech navigation');
    const items=[
      ['⌂','Home','VoltTech home','index.html',''],['⚙','Services','PC repair, performance, upgrades & Windows','index.html#services',''],['⚡','Signal Scan','Symptom & estimate guide','signal-scan.html',''],['●','Creator Hub','South African Twitch creators','creator-hub-south-africa.html','creator'],['◉','Streaming','OBS, audio & performance help','streaming-setup-south-africa.html',''],['◎','Account','Your VoltTech profile','account.html',''],['✉','Contact','WhatsApp or email','index.html#contact',''],['S','STATIC','Tech, gaming & hardware','static.html','']
    ];
    drawer.innerHTML='<div class="vt-mobile-drawer-head"><span>VoltTech navigation</span><b>Menu</b></div><div class="vt-mobile-links">'+items.map(([i,t,d,h,c])=>`<a class="vt-mobile-link ${c}" href="${h}"><span class="vt-nav-icon" aria-hidden="true">${i}</span><span><small>${t}</small><strong>${d}</strong>${c==='creator'?'<span class="vt-live-pill"><i></i><b id="vtMenuLiveCount">Checking activity…</b></span>':''}</span><span class="vt-arrow" aria-hidden="true">→</span></a>`).join('')+'</div>';
    document.body.append(backdrop,drawer);
    let lastFocus=null,loadedCreator=false;
    async function creatorStatus(){if(loadedCreator)return;loadedCreator=true;const out=q('#vtMenuLiveCount');if(!out)return;try{const data=await LiveFeed.get();const fresh=LiveFeed.isFresh(data),creators=Array.isArray(data.streamers)?data.streamers:[],live=fresh?creators.filter(s=>s.live):[];out.textContent=fresh?(live.length?live.length+' observed live now':'No creators observed live now'):'Feed delayed · live status unconfirmed';if(!fresh)out.closest('.vt-live-pill')?.classList.add('vt-feed-stale')}catch{out.textContent='Creator feed unavailable'}}
    function focusables(){return qa('a[href],button:not([disabled])',drawer)}
    function setOpen(open){button.setAttribute('aria-expanded',String(open));drawer.classList.toggle('open',open);backdrop.classList.toggle('open',open);drawer.setAttribute('aria-hidden',String(!open));backdrop.setAttribute('aria-hidden',String(!open));document.body.classList.toggle('vt-menu-open',open);if(open){lastFocus=document.activeElement;creatorStatus();requestAnimationFrame(()=>focusables()[0]?.focus())}else if(lastFocus&&document.contains(lastFocus))lastFocus.focus()}
    button.addEventListener('click',()=>setOpen(button.getAttribute('aria-expanded')!=='true'));backdrop.addEventListener('click',()=>setOpen(false));drawer.addEventListener('click',e=>{if(e.target.closest('a'))setOpen(false)});
    document.addEventListener('keydown',e=>{if(button.getAttribute('aria-expanded')!=='true')return;if(e.key==='Escape'){e.preventDefault();setOpen(false);return}if(e.key==='Tab'){const f=focusables();if(!f.length)return;const first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
    addEventListener('resize',()=>{if(innerWidth>760&&button.getAttribute('aria-expanded')==='true')setOpen(false)});
  }

  function init(){metadata();skipLink();footerLinks();enhanceGenericWhatsApp();contactIcons();mobileNav()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
