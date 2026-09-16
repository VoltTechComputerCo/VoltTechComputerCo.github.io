(()=>{
  if(window.__voltTechOnboardingV1)return;
  window.__voltTechOnboardingV1=true;

  const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  if(page!=='account.html')return;

  const steps=[
    {
      kicker:'WELCOME / 01',
      title:'Welcome to VoltTech.',
      body:'Your account is your control centre. If something needs your attention, it appears on Overview and in the notification bell — so you never need to guess what happens next.',
      note:'Start here whenever you want a quick snapshot of your builds, quotes, invoices, orders and service work.'
    },
    {
      kicker:'ACTIVITY / 02',
      title:'Follow everything in one timeline.',
      body:'Activity combines your PC builds, quotations, invoices, orders and service jobs in one searchable place. It is the easiest way to answer “what happened with my job?”',
      note:'Use Activity when you know the job, but not which document or section it lives in.'
    },
    {
      kicker:'BUILDS + QUOTES / 03',
      title:'Build it. Request it. Approve it.',
      body:'Save a PC configuration, then request a formal quotation when you are ready. Builder prices are estimates until VoltTech reviews stock, compatibility and current pricing.',
      note:'When a quotation is ready, open it from your notification or account and choose Accept or Decline.'
    },
    {
      kicker:'DOCUMENTS / 04',
      title:'Your paperwork stays together.',
      body:'Quotes, build specifications, invoices, receipts and service records live in your account and can be opened or saved as printable PDFs with their own unique reference numbers.',
      note:'Documents is the fastest place to find formal paperwork. Activity is better for following progress.'
    },
    {
      kicker:'NOTIFICATIONS / 05',
      title:'We tell you when something changes.',
      body:'The notification bell follows you around the VoltTech site while you are logged in. New quotes, invoices, payments and service updates can appear in realtime with a chime and a direct link to the exact action.',
      note:'You can switch notification sound on or off from the bell menu at any time.'
    },
    {
      kicker:'ACCOUNT + PRIVACY / 06',
      title:'You stay in control.',
      body:'Use More for your profile, addresses, security settings and Privacy & Data tools. You can review your personal information, download your data and use the protected account-deletion process when needed.',
      note:'You can replay this tour any time from More → How VoltTech works.'
    }
  ];

  let current=0,overlay=null;
  const esc=v=>String(v??'').replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':'&quot;',"'":'&#039;'}[a]));

  function cleanTourParam(){
    const url=new URL(location.href);
    if(!url.searchParams.has('tour'))return;
    url.searchParams.delete('tour');
    history.replaceState(null,'',`${url.pathname}${url.search}${url.hash}`);
  }

  function render(){
    if(!overlay)return;
    const s=steps[current],last=current===steps.length-1;
    const card=overlay.querySelector('.vt-tour-card');
    card.innerHTML=`
      <div class="vt-tour-head">
        <div><small>${esc(s.kicker)}</small><h2>${esc(s.title)}</h2></div>
        <button class="vt-tour-close" type="button" aria-label="Close tutorial">×</button>
      </div>
      <div class="vt-tour-progress" aria-label="Tutorial progress">${steps.map((_,i)=>`<span class="${i===current?'active':i<current?'done':''}"></span>`).join('')}</div>
      <div class="vt-tour-body">
        <p>${esc(s.body)}</p>
        <div class="vt-tour-note"><b>Good to know</b><span>${esc(s.note)}</span></div>
      </div>
      <div class="vt-tour-actions">
        <button class="vt-tour-skip" type="button">${last?'Close':'Skip tour'}</button>
        <div>
          ${current?'<button class="vt-tour-back" type="button">Back</button>':''}
          <button class="vt-tour-next" type="button">${last?'Start exploring':'Next'}</button>
        </div>
      </div>`;

    card.querySelector('.vt-tour-close').addEventListener('click',closeTour);
    card.querySelector('.vt-tour-skip').addEventListener('click',closeTour);
    card.querySelector('.vt-tour-back')?.addEventListener('click',()=>{current--;render()});
    card.querySelector('.vt-tour-next').addEventListener('click',()=>{
      if(last){closeTour();document.querySelector('#accountHub')?.scrollIntoView({behavior:'smooth',block:'start'});return}
      current++;render();
    });
  }

  function closeTour(){
    overlay?.remove();overlay=null;
    document.documentElement.classList.remove('vt-tour-open');
    cleanTourParam();
  }

  function openTour(){
    if(overlay)return;
    current=0;
    overlay=document.createElement('div');
    overlay.className='vt-tour-overlay';
    overlay.innerHTML='<section class="vt-tour-card" role="dialog" aria-modal="true" aria-label="How VoltTech works"></section>';
    document.body.appendChild(overlay);
    document.documentElement.classList.add('vt-tour-open');
    overlay.addEventListener('click',e=>{if(e.target===overlay)closeTour()});
    render();
  }

  function addReplayControl(){
    const grid=document.querySelector('#accountMenu .account-more-grid');
    if(!grid||grid.querySelector('#vtReplayTour'))return;
    const b=document.createElement('button');
    b.id='vtReplayTour';b.className='tab';b.type='button';b.textContent='How VoltTech works';
    b.addEventListener('click',()=>{
      document.querySelector('#accountMenuToggle')?.click();
      openTour();
    });
    grid.appendChild(b);
  }

  function init(){
    addReplayControl();
    setTimeout(addReplayControl,350);
    const params=new URLSearchParams(location.search);
    if(params.get('tour')==='1')setTimeout(openTour,180);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
