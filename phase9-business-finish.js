/* VoltTech V2 — Phase 9 / Business + visual finish
   Public conversion polish only. No pricing or commerce logic. */
(() => {
  if (window.__voltTechPhase9BusinessFinish) return;
  window.__voltTechPhase9BusinessFinish = true;

  const path = location.pathname || '/';
  const isHome = path === '/' || path === '/index.html';
  const isStreaming = path === '/streaming-setup-south-africa.html';
  const serviceMap = {
    '/pc-repair-pretoria.html':'repair',
    '/pc-performance-optimisation.html':'performance',
    '/pc-upgrades-pretoria.html':'upgrades',
    '/virus-malware-removal-pretoria.html':'security',
    '/windows-installation-pretoria.html':'windows'
  };
  const service = serviceMap[path] || '';

  document.body.classList.add('vt9-finished');

  function scanHref(){
    if(isStreaming) return 'stream-scan.html';
    if(service) return `signal-scan.html?source=${encodeURIComponent(service)}`;
    return 'signal-scan.html';
  }

  function scanLabel(){
    return isStreaming ? 'Free Stream Scan' : 'Free Signal Scan';
  }

  function installTrustRail(){
    if(document.querySelector('.vt9-trust-rail')) return;

    const hero = document.querySelector('header.hero, main header, .hero');
    if(!hero) return;

    const rail=document.createElement('div');
    rail.className='vt9-trust-rail';
    rail.setAttribute('aria-label','VoltTech service promises');

    const items = isHome
      ? [
          ['DIAGNOSTIC FIRST','Evidence before replacement'],
          ['CLEAR SCOPE','Know what is being quoted'],
          ['SOUTH AFRICA','Pretoria base · wider support']
        ]
      : isStreaming
        ? [
            ['REMOTE SUPPORT','Available across South Africa'],
            ['NO CREDENTIALS','Never share passwords or stream keys'],
            ['VERIFY THE FIX','Tune, test, confirm']
          ]
        : [
            ['NO PARTS CANNON','Find the cause first'],
            ['APPROVAL FIRST','Extra work is confirmed'],
            ['DIRECT SUPPORT','Talk to VoltTech directly']
          ];

    rail.innerHTML=items.map(([a,b])=>
      `<div class="vt9-trust-item"><small>${a}</small><b>${b}</b></div>`
    ).join('');

    hero.insertAdjacentElement('afterend',rail);
  }

  function installMobileDock(){
    if(document.querySelector('.vt9-mobile-dock')) return;

    const dock=document.createElement('div');
    dock.className='vt9-mobile-dock';
    dock.setAttribute('aria-label','Quick contact');

    const scan=scanHref();
    const wa='https://wa.me/27618435775';

    dock.innerHTML=
      `<a class="vt9-dock-scan" href="${scan}"><small>NOT SURE?</small><b>${scanLabel()}</b></a>`+
      `<a class="vt9-dock-wa" href="${wa}" target="_blank" rel="noopener"><small>READY TO TALK?</small><b>WhatsApp</b></a>`;

    document.body.appendChild(dock);

    dock.addEventListener('click',e=>{
      const a=e.target.closest('a');
      if(!a)return;
      try{
        if(typeof gtag==='function'){
          gtag('event','vt_mobile_quick_action',{
            action:a.classList.contains('vt9-dock-wa')?'whatsapp':'diagnostic',
            page_path:location.pathname
          });
        }
      }catch{}
    });
  }

  function setupReveal(){
    const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduce)return;

    const selectors=[
      'main section',
      '.service',
      '.scope-card',
      '.diagnostic-card',
      '.trust',
      '.area-card',
      '.step',
      '.service-card',
      '.package',
      '.panel',
      '.route'
    ];

    const nodes=[...new Set(selectors.flatMap(s=>[...document.querySelectorAll(s)]))]
      .filter(el=>!el.closest('.vt-mobile-drawer'));

    if(!nodes.length)return;

    nodes.forEach(el=>el.classList.add('vt9-reveal'));

    const io=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('vt9-visible');
          io.unobserve(entry.target);
        }
      });
    },{rootMargin:'0px 0px -8% 0px',threshold:.08});

    nodes.forEach(el=>io.observe(el));
  }

  function improveCards(){
    document.querySelectorAll('.service,.scope-card,.service-card,.trust-item,.step,.package,.route,.support-card').forEach(el=>{
      el.classList.add('vt9-premium-card');
    });
  }

  function observeContact(){
    const target=document.querySelector('#contact');
    const dock=document.querySelector('.vt9-mobile-dock');
    if(!target||!dock||!('IntersectionObserver' in window))return;

    const io=new IntersectionObserver(entries=>{
      dock.classList.toggle('vt9-contact-visible',entries.some(e=>e.isIntersecting));
    },{threshold:.12});
    io.observe(target);
  }

  installTrustRail();
  installMobileDock();
  improveCards();
  setupReveal();
  observeContact();
})();