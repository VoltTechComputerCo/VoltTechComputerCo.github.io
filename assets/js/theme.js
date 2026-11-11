(() => {
 const key='volttech-appearance';
 const seasonKey = 'volttech-season';
 const seasons = new Map([['christmas', 'Christmas'], ['original', 'Original']]);
 // Christmas ends at midnight on 1 January 2027 in South Africa.
 const christmasEndsAt = Date.parse('2027-01-01T00:00:00+02:00');
 const christmasActive = () => Date.now() < christmasEndsAt;
 const validSeason = value => {
  if (!christmasActive()) return 'original';
  return seasons.has(value) ? value : 'christmas';
 };
 const readSeason = () => {
  try { return validSeason(localStorage.getItem(seasonKey)); }
  catch { return validSeason(null); }
 };
 let season = readSeason();
 let seasonSelect;
 const setSeason = value => {
  season = validSeason(value);
  document.documentElement.dataset.season = season;
  if (seasonSelect && !christmasActive()) {
   seasonSelect.parentElement.remove();
   seasonSelect = undefined;
  }
  if (seasonSelect) seasonSelect.value = season;
 };
 setSeason(season);

 function mountSeasonPicker() {
  const bar = document.createElement('div');
  bar.className = 'vt-season-bar';
  const ornament = document.createElement('span');
  ornament.className = 'vt-season-ornament';
  ornament.setAttribute('aria-hidden', 'true');
  bar.append(ornament);
  seasonSelect = document.createElement('select');
  seasonSelect.dataset.seasonSelect = '';
  seasonSelect.setAttribute('aria-label', 'Theme');
  seasonSelect.title = 'Theme';
  for (const [value, name] of seasons) {
   const option = document.createElement('option');
   option.value = value;
   option.textContent = name;
   seasonSelect.append(option);
  }
  seasonSelect.value = season;
  seasonSelect.addEventListener('change', () => {
   setSeason(seasonSelect.value);
   try { localStorage.setItem(seasonKey, season); } catch {}
   apply(theme);
  });
  bar.append(seasonSelect);
  const header = document.querySelector('.site-header,.static-topbar,.store-nav,body > nav,main > .top');
  if (header?.tagName === 'HEADER') header.prepend(bar);
  else if (header) header.before(bar);
  else document.body.prepend(bar);
 }

 const read=()=>{try{return localStorage.getItem(key)==='light'?'light':'dark';}catch{return 'dark';}};
 let theme=read();
 const apply=value=>{
  theme=value==='dark'?'dark':'light';
  document.documentElement.dataset.theme=theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#031012':'#ffffff');
  const b=document.querySelector('[data-theme-toggle]');
  if(b){b.setAttribute('aria-label',theme==='dark'?'Switch to light mode':'Switch to dark mode');b.setAttribute('aria-pressed',String(theme==='dark'));b.innerHTML=(theme==='dark'?'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10l2 2M5 19l2-2M17 7l2-2"/></svg><span>Light mode</span>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/></svg><span>Dark mode</span>');}
  document.querySelectorAll('iframe').forEach(f=>{try{f.contentWindow.postMessage({type:'volttech:appearance',theme,season},location.origin);}catch{}});
 };
 apply(theme);
 const mount=()=>{
  if(window.self!==window.top){apply(read());return;}
  if (christmasActive()) mountSeasonPicker();
  const b=document.querySelector('[data-theme-toggle]')||document.createElement('button');b.type='button';b.className='theme-toggle';b.dataset.themeToggle='';
  b.addEventListener('click',()=>{const value=theme==='dark'?'light':'dark';try{localStorage.setItem(key,value);}catch{}apply(value);});
  const host=document.querySelector('.header-tools,.static-topbar-inner,.store-nav .nav-in,main>.top');
  if(host){if(!b.isConnected)host.append(b);}else{b.classList.add('is-floating');document.body.append(b);}apply(read());
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 function expireSeason() {
  if (christmasActive() || (season === 'original' && !seasonSelect)) return;
  setSeason('original');
  apply(theme);
 }
 function scheduleSeasonEnd() {
  const remaining = christmasEndsAt - Date.now();
  if (remaining <= 0) expireSeason();
  // Browsers limit a single timeout to a signed 32-bit delay.
  else window.setTimeout(scheduleSeasonEnd, Math.min(remaining, 2_147_483_647));
 }
 scheduleSeasonEnd();
 if (christmasActive()) {
  window.addEventListener('pageshow', expireSeason);
  document.addEventListener('visibilitychange', expireSeason);
 }
 window.addEventListener('storage', e => {
  if (e.key === seasonKey || e.key === null) setSeason(readSeason());
  if (e.key === key || e.key === seasonKey || e.key === null) apply(read());
 });
 window.addEventListener('message', e => {
  if (e.origin !== location.origin || e.source !== window.parent || e.data?.type !== 'volttech:appearance') return;
  if (seasons.has(e.data.season)) setSeason(e.data.season);
  apply(e.data.theme);
 });
})();
