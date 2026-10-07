(() => {
 const key='volttech-appearance';
 const read=()=>{try{return localStorage.getItem(key)==='dark'?'dark':'light';}catch{return 'light';}};
 let theme=read();
 const apply=value=>{
  theme=value==='dark'?'dark':'light';
  document.documentElement.dataset.theme=theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#031012':'#ffffff');
  const b=document.querySelector('[data-theme-toggle]');
  if(b){b.setAttribute('aria-label',theme==='dark'?'Switch to light mode':'Switch to dark mode');b.setAttribute('aria-pressed',String(theme==='dark'));b.innerHTML=(theme==='dark'?'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10l2 2M5 19l2-2M17 7l2-2"/></svg><span>Light mode</span>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/></svg><span>Dark mode</span>');}
  document.querySelectorAll('iframe').forEach(f=>{try{f.contentWindow.postMessage({type:'volttech:appearance',theme},location.origin);}catch{}});
 };
 apply(theme);
 const mount=()=>{
  if(window.self!==window.top){apply(read());return;}
  const b=document.createElement('button');b.type='button';b.className='theme-toggle';b.dataset.themeToggle='';
  b.addEventListener('click',()=>{const value=theme==='dark'?'light':'dark';try{localStorage.setItem(key,value);}catch{}apply(value);});
  const host=document.querySelector('.header-tools,.static-topbar-inner,.store-nav .nav-in,main>.top');
  if(host)host.append(b);else{b.classList.add('is-floating');document.body.append(b);}apply(read());
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 window.addEventListener('storage',e=>{if(e.key===key)apply(read());});
 window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===window.parent&&e.data?.type==='volttech:appearance')apply(e.data.theme);});
})();