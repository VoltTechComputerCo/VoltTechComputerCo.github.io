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

function loadCSS(href,key){
 if(document.querySelector('link[data-vt-'+key+']'))return;
 const l=document.createElement('link');
 l.rel='stylesheet'; l.href=href; l.dataset['vt'+key.replace(/(^|-)([a-z])/g,(_,a,b)=>b.toUpperCase())]='1';
 document.head.appendChild(l);
}
function loadVisualCSS(){
 loadCSS('visual-system.css?v=10.1','visual-system');
 loadCSS('visual-block-fix.css?v=2','visual-fix');
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

function addVoltTechHQ(){
 if(location.pathname!='/streaming-setup-south-africa.html')return;

 const invite='https://discord.gg/Uk3PN8k2dA';
 const hub=document.getElementById('sa-streamers');
 if(!hub || document.getElementById('volttech-hq'))return;

 const style=document.createElement('style');
 style.textContent=`
 .discord-panel{border-color:rgba(47,230,200,.34)!important;background:radial-gradient(circle at 100% 0,rgba(47,230,200,.08),transparent 38%),rgba(18,16,26,.93)!important}
 .discord-grid{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(240px,.8fr);gap:16px;align-items:center}
 .discord-copy p{margin:0;color:var(--muted);font-size:14px;line-height:1.75}
 .discord-actions{display:grid;gap:9px}.discord-actions .btn{width:100%}
 .discord-join{background:var(--teal)!important;border-color:var(--teal)!important;color:#04120f!important;gap:9px}
 .discord-icon{width:18px;height:18px;display:block;fill:currentColor;flex:0 0 auto}
 .discord-note{margin-top:12px;color:var(--muted);font:9px var(--mono);line-height:1.6}
 @media(max-width:760px){.discord-grid{grid-template-columns:1fr}}
 `;
 document.head.appendChild(style);

 const section=document.createElement('section');
 section.className='panel discord-panel';
 section.id='volttech-hq';
 section.innerHTML=`
   <div class="discord-grid">
     <div class="discord-copy">
       <div class="tag">// VOLTTECH HQ Â· SA CREATOR COMMUNITY</div>
       <h2>Join the community behind the streams.</h2>
       <p>VoltTech HQ is our South African Discord for PC enthusiasts, gamers, viewers and creators. Streamers can join, apply for <strong>Verified Streamer</strong>, get help with their setup and become part of our creator discovery community.</p>
       <div class="discord-note">Verified Streamer is manually approved. LIVE status is handled automatically in Discord when supported.</div>
     </div>
     <div class="discord-actions">
       <a class="btn discord-join" href="${invite}" target="_blank" rel="noopener" aria-label="Join VoltTech HQ on Discord"><svg class="discord-icon" viewBox="0 0 127.14 96.36" aria-hidden="true" focusable="false"><path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-9.39 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77.09 77.09 0 0 0 6.89 9.38 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15ZM42.45 65.69C36.18 65.69 31 59.95 31 52.9s5.07-12.8 11.43-12.8 11.54 5.79 11.43 12.8c.01 7.05-5.07 12.79-11.41 12.79Zm42.24 0c-6.27 0-11.45-5.74-11.45-12.79s5.07-12.8 11.45-12.8 11.54 5.79 11.43 12.8c0 7.05-5.05 12.79-11.43 12.79Z"/></svg><span>Join VoltTech HQ â†’</span></a>
       <a class="btn scan" href="stream-scan.html">Run Stream Scan â†’</a>
     </div>
   </div>`;
 hub.insertAdjacentElement('afterend',section);

 const nav=document.querySelector('.navlinks');
 if(nav && !nav.querySelector('a[href="#volttech-hq"]')){
   const a=document.createElement('a');
   a.href='#volttech-hq';
   a.textContent='VoltTech HQ';
   const support=nav.querySelector('a[href="#support"]');
   if(support)nav.insertBefore(a,support); else nav.appendChild(a);
 }

 const footer=document.querySelector('footer .wrap');
 if(footer && !footer.querySelector('a[href*="discord.gg/"]')){
   footer.append(' Â· ');
   const a=document.createElement('a');
   a.href=invite;
   a.target='_blank';
   a.rel='noopener';
   a.textContent='VOLTTECH HQ DISCORD â†—';
   a.style.color='var(--teal)';
   a.style.textDecoration='none';
   footer.appendChild(a);
 }

 document.querySelectorAll(`a[href="${invite}"]`).forEach(a=>{
   a.addEventListener('click',()=>gtag('event','discord_join_click',{
     page_path:location.pathname,
     link_text:(a.textContent||'').trim()
   }));
 });
}

function init(){
 addContactIcons();
 if(/\/static(?:-|\.html|\/)/.test(location.pathname))return;
 const cls=pages[location.pathname];
 if(cls)document.body.classList.add(cls);
 loadVisualCSS();
 enhanceWhatsAppLinks();
 addVoltTechHQ();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();
