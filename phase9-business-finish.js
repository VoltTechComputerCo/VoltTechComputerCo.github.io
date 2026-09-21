/* VoltTech V2 — Phase 9 v3
   Full public service shell redesign.
   Works on GitHub Pages and branch-preview hosts by using page filenames. */
(() => {
  if (window.__voltTechPhase9V3) return;
  window.__voltTechPhase9V3 = true;

  const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const isHome=page==='index.html';

  const services=[
    {
      key:'repair',
      page:'pc-repair-pretoria.html',
      label:'PC Repair',
      eyebrow:'REPAIR & DIAGNOSTICS',
      description:'Boot failures, crashes, overheating and hardware or software faults.',
      hero:'PC Repair',
      heroLine:'Find the fault. Fix the cause.',
      image:'vt-repair.webp',
      accent:'#ff6b6b',
      rgb:'255,107,107'
    },
    {
      key:'performance',
      page:'pc-performance-optimisation.html',
      label:'Performance',
      eyebrow:'PC PERFORMANCE',
      description:'Startup, storage, thermal and system tuning backed by repeatable tests.',
      hero:'PC Performance Optimisation',
      heroLine:'Make the machine feel fast again.',
      image:'vt-performance.webp',
      accent:'#ffb454',
      rgb:'255,180,84'
    },
    {
      key:'upgrades',
      page:'pc-upgrades-pretoria.html',
      label:'Upgrades',
      eyebrow:'PC UPGRADES',
      description:'SSD, NVMe, RAM, GPU and cooling upgrades with compatibility checks.',
      hero:'PC Upgrades',
      heroLine:'Upgrade what actually matters.',
      image:'vt-upgrades.webp',
      accent:'#62a8ff',
      rgb:'98,168,255'
    },
    {
      key:'security',
      page:'virus-malware-removal-pretoria.html',
      label:'Security',
      eyebrow:'PC SECURITY',
      description:'Virus, malware, browser hijack and unwanted software cleanup.',
      hero:'PC Security & Malware Removal',
      heroLine:'Clean it up without scare tactics.',
      image:'vt-malware.webp',
      accent:'#b779ff',
      rgb:'183,121,255'
    },
    {
      key:'windows',
      page:'windows-installation-pretoria.html',
      label:'Windows',
      eyebrow:'WINDOWS',
      description:'Clean installations with drivers, updates and post-install checks.',
      hero:'Windows Installation & Setup',
      heroLine:'A fresh start, finished properly.',
      image:'vt-windows.webp',
      accent:'#42d9ff',
      rgb:'66,217,255'
    },
    {
      key:'streaming',
      page:'streaming-setup-south-africa.html',
      label:'Streaming',
      eyebrow:'CREATOR TECH',
      description:'OBS, encoder, audio and stream-performance support across South Africa.',
      hero:'Streaming Technical Support',
      heroLine:'OBS, audio and performance without the guesswork.',
      image:'vt-streaming.webp',
      accent:'#d778ff',
      rgb:'215,120,255'
    }
  ];

  const current=services.find(s=>s.page===page)||null;
  const isCreator=page==='creator-hub-south-africa.html';

  document.body.classList.add('vt9-v3');
  if(current){
    document.body.classList.add('vt9-service-page',`vt9-${current.key}`);
    document.documentElement.style.setProperty('--vt-service-accent',current.accent);
    document.documentElement.style.setProperty('--vt-service-rgb',current.rgb);
  }

  function rebuildGlobalNav(){
    const nav=document.querySelector('nav .navlinks');
    if(!nav)return;

    const servicesHref=current?'#vt-all-services':'index.html#services';
    nav.innerHTML=[
      `<a href="index.html">Home</a>`,
      `<a href="${servicesHref}">Services</a>`,
      `<a href="creator-hub-south-africa.html">Creator Hub</a>`,
      `<a class="static-link" href="static.html">STATIC ↗</a>`,
      `<a class="account-link" href="account.html">Account</a>`,
      current?`<a href="#contact">Contact</a>`:`<a href="index.html#contact">Contact</a>`
    ].join('');
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
    identity.innerHTML=
      `<small>VOLTTECH SERVICE</small>`+
      `<b>${current.eyebrow}</b>`;
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

    if(lead){
      lead.classList.add('vt-service-lead');
    }
  }

  function buildServiceMenu(){
    if(!current)return;

    const oldService=document.querySelector('.service-network');
    const oldCreator=current.key==='streaming'
      ? document.querySelector('.creator-network')
      : null;

    const menu=document.createElement('section');
    menu.id='vt-all-services';
    menu.className='vt-all-services';
    menu.setAttribute('aria-labelledby','vtAllServicesTitle');

    const cards=services.map(s=>{
      const active=s.key===current.key;
      return `
      <a class="vt-service-option vt-service-${s.key}${active?' active':''}"
         href="${s.page}"
         style="--card-accent:${s.accent};--card-rgb:${s.rgb}"
         ${active?'aria-current="page"':''}>
        <div class="vt-service-option-top">
          <small>${s.eyebrow}</small>
          ${active?'<span>CURRENT SERVICE</span>':'<span>OPEN ↗</span>'}
        </div>
        <h3>${s.label}</h3>
        <p>${s.description}</p>
        <b>${active?'YOU ARE HERE':'VIEW SERVICE →'}</b>
      </a>`;
    }).join('');

    menu.innerHTML=`
      <div class="vt-service-menu-head">
        <div>
          <small>// VOLTTECH SERVICES</small>
          <h2 id="vtAllServicesTitle">Explore every service.</h2>
          <p>Move between services without going back to the homepage.</p>
        </div>
        <a href="${current.key==='streaming'?'stream-scan.html':'signal-scan.html?source='+encodeURIComponent(current.key)}">
          Not sure? Run the free ${current.key==='streaming'?'Stream Scan':'Signal Scan'} →
        </a>
      </div>
      <div class="vt-service-menu-grid">${cards}</div>`;

    const hero=document.querySelector('.vt-service-hero');
    if(hero){
      hero.insertAdjacentElement('afterend',menu);
    }

    oldService?.remove();
    oldCreator?.remove();
  }

  function installServiceQuickDock(){
    if(!current || document.querySelector('.vt9-v3-dock'))return;
    const dock=document.createElement('div');
    dock.className='vt9-v3-dock';
    const diagnostic=current.key==='streaming'
      ? 'stream-scan.html'
      : `signal-scan.html?source=${encodeURIComponent(current.key)}`;
    dock.innerHTML=
      `<a class="vt9-v3-scan" href="${diagnostic}"><small>FREE TOOL</small><b>${current.key==='streaming'?'Stream Scan':'Signal Scan'}</b></a>`+
      `<a class="vt9-v3-wa" href="https://wa.me/27618435775" target="_blank" rel="noopener"><small>GET HELP</small><b>WhatsApp</b></a>`;
    document.body.appendChild(dock);

    const contact=document.querySelector('#contact');
    if(contact && 'IntersectionObserver' in window){
      const io=new IntersectionObserver(entries=>{
        dock.classList.toggle('is-hidden',entries.some(e=>e.isIntersecting));
      },{threshold:.08});
      io.observe(contact);
    }
  }

  function unifyCreatorNav(){
    if(!isCreator)return;
    const nav=document.querySelector('nav .navlinks');
    if(nav){
      nav.innerHTML=
        `<a href="index.html">Home</a>`+
        `<a href="index.html#services">Services</a>`+
        `<a href="#live">Live Creators</a>`+
        `<a href="streaming-setup-south-africa.html">Streaming Support</a>`+
        `<a class="static-link" href="static.html">STATIC ↗</a>`+
        `<a class="account-link" href="account.html">Account</a>`;
    }
  }

  function reveal(){
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const els=[...document.querySelectorAll(
      '.vt-service-option, main section:not(.vt-all-services), .support-card, .package, .service-card, .trust'
    )];
    if(!els.length)return;
    els.forEach(el=>el.classList.add('vt9-v3-reveal'));
    const io=new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    },{threshold:.06,rootMargin:'0px 0px -5% 0px'});
    els.forEach(el=>io.observe(el));
  }

  rebuildGlobalNav();
  redesignHero();
  buildServiceMenu();
  installServiceQuickDock();
  unifyCreatorNav();
  reveal();
})();