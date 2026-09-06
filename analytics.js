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
'/stream-scan.html':'vt-page-streamscan'
};

const pageMessages={
'/':"Hi VoltTech! I'd like some help with my PC. My issue is: ",
'/index.html':"Hi VoltTech! I'd like some help with my PC. My issue is: ",
'/pc-repair-pretoria.html':"Hi VoltTech! I'd like help with a PC repair or diagnostic. The problem I'm having is: ",
'/pc-performance-optimisation.html':"Hi VoltTech! I'd like help improving my PC's performance. The main issue I'm noticing is: ",
'/pc-upgrades-pretoria.html':"Hi VoltTech! I'm interested in upgrading my PC. I'm considering: ",
'/virus-malware-removal-pretoria.html':"Hi VoltTech! I think my PC may have a virus or malware. The symptoms I'm seeing are: ",
'/windows-installation-pretoria.html':"Hi VoltTech! I'd like help with a Windows installation or Windows-related issue. What I need is: "
};

function loadVisualCSS(){
 if(document.querySelector('link[data-vt-visual-system]'))return;
 const l=document.createElement('link');
 l.rel='stylesheet';
 l.href='visual-system.css?v=10.1';
 l.dataset.vtVisualSystem='1';
 document.head.appendChild(l);

 const f=document.createElement('link');
 f.rel='stylesheet';
 f.href='visual-block-fix.css?v=2';
 f.dataset.vtVisualFix='1';
 document.head.appendChild(f);
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

function init(){
 if(/\/static(?:-|\.html|\/)/.test(location.pathname))return;
 const cls=pages[location.pathname];
 if(cls)document.body.classList.add(cls);
 loadVisualCSS();
 enhanceWhatsAppLinks();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();
