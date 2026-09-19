(()=>{
  if(window.__vtNotificationLoaderV6)return;
  window.__vtNotificationLoaderV6=true;

  const self=document.currentScript;
  const base=new URL('./',self?.src||location.href);

  function addStyle(href){
    const abs=new URL(href,base).href;
    const exists=[...document.querySelectorAll('link[rel="stylesheet"]')].some(
      l=>(l.href||'').split('?')[0]===abs.split('?')[0]
    );
    if(exists)return;
    const el=document.createElement('link');
    el.rel='stylesheet';
    el.href=abs;
    document.head.append(el);
  }

  function addScript(src,test){
    return new Promise((resolve,reject)=>{
      if(test?.()){resolve();return}
      const abs=new URL(src,base).href;
      const existing=[...document.scripts].find(
        s=>(s.src||'').split('?')[0]===abs.split('?')[0]
      );
      if(existing){
        if(test?.()){resolve();return}
        existing.addEventListener('load',resolve,{once:true});
        existing.addEventListener('error',reject,{once:true});
        return;
      }
      const el=document.createElement('script');
      el.src=abs;
      el.async=false;
      el.onload=resolve;
      el.onerror=reject;
      document.head.append(el);
    });
  }

  function removePausedBuilderLinks(){
    document.querySelectorAll('.vt-menu-builder').forEach(el=>el.remove());
  }

  function removePausedStoreLinks(){
    document.querySelectorAll('.store-link,.vt-menu-parts').forEach(el=>el.remove());
    document.querySelectorAll('.quick-row a[href="store.html"]').forEach(el=>el.remove());
  }

  function addBuilderMenuLink(){
    document.querySelectorAll('.vt-mobile-links').forEach(list=>{
      if(list.querySelector('.vt-menu-builder'))return;
      const a=document.createElement('a');
      a.className='vt-mobile-link vt-menu-builder';
      a.href=new URL('builder/',base).href;
      a.innerHTML='<span class="vt-card-image vt-image-builder"></span><div class="vt-card-copy"><small>Build</small><strong>PC Builder</strong><em>Plan and configure your PC</em></div>';
      list.prepend(a);
    });
  }

  function enforceBuilderVisibility(enabled){
    if(enabled){
      addBuilderMenuLink();
      const mo=new MutationObserver(()=>{
        addBuilderMenuLink();
        if(document.querySelector('.vt-menu-builder'))mo.disconnect();
      });
      if(!document.querySelector('.vt-menu-builder')){
        mo.observe(document.documentElement,{childList:true,subtree:true});
        setTimeout(()=>mo.disconnect(),8000);
      }
      return;
    }

    removePausedBuilderLinks();
    const mo=new MutationObserver(removePausedBuilderLinks);
    mo.observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(()=>mo.disconnect(),8000);
  }

  async function getLaunchAccess(){
    const access={catalogueEnabled:false,builderEnabled:false};
    try{
      if(!window.VOLTTECH_SUPABASE){
        await addScript('supabase-config.js',()=>!!window.VOLTTECH_SUPABASE);
      }
      const cfg=window.VOLTTECH_SUPABASE;
      if(!cfg?.url||!cfg?.publishableKey)throw new Error('Supabase public configuration unavailable');

      const endpoint=new URL('/rest/v1/store_settings',cfg.url);
      endpoint.searchParams.set('id','eq.store');
      endpoint.searchParams.set('select','catalogue_enabled,builder_enabled');

      const res=await fetch(endpoint.href,{
        method:'GET',
        cache:'no-store',
        headers:{
          apikey:cfg.publishableKey,
          Authorization:`Bearer ${cfg.publishableKey}`,
          Accept:'application/json'
        }
      });
      if(!res.ok)throw new Error(`launch access ${res.status}`);

      const rows=await res.json();
      const settings=Array.isArray(rows)?rows[0]:null;
      access.catalogueEnabled=settings?.catalogue_enabled===true;
      access.builderEnabled=settings?.builder_enabled===true;
    }catch(error){
      console.warn('VoltTech launch access unavailable; commerce navigation remains locked.',error);
    }

    window.__vtLaunchAccess=access;
    document.documentElement.classList.toggle('vt-store-enabled',access.catalogueEnabled);
    document.documentElement.classList.toggle('vt-builder-enabled',access.builderEnabled);

    enforceBuilderVisibility(access.builderEnabled);

    if(access.catalogueEnabled){
      try{
        await addScript('commerce/js/site-store-entry.js?v=1.0.0',()=>!!window.__vtMoneyMakerEntry);
      }catch(error){
        console.warn('VoltTech store navigation unavailable',error);
      }
    }else{
      removePausedStoreLinks();
    }

    return access;
  }

  getLaunchAccess();

  let hasAuth=false;
  try{
    hasAuth=Object.keys(localStorage).some(k=>/^sb-.*-auth-token$/.test(k));
  }catch{}
  if(!hasAuth)return;

  async function boot(){
    addStyle('notifications.css?v=5.2.0');
    addStyle('onboarding.css?v=1.0.0');
    try{
      if(!window.supabase){
        await new Promise((resolve,reject)=>{
          const el=document.createElement('script');
          el.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
          el.onload=resolve;
          el.onerror=reject;
          document.head.append(el);
        });
      }
      if(!window.VOLTTECH_SUPABASE){
        await addScript('supabase-config.js',()=>!!window.VOLTTECH_SUPABASE);
      }
      if(!window.__voltTechNotificationsV5){
        await addScript('notifications.js?v=5.2.0',()=>!!window.__voltTechNotificationsV5);
      }
      if(!window.__voltTechOnboardingV1){
        await addScript('onboarding.js?v=1.0.0',()=>!!window.__voltTechOnboardingV1);
      }
    }catch(error){
      console.warn('VoltTech account services unavailable',error);
    }
  }

  boot();
})();
