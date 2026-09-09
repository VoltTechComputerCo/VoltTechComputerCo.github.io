window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments)}
gtag('js',new Date());
gtag('config','G-QQ3CC70MBE');

(function(){
const pages={
'/':'vt-page-home',
'/index.html':'vt-page-home',
'/pc-repair-pretoria.html':'vt-page-repair',
'/pc-performance-optimisation.html':'vt-page-performance',
'/pc-upgrades-pretoria.html':'vt-page-upgrades',
'/virus-malware-removal-pretoria.html':'vt-page-malware',
'/windows-installation-pretoria.html':'vt-page-windows',
'/signal-scan.html':'vt-page-signal',
'/streaming-setup-south-africa.html':'vt-page-streaming',
'/stream-scan.html':'vt-page-streamscan',
'/creator-hub-south-africa.html':'vt-page-creatorhub'
};

const pageMessages={
'/':"Hi VoltTech! I'd like some help with my PC. My issue is: ",
'/index.html':"Hi VoltTech! I'd like some help with my PC. My issue is: ",
'/pc-repair-pretoria.html':"Hi VoltTech! I'd like help with a PC repair or diagnostic. The problem I'm having is: ",
'/pc-performance-optimisation.html':"Hi VoltTech! I'd like help improving my PC's performance. The main issue I'm noticing is: ",
'/pc-upgrades-pretoria.html':"Hi VoltTech! I'm interested in upgrading my PC. I'm considering: ",
'/virus-malware-removal-pretoria.html':"Hi VoltTech! I think my PC may have a virus or malware. The symptoms I'm seeing are: ",
'/windows-installation-pretoria.html':"Hi VoltTech! I'd like help with a Windows installation or Windows-related issue. What I need is: ",
'/streaming-setup-south-africa.html':"Hi VoltTech! I'd like help with my streaming setup. The problem I'm having is: "
};

function loadCSS(href,key){
 if(document.querySelector('link[data-vt-'+key+']'))return;
 const l=document.createElement('link');
 l.rel='stylesheet'; l.href=href; l.dataset['vt'+key.replace(/(^|-)([a-z])/g,(_,a,b)=>b.toUpperCase())]='1';
 document.head.appendChild(l);
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
function addContactIcons(){
 loadCSS('contact-icons.css?v=1','contact-icons');
 document.querySelectorAll('a[href^="https://wa.me/"],a[href^="mailto:"]').forEach(a=>{
   if(a.querySelector('.vt-contact-icon'))return;
   const isWa=a.href.startsWith('https://wa.me/');
   const img=document.createElement('img');
   img.className='vt-contact-icon';
   img.src=isWa?'whatsapp-logo.svg':'gmail-logo.svg';
   img.alt='';
   img.setAttribute('aria-hidden','true');
   a.prepend(img);
 });
}
function enhanceWhatsAppLinks(){
 const msg=pageMessages[location.pathname];
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

 loadCSS('mobile-nav.css?v=3','mobile-nav');

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
   '<div class="vt-mobile-drawer-head"><span>VoltTech navigation</span><b>Menu</b></div>'+
   '<div class="vt-mobile-links">'+
     '<a class="vt-mobile-link home" href="index.html"><span class="vt-card-image vt-image-logo"></span><div class="vt-card-copy"><small>Home</small><strong>VoltTech</strong><em>PC help, tools & support</em></div></a>'+
     '<a class="vt-mobile-link services" href="index.html#services"><span class="vt-card-image vt-image-services"></span><div class="vt-card-copy"><small>Services</small><strong>PC Services</strong><em>Repair, upgrades & Windows</em></div></a>'+
     '<a class="vt-mobile-link scan" href="signal-scan.html"><span class="vt-card-image vt-image-scan"></span><div class="vt-card-copy"><small>Free tool</small><strong>Signal Scan</strong><em>Diagnose & estimate</em></div></a>'+
     '<a class="vt-mobile-link creator" href="creator-hub-south-africa.html"><div class="vt-creator-visual" id="vtMenuCreatorVisual"></div><div class="vt-card-copy"><div class="vt-creator-top"><small>Creator Hub</small><span class="vt-live-pill"><i></i><b id="vtMenuLiveCount">LIVE</b></span></div><strong>South African Creators</strong><em id="vtMenuCreatorMeta">Checking live creators…</em><div class="vt-creator-strip" id="vtMenuCreatorStrip"></div></div></a>'+
     '<a class="vt-mobile-link streaming" href="streaming-setup-south-africa.html"><span class="vt-card-image vt-image-streaming"></span><div class="vt-card-copy"><small>Streaming</small><strong>Tech Support</strong><em>OBS, audio & performance</em></div></a>'+
     '<a class="vt-mobile-link account" href="account.html"><span class="vt-card-image vt-image-account"></span><div class="vt-card-copy"><small>Account</small><strong>My Account</strong><em>Your VoltTech profile</em></div></a>'+
     '<a class="vt-mobile-link contact" href="index.html#contact"><span class="vt-card-image vt-image-contact"></span><div class="vt-card-copy"><small>Contact</small><strong>Get Help</strong><em>WhatsApp or email</em></div></a>'+
     '<a class="vt-mobile-link static" href="static.html"><span class="vt-card-image vt-image-static"></span><div class="vt-card-copy"><small>Editorial</small><strong>STATIC</strong><em>Tech, gaming & hardware</em></div></a>'+
   '</div>';

 document.body.append(backdrop,drawer);

 async function updateCreatorMenu(){
   const count=document.getElementById('vtMenuLiveCount');
   const meta=document.getElementById('vtMenuCreatorMeta');
   const strip=document.getElementById('vtMenuCreatorStrip');
   const visual=document.getElementById('vtMenuCreatorVisual');
   if(!count||!meta||!strip)return;
   try{
     const res=await fetch('sa-streamers-live.json?menu=1',{cache:'no-store'});
     if(!res.ok)throw new Error('feed');
     const data=await res.json();
     const creators=Array.isArray(data.streamers)?data.streamers:[];
     const live=creators.filter(s=>s.live);
     count.textContent=live.length+' LIVE NOW';
     meta.textContent=live.length
       ? live.length+' creator'+(live.length===1?' is':'s are')+' live · '+(data.valid_count||creators.length)+' tracked'
       : 'No one live right now · '+(data.valid_count||creators.length)+' creators tracked';
     strip.innerHTML='';
     if(visual){
       const featured=live[0]||creators[0];
       if(featured&&featured.profile_image_url){
         visual.style.backgroundImage='linear-gradient(90deg,rgba(12,8,16,.02),rgba(12,8,16,.78)),url("'+featured.profile_image_url.replace(/"/g,'%22')+'")';
       }
     }
     live.slice(0,4).forEach(s=>{
       const img=document.createElement('img');
       img.src=s.profile_image_url;
       img.alt='';
       img.loading='lazy';
       img.title=s.display_name||s.login||'Live creator';
       strip.appendChild(img);
     });
     if(live.length){
       const txt=document.createElement('span');
       txt.textContent=live.slice(0,2).map(s=>s.display_name||s.login).join(' · ');
       strip.appendChild(txt);
     }
   }catch(e){
     count.textContent='LIVE';
     meta.textContent='Discover South African creators live on Twitch.';
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
 }
 button.addEventListener('click',()=>setOpen(button.getAttribute('aria-expanded')!=='true'));
 backdrop.addEventListener('click',()=>setOpen(false));
 drawer.addEventListener('click',e=>{if(e.target.closest('a'))setOpen(false)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});
 window.addEventListener('resize',()=>{if(innerWidth>700)setOpen(false)});
}

function enhanceHomepageBrand(){
 if(location.pathname!=='/'&&location.pathname!=='/index.html')return;
 const hero=document.querySelector('.hero');
 if(!hero||hero.querySelector('.vt-hero-brand'))return;

 const style=document.createElement('style');
 style.id='vt-home-brand-style';
 style.textContent=`
 .hero{position:relative;overflow:hidden}
 .vt-hero-brand{position:relative;z-index:2;display:flex;align-items:center;gap:11px;width:max-content;margin-bottom:20px}
 .vt-hero-brand-mark{width:38px;height:38px;object-fit:contain;filter:drop-shadow(0 0 14px rgba(47,230,200,.12))}
 .vt-hero-brand-copy{display:flex;flex-direction:column;line-height:1}
 .vt-hero-brand-name{font:700 18px 'Space Grotesk',sans-serif;letter-spacing:-.035em;color:#f4f8f7}
 .vt-hero-brand-name .volt{color:#2fe6c8}
 .vt-hero-brand-company{margin-top:5px;font:700 7.5px 'JetBrains Mono',monospace;letter-spacing:.28em;color:#78938f;text-transform:uppercase}
 .vt-hero-watermark{position:absolute;z-index:0;right:-58px;top:13px;width:235px;height:235px;object-fit:contain;opacity:.055;pointer-events:none;user-select:none}
 .hero>.eyebrow,.hero>h1,.hero>.sub{position:relative;z-index:1}
 @media(max-width:560px){
   .hero{padding-top:46px}
   .vt-hero-brand{margin-bottom:18px}
   .vt-hero-brand-mark{width:34px;height:34px}
   .vt-hero-brand-name{font-size:17px}
   .vt-hero-watermark{width:190px;height:190px;right:-62px;top:20px;opacity:.05}
 }
 `;
 document.head.appendChild(style);

 const brand=document.createElement('div');
 brand.className='vt-hero-brand';
 brand.setAttribute('aria-label','VoltTech Computer Co.');
 brand.innerHTML=
   '<img class="vt-hero-brand-mark" src="brand/VoltTech_Emblem_Transparent.png" alt="" aria-hidden="true">'+
   '<span class="vt-hero-brand-copy">'+
     '<span class="vt-hero-brand-name"><span class="volt">VOLT</span>TECH</span>'+
     '<span class="vt-hero-brand-company">COMPUTER CO.</span>'+
   '</span>';

 const watermark=document.createElement('img');
 watermark.className='vt-hero-watermark';
 watermark.src='brand/VoltTech_Emblem_Transparent.png';
 watermark.alt='';
 watermark.setAttribute('aria-hidden','true');

 const eyebrow=hero.querySelector('.eyebrow');
 if(eyebrow)hero.insertBefore(brand,eyebrow);
 else hero.prepend(brand);
 hero.appendChild(watermark);

 const h1=hero.querySelector('h1');
 if(h1)h1.innerHTML='PC Repair in Pretoria. <span>Done properly.</span>';
}

function init(){
 installAppMetadata();
 addContactIcons();
 if(/\/static(?:-|\.html|\/)/.test(location.pathname))return;
 const cls=pages[location.pathname];
 if(cls)document.body.classList.add(cls);
 loadVisualCSS();
 enhanceWhatsAppLinks();
 enhanceHomepageBrand();
 initMobileNavigation();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();