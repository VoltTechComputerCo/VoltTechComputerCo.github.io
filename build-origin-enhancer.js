(function(){
'use strict';
if(window.__vtBuildTrailEnhancer)return;
window.__vtBuildTrailEnhancer=true;

async function init(){
  if(typeof supabase==='undefined'||typeof VOLTTECH_SUPABASE==='undefined')return;
  const id=new URLSearchParams(location.search).get('id');
  if(!id)return;
  const client=supabase.createClient(VOLTTECH_SUPABASE.url,VOLTTECH_SUPABASE.publishableKey);

  const {data,error}=await client.from('saved_builds').select('quote_id,status').eq('id',id).maybeSingle();
  if(error||!data)return;

  const sheet=document.querySelector('#document .sheet');
  if(!sheet)return;

  const box=document.createElement('div');
  box.className='vt-doc-origin';
  box.innerHTML='<b>Commercial trail</b><span>This configuration is the source record for any linked quotation or invoice.</span>';
  if(data.quote_id){
    const a=document.createElement('a');
    a.className='vt-origin-link';
    a.href=`quote.html?id=${encodeURIComponent(data.quote_id)}`;
    a.textContent='Open linked quote →';
    box.appendChild(a);
  }
  sheet.appendChild(box);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,80),{once:true});
else setTimeout(init,80);
})();