(function(){
'use strict';

const body=document.body;
const scriptSrc=body.dataset.storeScript||'';
const announcement=document.querySelector('.announcement');

function lockStore(){
  body.classList.add('store-gated');
  body.classList.remove('store-open');
  if(announcement) announcement.textContent='Store coming soon.';
}

function openStore(settings){
  body.classList.remove('store-gated');
  body.classList.add('store-open');
  if(announcement && settings?.banner_text) announcement.textContent=settings.banner_text;
  if(!scriptSrc) return;
  const script=document.createElement('script');
  script.src=scriptSrc;
  script.async=false;
  document.body.appendChild(script);
}

async function init(){
  lockStore();
  try{
    const VT=window.VoltTechStore;
    if(!VT || typeof VT.getClient!=='function') return;
    const {data,error}=await VT.getClient()
      .from('store_settings')
      .select('catalogue_enabled,banner_text')
      .eq('id','store')
      .single();

    if(error || !data?.catalogue_enabled) return;
    openStore(data);
  }catch(error){
    console.error('VoltTech store launch gate:',error);
    lockStore();
  }
}

init();
})();
