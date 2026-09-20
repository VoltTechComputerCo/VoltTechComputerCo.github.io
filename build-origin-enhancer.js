(function(){
'use strict';
if(window.__vtBuildTrailEnhancerV2)return;
window.__vtBuildTrailEnhancerV2=true;

const id=new URLSearchParams(location.search).get('id');

async function getTrail(){
  if(!id||typeof supabase==='undefined'||typeof VOLTTECH_SUPABASE==='undefined')return null;
  const client=supabase.createClient(VOLTTECH_SUPABASE.url,VOLTTECH_SUPABASE.publishableKey);
  const {data,error}=await client
    .from('saved_builds')
    .select('quote_id,status')
    .eq('id',id)
    .maybeSingle();
  return error?null:data;
}

function inject(data){
  const sheet=document.querySelector('#document .sheet');
  if(!sheet||sheet.querySelector('.vt-doc-origin[data-vt-build-trail]'))return false;

  const box=document.createElement('div');
  box.className='vt-doc-origin';
  box.dataset.vtBuildTrail='1';
  box.innerHTML='<b>Commercial trail</b><span>This configuration is the source record for any linked quotation or invoice.</span>';

  if(data?.quote_id){
    const a=document.createElement('a');
    a.className='vt-origin-link';
    a.href=`quote.html?id=${encodeURIComponent(data.quote_id)}`;
    a.textContent='Open linked quote →';
    box.appendChild(a);
  }

  sheet.appendChild(box);
  return true;
}

async function init(){
  const data=await getTrail();
  if(!data)return;

  if(inject(data))return;

  const host=document.querySelector('#document');
  if(!host)return;

  const observer=new MutationObserver(()=>{
    if(inject(data))observer.disconnect();
  });

  observer.observe(host,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),12000);
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init,{once:true});
}else{
  init();
}
})();