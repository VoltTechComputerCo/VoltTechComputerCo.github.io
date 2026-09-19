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

function render(){
  if(els.catalogue) els.catalogue.checked=!!settings.catalogue_enabled;
  if(els.builder) els.builder.checked=!!settings.builder_enabled;
  if(els.status){
    els.status.textContent=
      `STORE ${settings.catalogue_enabled?'OPEN':'LOCKED'} · `+
      `BUILDER ${settings.builder_enabled?'OPEN':'LOCKED'}`;
  }
}

async function load(){
  const {data,error}=await client
    .from('store_settings')
    .select('id,catalogue_enabled,builder_enabled,banner_text')
    .eq('id','store')
    .single();
  if(error) throw error;
  settings=data||{};
  render();
}

async function save(){
  const catalogue=!!els.catalogue?.checked;
  const builder=!!els.builder?.checked;
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
        ?'VoltTech PC Parts — checkout first, then we confirm live stock and delivery before payment.'
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
    render();
    VT.toast('Launch access updated.');
  }catch(error){
    console.error(error);
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
