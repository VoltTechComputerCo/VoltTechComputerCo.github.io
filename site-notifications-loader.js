(()=>{
  if(window.__vtNotificationLoaderV5)return;
  window.__vtNotificationLoaderV5=true;

  let hasAuth=false;
  try{
    hasAuth=Object.keys(localStorage).some(k=>/^sb-.*-auth-token$/.test(k));
  }catch{}
  if(!hasAuth)return;

  const self=document.currentScript;
  const base=new URL("./",self?.src||location.href);

  function addStyle(href){
    const abs=new URL(href,base).href;
    const exists=[...document.querySelectorAll('link[rel="stylesheet"]')].some(l=>(l.href||"").split("?")[0]===abs.split("?")[0]);
    if(exists)return;
    const el=document.createElement("link");
    el.rel="stylesheet";el.href=abs;document.head.append(el);
  }

  function addScript(src,test){
    return new Promise((resolve,reject)=>{
      if(test?.()){resolve();return}
      const abs=new URL(src,base).href;
      const existing=[...document.scripts].find(s=>(s.src||"").split("?")[0]===abs.split("?")[0]);
      if(existing){
        if(test?.()){resolve();return}
        existing.addEventListener("load",resolve,{once:true});
        existing.addEventListener("error",reject,{once:true});
        return;
      }
      const el=document.createElement("script");
      el.src=abs;el.async=false;el.onload=resolve;el.onerror=reject;
      document.head.append(el);
    });
  }

  async function boot(){
    addStyle("notifications.css?v=5.2.0");
    try{
      if(!window.supabase){
        await new Promise((resolve,reject)=>{
          const el=document.createElement("script");
          el.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
          el.onload=resolve;el.onerror=reject;
          document.head.append(el);
        });
      }
      if(!window.VOLTTECH_SUPABASE)await addScript("supabase-config.js",()=>!!window.VOLTTECH_SUPABASE);
      if(!window.__voltTechNotificationsV5)await addScript("notifications.js?v=5.2.0",()=>!!window.__voltTechNotificationsV5);
    }catch(e){
      console.warn("VoltTech notifications unavailable",e);
    }
  }

  boot();
})();
