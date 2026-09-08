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

 loadCSS('mobile-nav.css?v=1','mobile-nav');

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
   '<div class="vt-mobile-drawer-head"><span>VoltTech navigation</span><b>Tap to open</b></div>'+
   '<div class="vt-mobile-links">'+
     '<a class="vt-mobile-link" href="index.html"><small>01 · Home</small><span>VoltTech Home</span></a>'+
     '<a class="vt-mobile-link" href="index.html#services"><small>02 · Services</small><span>PC Services</span></a>'+
     '<a class="vt-mobile-link primary" href="signal-scan.html"><small>03 · Free Tool</small><span>Signal Scan</span></a>'+
     '<a class="vt-mobile-link creator" href="creator-hub-south-africa.html"><small>04 · Live</small><span>Creator Hub</span></a>'+
     '<a class="vt-mobile-link" href="streaming-setup-south-africa.html"><small>05 · Streaming</small><span>Technical Support</span></a>'+
     '<a class="vt-mobile-link" href="account.html"><small>06 · Account</small><span>My Account</span></a>'+
     '<a class="vt-mobile-link" href="index.html#contact"><small>07 · Contact</small><span>Contact VoltTech</span></a>'+
     '<a class="vt-mobile-link static" href="static.html"><small>08 · Editorial</small><span>STATIC ↗</span></a>'+
   '</div>';

 document.body.append(backdrop,drawer);

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
function init(){
 installAppMetadata();
 addContactIcons();
 if(/\/static(?:-|\.html|\/)/.test(location.pathname))return;
 const cls=pages[location.pathname];
 if(cls)document.body.classList.add(cls);
 loadVisualCSS();
 enhanceWhatsAppLinks();
 initMobileNavigation();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();