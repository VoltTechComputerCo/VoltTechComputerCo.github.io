/* VoltTech V2 — Phase 9 v5
   Compact service navigation + stable refresh layout. */
(() => {
  if (window.__voltTechPhase9V5) return;
  window.__voltTechPhase9V5 = true;

  const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const isCreator=page==='creator-hub-south-africa.html';

  const services=[
    {key:'repair',page:'pc-repair-pretoria.html',label:'Repair',hero:'PC Repair',heroLine:'Find the fault. Fix the cause.',image:'vt-repair.webp',accent:'#ff6b6b',rgb:'255,107,107'},
    {key:'performance',page:'pc-performance-optimisation.html',label:'Performance',hero:'PC Performance Optimisation',heroLine:'Make the machine feel fast again.',image:'vt-performance.webp',accent:'#ffb454',rgb:'255,180,84'},
    {key:'upgrades',page:'pc-upgrades-pretoria.html',label:'Upgrades',hero:'PC Upgrades',heroLine:'Upgrade what actually matters.',image:'vt-upgrades.webp',accent:'#62a8ff',rgb:'98,168,255'},
    {key:'security',page:'virus-malware-removal-pretoria.html',label:'Security',hero:'PC Security & Malware Removal',heroLine:'Clean it up without scare tactics.',image:'vt-malware.webp',accent:'#b779ff',rgb:'183,121,255'},
    {key:'windows',page:'windows-installation-pretoria.html',label:'Windows',hero:'Windows Installation & Setup',heroLine:'A fresh start, finished properly.',image:'vt-windows.webp',accent:'#42d9ff',rgb:'66,217,255'},
    {key:'streaming',page:'streaming-setup-south-africa.html',label:'Streaming',hero:'Streaming Technical Support',heroLine:'OBS, audio and performance without the guesswork.',image:'vt-streaming.webp',accent:'#d778ff',rgb:'215,120,255'}
  ];

  const current=services.find(s=>s.page===page)||null;
  document.body.classList.add('vt9-v5');

  if(current){
    document.body.classList.add('vt9-service-page',`vt9-${current.key}`);
    document.documentElement.style.setProperty('--vt-service-accent',current.accent);
    document.documentElement.style.setProperty('--vt-service-rgb',current.rgb);
  }

  function cleanCreatorTop(){
    if(!isCreator)return;
    document.querySelector('.creator-network')?.remove();
    document.querySelector('.creator-breadcrumb')?.remove();
  }

  function ensureCompactServiceRailStyles(){
    if(document.getElementById('vtCompactServiceRailStyles'))return;
    const style=document.createElement('style');
    style.id='vtCompactServiceRailStyles';
    style.textContent=`
      .service-network{margin:10px 0 16px!important;overflow:hidden!important;border:1px solid rgba(47,230,200,.18)!important;border-radius:9px!important;background:#071011!important;box-shadow:0 10px 26px rgba(0,0,0,.14)!important}
      .service-network-head{display:none!important}
      .service-network-links{display:flex!important;align-items:stretch!important;gap:0!important;overflow-x:auto!important;overflow-y:hidden!important;scroll-snap-type:x proximity!important;scrollbar-width:none!important;-webkit-overflow-scrolling:touch!important}
      .service-network-links::-webkit-scrollbar{display:none!important}
      .service-network-links a{--network-accent:#2fe6c8;position:relative!important;display:flex!important;align-items:center!important;justify-content:center!important;flex:0 0 auto!important;min-width:112px!important;min-height:45px!important;padding:8px 10px!important;border-right:1px solid #172526!important;background:#081113!important;color:#78918d!important;text-decoration:none!important;white-space:nowrap!important;scroll-snap-align:start!important;font-size:initial!important}
      .service-network-links a:nth-child(1){--network-accent:#ff6b6b}.service-network-links a:nth-child(2){--network-accent:#ffb454}.service-network-links a:nth-child(3){--network-accent:#62a8ff}.service-network-links a:nth-child(4){--network-accent:#b779ff}.service-network-links a:nth-child(5){--network-accent:#42d9ff}.service-network-links a:nth-child(6){--network-accent:#d778ff}
      .service-network-links a:last-child{border-right:0!important}
      .service-network-links a small{display:none!important}
      .service-network-links a b{display:block!important;margin:0!important;color:inherit!important;font:700 9.5px 'Space Grotesk',sans-serif!important;line-height:1!important;text-decoration:none!important}
      .service-network-links a:before{content:""!important;position:absolute!important;left:12px!important;right:12px!important;bottom:0!important;height:2px!important;background:var(--network-accent)!important;opacity:.35!important}
      .service-network-links a.active{color:var(--network-accent)!important;background:color-mix(in srgb,var(--network-accent) 9%,#081113)!important}
      .service-network-links a.active:before{opacity:1!important}
      .service-network-links a.active:after{content:"CURRENT"!important;margin-left:6px!important;padding:2px 4px!important;border:1px solid color-mix(in srgb,var(--network-accent) 36%,transparent)!important;border-radius:999px!important;color:var(--network-accent)!important;font:700 5.5px 'JetBrains Mono',monospace!important;letter-spacing:.05em!important}
    `;
    document.head.appendChild(style);
  }

  function buildStreamingServiceNetwork(){
    if(!current || current.key!=='streaming')return null;
    let existing=document.querySelector('.service-network');
    if(existing)return existing;

    document.querySelector('.creator-network')?.remove();
    document.querySelector('.creator-breadcrumb')?.remove();

    ensureCompactServiceRailStyles();

    const network=document.createElement('div');
    network.className='service-network';
    network.setAttribute('aria-label','VoltTech services');
    network.innerHTML=
      '<div class="service-network-links">'+
      services.map(s=>
        `<a href="${s.page}" class="${s.key===current.key?'active':''}" ${s.key===current.key?'aria-current="page"':''}><b>${s.label}</b></a>`
      ).join('')+
      '</div>';
    return network;
  }

  function moveCompactServiceNav(){
    if(!current)return;

    ensureCompactServiceRailStyles();

    let network=document.querySelector('.service-network');
    if(current.key==='streaming'){
      network=buildStreamingServiceNetwork();
    }
    if(!network)return;

    const hero=current.key==='streaming'
      ? document.querySelector('main header')
      : document.querySelector('header.hero');
    const crumb=document.querySelector('.service-breadcrumb,.creator-breadcrumb');

    if(crumb){
      crumb.insertAdjacentElement('afterend',network);
    }else if(hero){
      hero.insertAdjacentElement('beforebegin',network);
    }

    const active=network.querySelector('a.active,[aria-current="page"]');
    if(active){
      requestAnimationFrame(()=>active.scrollIntoView({block:'nearest',inline:'center'}));
    }
  }

  function redesignHero(){
    if(!current)return;

    const hero=current.key==='streaming'
      ? document.querySelector('main header')
      : document.querySelector('header.hero');
    if(!hero || hero.dataset.vtRedesigned==='1')return;

    hero.dataset.vtRedesigned='1';
    hero.classList.add('vt-service-hero');

    const existingH1=hero.querySelector('h1');
    const lead=hero.querySelector('.lead');
    if(existingH1){
      existingH1.innerHTML=
        `<span class="vt-service-heading">${current.hero}</span>`+
        `<span class="vt-service-tagline">${current.heroLine}</span>`;
    }

    const identity=document.createElement('div');
    identity.className='vt-service-identity';
    identity.innerHTML=`<small>VOLTTECH SERVICE</small><b>${current.label.toUpperCase()}</b>`;
    hero.insertBefore(identity,hero.firstChild);

    const copy=document.createElement('div');
    copy.className='vt-service-hero-copy';
    [...hero.childNodes].forEach(node=>{
      if(node!==copy && !node.classList?.contains?.('vt-service-hero-media')){
        copy.appendChild(node);
      }
    });

    const media=document.createElement('div');
    media.className='vt-service-hero-media';
    media.style.setProperty('--vt-hero-image',`url('${current.image}')`);
    media.innerHTML=
      `<div class="vt-media-top"><span>${current.label.toUpperCase()}</span><i></i></div>`+
      `<div class="vt-media-bottom"><small>VOLTTECH COMPUTER CO.</small><b>${current.key==='streaming'?'REMOTE · SOUTH AFRICA':'DIAGNOSTIC FIRST'}</b></div>`;

    hero.append(copy,media);
    lead?.classList.add('vt-service-lead');
  }

  function removeOldGeneratedServiceMenu(){
    document.querySelector('.vt-all-services')?.remove();
  }

  function installWhatsAppDock(){
    if(!current || document.querySelector('.vt9-wa-dock'))return;

    const dock=document.createElement('a');
    dock.className='vt9-wa-dock';
    dock.href='https://wa.me/27618435775';
    dock.target='_blank';
    dock.rel='noopener';
    dock.setAttribute('aria-label','WhatsApp VoltTech');
    dock.innerHTML='<span class="vt9-wa-icon" aria-hidden="true">◉</span><b>WhatsApp Us</b>';
    document.body.appendChild(dock);

    const contact=document.querySelector('#contact');
    if(contact && 'IntersectionObserver' in window){
      const io=new IntersectionObserver(entries=>{
        dock.classList.toggle('is-hidden',entries.some(e=>e.isIntersecting));
      },{threshold:.08});
      io.observe(contact);
    }
  }

  cleanCreatorTop();
  removeOldGeneratedServiceMenu();
  moveCompactServiceNav();
  redesignHero();
  installWhatsAppDock();
})();