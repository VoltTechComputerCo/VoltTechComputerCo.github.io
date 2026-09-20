(function(){
'use strict';

const body=document.body;
const gate=document.getElementById('builderGate');
const state=document.getElementById('builderState');
const catalogueNote=document.getElementById('catalogue-note');

let previewObserver=null;

function installPhase6Styles(){
  if(document.querySelector('link[data-vt-phase6-builder]')) return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='./phase6-unification.css?v=1';
  link.dataset.vtPhase6Builder='1';
  document.head.appendChild(link);
}


function lockBuilder(){
  body.classList.add('builder-gated');
  body.classList.remove('builder-open','builder-preview');
  gate?.removeAttribute('hidden');
  window.__VT_BUILDER_PREVIEW=false;
  if(state) state.textContent='Coming Soon';
}

function openBuilder({preview=false}={}){
  body.classList.remove('builder-gated');
  body.classList.add('builder-open');
  body.classList.toggle('builder-preview',preview);
  gate?.setAttribute('hidden','');
  window.__VT_BUILDER_PREVIEW=preview;

  if(state){
    state.textContent=preview?'Admin Preview · Locked':'Builder Live';
  }

  if(preview){
    installPreviewNotice();
    enforcePreviewSafety();
  }

  const script=document.createElement('script');
  script.type='module';
  script.src='./js/app.js?v=3.2.0';
  document.body.appendChild(script);
}

function installPreviewNotice(){
  if(document.getElementById('vt-builder-preview-notice')) return;
  const notice=document.createElement('div');
  notice.id='vt-builder-preview-notice';
  notice.className='builder-preview-notice';
  notice.innerHTML='<b>ADMIN PREVIEW</b><span>Builder remains locked to customers. Save and quote-request actions are disabled.</span>';
  document.querySelector('.topbar')?.insertAdjacentElement('afterend',notice);
}

function enforcePreviewSafety(){
  const apply=()=>{
    const save=document.getElementById('vt-save-build');
    const quote=document.getElementById('vt-request-quote');

    if(save){
      save.disabled=true;
      save.textContent='Preview only · saving disabled';
      save.title='Builder is paused and this admin preview cannot save builds.';
    }
    if(quote){
      quote.disabled=true;
      quote.textContent='Quote requests paused';
      quote.title='Custom PC build quote requests are currently paused.';
    }
  };

  apply();
  previewObserver?.disconnect();
  previewObserver=new MutationObserver(apply);
  previewObserver.observe(document.body,{childList:true,subtree:true});
}

function installCatalogueStatus(){
  window.addEventListener('volttech:catalogue-ready',event=>{
    const detail=event.detail||{};
    const matched=Number(detail.storeOverlayMatched||0);
    const available=Number(detail.storeOverlayAvailable||0);

    if(!catalogueNote) return;

    const current=catalogueNote.textContent||'';
    const source=detail.storeOverlaySource==='supabase-store-products'
      ? `${matched}/${available} Store catalogue fixtures linked`
      : 'Local Builder catalogue fallback';

    catalogueNote.textContent=`${current} · ${source}.`;
  });
}

async function canAdminPreview(client){
  if(new URLSearchParams(location.search).get('preview')!=='1') return false;

  const {data:{user}}=await client.auth.getUser();
  if(!user) return false;

  const {data,error}=await client.rpc('is_volttech_admin');
  return !error && data===true;
}

async function init(){
  installPhase6Styles();
  lockBuilder();
  installCatalogueStatus();

  try{
    if(typeof supabase==='undefined'||typeof VOLTTECH_SUPABASE==='undefined') return;

    const client=supabase.createClient(
      VOLTTECH_SUPABASE.url,
      VOLTTECH_SUPABASE.publishableKey,
      {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}
    );

    const {data,error}=await client
      .from('store_settings')
      .select('builder_enabled')
      .eq('id','store')
      .single();

    if(error) return;

    if(data?.builder_enabled){
      openBuilder();
      return;
    }

    if(await canAdminPreview(client)){
      openBuilder({preview:true});
    }
  }catch(error){
    console.error('VoltTech builder launch gate:',error);
    lockBuilder();
  }
}

init();
})();