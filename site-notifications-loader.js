(()=>{
  if(window.__vtNotificationLoaderStarted)return;
  window.__vtNotificationLoaderStarted=true;

  let hasAuth=false;
  try{hasAuth=Object.keys(localStorage).some(k=>k.startsWith('sb-')&&k.includes('-auth-token'));}catch{}
  if(!hasAuth)return;

  const self=document.currentScript;
  const base=new URL('./',self?.src||location.href);

  function style(href){
    const abs=new URL(href,base).href;
    if([...document.querySelectorAll('link[rel="stylesheet"]')].some(l=>l.href===abs))return;
    const el=document.createElement('link');el.rel='stylesheet';el.href=abs;document.head.append(el);
  }
  function loadScript(src,test){
    return new Promise((resolve,reject)=>{
      if(test?.()){resolve();return}
      const abs=new URL(src,base).href;
      const existing=[...document.scripts].find(s=>s.src===abs);
      if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return}
      const el=document.createElement('script');el.src=abs;el.async=false;el.onload=resolve;el.onerror=reject;document.head.append(el);
    });
  }
  async function boot(){
    style('notifications.css?v=4.1.0');
    try{
      if(!window.supabase){
        await new Promise((resolve,reject)=>{const el=document.createElement('script');el.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';el.onload=resolve;el.onerror=reject;document.head.append(el)});
      }
      if(!window.VOLTTECH_SUPABASE)await loadScript('supabase-config.js',()=>!!window.VOLTTECH_SUPABASE);
      if(![...document.scripts].some(s=>s.src.includes('/notifications.js')))await loadScript('notifications.js?v=4.1.0');
    }catch(e){console.warn('VoltTech notifications unavailable',e)}
  }
  boot();
})();
