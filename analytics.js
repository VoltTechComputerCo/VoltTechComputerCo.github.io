window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments)}
gtag('js',new Date());
gtag('config','G-QQ3CC70MBE');

(function(){
const pageName=(location.pathname.split('/').pop()||'index.html').toLowerCase();

const pages={
'index.html':'vt-page-home',
'pc-repair-pretoria.html':'vt-page-repair',
'pc-performance-optimisation.html':'vt-page-performance',
'pc-upgrades-pretoria.html':'vt-page-upgrades',
'virus-malware-removal-pretoria.html':'vt-page-malware',
'windows-installation-pretoria.html':'vt-page-windows',
'signal-scan.html':'vt-page-signal',
'streaming-setup-south-africa.html':'vt-page-streaming',
'stream-scan.html':'vt-page-streamscan',
'creator-hub-south-africa.html':'vt-page-creatorhub'
};

const pageMessages={
'index.html':"Hi VoltTech! I'd like some help with my PC. My issue is: ",
'pc-repair-pretoria.html':"Hi VoltTech! I'd like help with a PC repair or diagnostic. The problem I'm having is: ",
'pc-performance-optimisation.html':"Hi VoltTech! I'd like help improving my PC's performance. The main issue I'm noticing is: ",
'pc-upgrades-pretoria.html':"Hi VoltTech! I'm interested in upgrading my PC. I'm considering: ",
'virus-malware-removal-pretoria.html':"Hi VoltTech! I think my PC may have a virus or malware. The symptoms I'm seeing are: ",
'windows-installation-pretoria.html':"Hi VoltTech! I'd like help with a Windows installation or Windows-related issue. What I need is: ",
'streaming-setup-south-africa.html':"Hi VoltTech! I'd like help with my streaming setup. The problem I'm having is: "
};

function loadCSS(href,key){
 const base=href.split('?')[0];
 const alreadyLoaded=Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(link=>{
   const value=(link.getAttribute('href')||'').split('?')[0];
   return value===base||value.endsWith('/'+base);
 });
 if(document.querySelector('link[data-vt-'+key+']')||alreadyLoaded)return;
 const l=document.createElement('link');
 l.rel='stylesheet'; l.href=href; l.dataset['vt'+key.replace(/(^|-)([a-z])/g,(_,a,b)=>b.toUpperCase())]='1';
 document.head.appendChild(l);
}
function loadScript(src,key){
 if(document.querySelector('script[data-vt-'+key+']'))return;
 const s=document.createElement('script');
 s.src=src;
 s.defer=true;
 s.dataset['vt'+key.replace(/(^|-)([a-z])/g,(_,a,b)=>b.toUpperCase())]='1';
 document.head.appendChild(s);
}
function ensureHeadLink(rel,href,sizes){
 let q='link[rel="'+rel+'"]'+(sizes?'[sizes="'+sizes+'"]':'');
 let link=document.querySelector(q);
 if(!link){
   link=document.createElement('link');
   link.rel=rel;
   if(sizes)link.sizes=sizes;
   document.head.appendChild(link);
 }
 link.href=href;
}
function installAppMetadata(){
 ensureHeadLink('manifest','manifest.webmanifest');
 ensureHeadLink('apple-touch-icon','icons/apple-touch-icon.png','180x180');
 ensureHeadLink('icon','icons/favicon-32.png','32x32');
 ensureHeadLink('icon','icons/favicon-16.png','16x16');

 let theme=document.querySelector('meta[name="theme-color"]');
 if(!theme){
   theme=document.createElement('meta');
   theme.name='theme-color';
   document.head.appendChild(theme);
 }
 theme.content='#05080a';

 let apple=document.querySelector('meta[name="apple-mobile-web-app-capable"]');
 if(!apple){
   apple=document.createElement('meta');
   apple.name='apple-mobile-web-app-capable';
   document.head.appendChild(apple);
 }
 apple.content='yes';

 if('serviceWorker' in navigator){
   window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}),{once:true});
 }
}
function loadVisualCSS(){
 loadCSS('visual-system.css?v=11','visual-system');
 loadCSS('visual-block-fix.css?v=3','visual-fix');
}
function enableContactIcons(){
 loadCSS('contact-icons-static.css?v=2','contact-icons-static');
}
function enhanceWhatsAppLinks(){
 const msg=pageMessages[pageName];
 document.querySelectorAll('a[href^="https://wa.me/27618435775"]').forEach(a=>{
   if(msg && !/[?&]text=/.test(a.href)){
     a.href='https://wa.me/27618435775?text='+encodeURIComponent(msg);
   }
   a.addEventListener('click',()=>gtag('event','whatsapp_click',{
     page_path:location.pathname,
     link_text:(a.textContent||'').trim()
   }));
 });
}
function initMobileNavigation(){
 if(document.querySelector('.vt-mobile-menu-btn'))return;
 const nav=document.querySelector('nav');
 const wrap=nav&&nav.querySelector('.wrap');
 if(!nav||!wrap)return;

 loadCSS('mobile-nav.css?v=5','mobile-nav');

 const button=document.createElement('button');
 button.className='vt-mobile-menu-btn';
 button.type='button';
 button.setAttribute('aria-expanded','false');
 button.setAttribute('aria-controls','vtMobileDrawer');
 button.innerHTML='<span class="vt-menu-bars" aria-hidden="true"><i></i><i></i><i></i></span><span>Menu</span>';
 wrap.appendChild(button);

 const backdrop=document.createElement('div');
 backdrop.className='vt-mobile-backdrop';
 backdrop.setAttribute('aria-hidden','true');

 const drawer=document.createElement('div');
 drawer.className='vt-mobile-drawer';
 drawer.id='vtMobileDrawer';
 drawer.setAttribute('aria-hidden','true');
 drawer.innerHTML=
   '<div class="vt-mobile-drawer-head"><span>VoltTech</span><b>Menu</b></div>'+
   '<div class="vt-mobile-links">'+
     '<a class="vt-mobile-link vt-menu-services" href="index.html#services"><span class="vt-card-image vt-image-services"></span><div class="vt-card-copy"><small>Services</small><strong>PC Services</strong><em>Repair, upgrades & Windows</em></div></a>'+
     '<a class="vt-mobile-link vt-menu-scan" href="signal-scan.html"><span class="vt-card-image vt-image-scan"></span><div class="vt-card-copy"><small>Free tool</small><strong>Signal Scan</strong><em>Symptoms, triage & estimates</em></div></a>'+
     '<a class="vt-mobile-link vt-menu-creator" href="creator-hub-south-africa.html"><span class="vt-card-image vt-image-creator"></span><div class="vt-card-copy"><div class="vt-creator-top"><small>Creator Hub</small><span class="vt-live-pill"><i></i><b id="vtMenuLiveCount">LIVE</b></span></div><strong>SA Creators</strong><em id="vtMenuCreatorMeta">Checking live creators…</em></div></a>'+
     '<a class="vt-mobile-link vt-menu-streaming" href="streaming-setup-south-africa.html"><span class="vt-card-image vt-image-streaming"></span><div class="vt-card-copy"><small>Streaming</small><strong>Creator Support</strong><em>OBS, audio & performance</em></div></a>'+
     '<a class="vt-mobile-link vt-menu-account" href="account.html"><span class="vt-card-image vt-image-account"></span><div class="vt-card-copy"><small>Account</small><strong>My Account</strong><em>Quotes, builds & profile</em></div></a>'+
     '<a class="vt-mobile-link vt-menu-contact" href="index.html#contact"><span class="vt-card-image vt-image-contact"></span><div class="vt-card-copy"><small>Contact</small><strong>Get Help</strong><em>WhatsApp or email</em></div></a>'+
     '<a class="vt-mobile-link vt-menu-static" href="static.html"><span class="vt-card-image vt-image-static"></span><div class="vt-card-copy"><small>Editorial</small><strong>STATIC</strong><em>Tech, gaming & hardware</em></div></a>'+
   '</div>';
 document.body.append(backdrop,drawer);

 async function updateCreatorMenu(){
   const count=document.getElementById('vtMenuLiveCount');
   const meta=document.getElementById('vtMenuCreatorMeta');
   if(!count||!meta)return;
   try{
     const res=await fetch('sa-streamers-live.json?menu=1',{cache:'no-store'});
     if(!res.ok)throw new Error('feed');
     const data=await res.json();
     const creators=Array.isArray(data.streamers)?data.streamers:[];
     const live=creators.filter(s=>s.live);
     count.textContent=live.length?live.length+' LIVE':'LIVE';
     meta.textContent=live.length
       ? live.length+' creator'+(live.length===1?' is':'s are')+' live now'
       : 'Discover South African creators';
   }catch(e){
     count.textContent='LIVE';
     meta.textContent='Discover South African creators';
   }
 }
 updateCreatorMenu();

 function setOpen(open){
   button.setAttribute('aria-expanded',String(open));
   drawer.classList.toggle('open',open);
   backdrop.classList.toggle('open',open);
   drawer.setAttribute('aria-hidden',String(!open));
   backdrop.setAttribute('aria-hidden',String(!open));
   document.body.classList.toggle('vt-menu-open',open);
   if(open){requestAnimationFrame(()=>drawer.querySelector('a')?.focus())}
   else if(document.activeElement&&drawer.contains(document.activeElement))button.focus();
 }
 button.addEventListener('click',()=>setOpen(button.getAttribute('aria-expanded')!=='true'));
 backdrop.addEventListener('click',()=>setOpen(false));
 drawer.addEventListener('click',e=>{if(e.target.closest('a'))setOpen(false)});
 document.addEventListener('keydown',e=>{
   if(button.getAttribute('aria-expanded')!=='true')return;
   if(e.key==='Escape'){e.preventDefault();setOpen(false);return}
   if(e.key==='Tab'){
     const focusable=[...drawer.querySelectorAll('a[href],button:not([disabled])')];
     if(!focusable.length)return;
     const first=focusable[0],last=focusable[focusable.length-1];
     if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
     else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
   }
 });
 window.addEventListener('resize',()=>{if(innerWidth>700)setOpen(false)});
}
function ensureOfficialHeaderLogo(){
 const logo=document.querySelector('nav .brand img');
 if(!logo)return;
 const official='brand/VoltTech_Full_Logo_Transparent.png';
 const current=(logo.getAttribute('src')||'').replace(/^\.\//,'');
 if(current!==official)logo.src=official;
 if(!logo.alt)logo.alt='VoltTech Computer Co.';
}
function loadScanHandoff(){
 if(!['signal-scan.html','stream-scan.html'].includes(pageName))return;
 loadScript('scan-handoff.js?v=1','scan-handoff');
}
function loadSymptomHandoff(){
 const supported=[
  'pc-repair-pretoria.html',
  'pc-performance-optimisation.html',
  'pc-upgrades-pretoria.html',
  'virus-malware-removal-pretoria.html',
  'windows-installation-pretoria.html'
 ];
 if(!supported.includes(pageName))return;
 loadScript('symptom-handoff.js?v=1','symptom-handoff');
}
function loadPhase9Finish(){
 const supported=[
  'index.html',
  'pc-repair-pretoria.html',
  'pc-performance-optimisation.html',
  'pc-upgrades-pretoria.html',
  'virus-malware-removal-pretoria.html',
  'windows-installation-pretoria.html',
  'streaming-setup-south-africa.html',
  'creator-hub-south-africa.html'
 ];
 if(!supported.includes(pageName))return;
 loadCSS('phase9-business-finish.css?v=4','phase9-business-v4');
 loadScript('phase9-business-finish.js?v=4','phase9-business-v4');
}
function init(){
 installAppMetadata();
 ensureOfficialHeaderLogo();
 enableContactIcons();
 loadScanHandoff();
 loadSymptomHandoff();
 loadPhase9Finish();
 if(/^static(?:-|\.html)/.test(pageName))return;
 const cls=pages[pageName];
 if(cls&&!document.body.classList.contains(cls))document.body.classList.add(cls);
 loadVisualCSS();
 enhanceWhatsAppLinks();
 initMobileNavigation();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();