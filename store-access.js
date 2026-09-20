(function(){
'use strict';

const body=document.body;
const scriptSrc=body.dataset.storeScript||'';
const announcement=document.querySelector('.announcement');

function lockStore(){
  body.classList.add('store-gated');
  body.classList.remove('store-open','store-preview');
  if(announcement) announcement.textContent='Store coming soon.';
}

function loadStoreScript(){
  if(!scriptSrc||document.querySelector(`script[data-vt-store-runtime="${scriptSrc}"]`)) return;
  const script=document.createElement('script');
  script.src=scriptSrc;
  script.async=false;
  script.dataset.vtStoreRuntime=scriptSrc;
  document.body.appendChild(script);
}

function openStore(settings,{preview=false}={}){
  body.classList.remove('store-gated');
  body.classList.add('store-open');
  body.classList.toggle('store-preview',preview);

  if(announcement){
    announcement.textContent=preview
      ? 'ADMIN PREVIEW · STORE REMAINS LOCKED TO CUSTOMERS'
      : (settings?.banner_text||'VoltTech PC Parts');
  }

  loadStoreScript();
}

async function canAdminPreview(VT){
  if(new URLSearchParams(location.search).get('preview')!=='1') return false;
  const client=VT.getClient();
  const {data:{user}}=await client.auth.getUser();
  if(!user) return false;
  const {data,error}=await client.rpc('is_volttech_admin');
  return !error && data===true;
}

async function init(){
  lockStore();

  try{
    const VT=window.VoltTechStore;
    if(!VT||typeof VT.getClient!=='function') return;

    const {data,error}=await VT.getClient()
      .from('store_settings')
      .select('catalogue_enabled,banner_text')
      .eq('id','store')
      .single();

    if(error) return;

    if(data?.catalogue_enabled){
      openStore(data);
      return;
    }

    if(await canAdminPreview(VT)){
      openStore(data,{preview:true});
    }
  }catch(error){
    console.error('VoltTech store launch gate:',error);
    lockStore();
  }
}

init();
})();