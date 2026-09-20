(function(){
'use strict';

const VT=window.VoltTechStore;
if(!VT||typeof VT.getClient!=='function') return;

const client=VT.getClient();
const els={
  status:document.getElementById('launchStatus'),
  catalogue:document.getElementById('catalogueEnabledSetting'),
  builder:document.getElementById('builderEnabledSetting'),
  save:document.getElementById('saveLaunchSettings')
};
let settings={};
let readiness=null;

function blockerText(){
  if(!readiness) return '';
  const reasons=Array.isArray(readiness.reasons)?readiness.reasons:[];
  return reasons.join(' · ');
}

function render(){
  if(els.catalogue){
    els.catalogue.checked=!!settings.catalogue_enabled;
    els.catalogue.disabled=!settings.catalogue_enabled && readiness && !readiness.store_ready;
    els.catalogue.title=els.catalogue.disabled?blockerText():'';
  }

  if(els.builder){
    els.builder.checked=!!settings.builder_enabled;
    els.builder.disabled=!settings.builder_enabled && readiness && !readiness.builder_ready;
    els.builder.title=readiness?.builder_locked_reason||'';
  }

  if(els.status){
    if(settings.catalogue_enabled||settings.builder_enabled){
      els.status.textContent=
        `STORE ${settings.catalogue_enabled?'OPEN':'LOCKED'} · `+
        `BUILDER ${settings.builder_enabled?'OPEN':'LOCKED'}`;
      return;
    }

    if(readiness){
      const store=readiness.store_ready?'READY':'BLOCKED';
      const builder=readiness.builder_ready?'READY':'PAUSED';
      els.status.textContent=`STORE ${store} · BUILDER ${builder}`;
      els.status.title=blockerText();
      return;
    }

    els.status.textContent='CHECKING READINESS';
  }
}

async function loadReadiness(){
  const {data,error}=await client.rpc('admin_store_launch_readiness');
  if(error) throw error;
  readiness=data||null;
}

async function load(){
  const [{data,error}]=await Promise.all([
    client
      .from('store_settings')
      .select('id,catalogue_enabled,builder_enabled,banner_text')
      .eq('id','store')
      .single(),
    loadReadiness()
  ]);

  if(error) throw error;
  settings=data||{};
  render();

  if(readiness&&!readiness.store_ready){
    const reasons=blockerText();
    if(reasons) console.info('VoltTech store launch blockers:',reasons);
  }
}

async function save(){
  const catalogue=!!els.catalogue?.checked;
  const builder=!!els.builder?.checked;

  if(catalogue&&!settings.catalogue_enabled&&!readiness?.store_ready){
    VT.toast(blockerText()||'Store launch readiness checks have not passed.','error');
    render();
    return;
  }

  if(builder&&!settings.builder_enabled&&!readiness?.builder_ready){
    VT.toast(readiness?.builder_locked_reason||'PC Builder launch is currently paused.','error');
    render();
    return;
  }

  const enabling=
    (catalogue&&!settings.catalogue_enabled)||
    (builder&&!settings.builder_enabled);

  if(enabling&&!window.confirm(
    'Make the selected customer-facing feature live? Only continue when VoltTech is ready to release it.'
  )){
    render();
    return;
  }

  if(els.save){
    els.save.disabled=true;
    els.save.textContent='Saving…';
  }

  try{
    const patch={
      catalogue_enabled:catalogue,
      builder_enabled:builder,
      banner_text:catalogue
        ?'VoltTech PC Parts — secure checkout with live stock and delivery confirmation.'
        :'Store coming soon.',
      updated_at:new Date().toISOString()
    };

    const {data,error}=await client
      .from('store_settings')
      .update(patch)
      .eq('id','store')
      .select('id,catalogue_enabled,builder_enabled,banner_text')
      .single();

    if(error) throw error;

    settings=data||patch;
    await loadReadiness();
    render();
    VT.toast('Launch access updated.');
  }catch(error){
    console.error(error);
    await loadReadiness().catch(()=>{});
    render();
    VT.toast(error.message||'Could not update launch access.','error');
  }finally{
    if(els.save){
      els.save.disabled=false;
      els.save.textContent='Save launch access';
    }
  }
}

async function init(){
  try{
    const {data:{user}}=await client.auth.getUser();
    if(!user) return;

    const admin=await client.rpc('is_volttech_admin');
    if(admin.error||!admin.data) return;

    els.save?.addEventListener('click',save);
    await load();
  }catch(error){
    console.error('VoltTech launch controls:',error);
    if(els.status) els.status.textContent='CONTROL ERROR';
  }
}

init();
})();
